import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { mascots } from "../../utils/mascot";
import {
  getMascotShop, purchaseMascotItem, equipMascotItem, getMascotConfig,
} from "../../api";
import type { MascotItem, MascotConfig } from "../../api";
import { getMascotAssetUrl } from "../../utils/mascotAssets";

interface MascotTabProps {
  onOpenAuth: () => void;
}

export function MascotTab({ onOpenAuth }: MascotTabProps) {
  const { currentUser } = useAuth();
  const [shopItems, setShopItems] = useState<MascotItem[]>([]);
  const [mascotConfig, setMascotConfig] = useState<MascotConfig | null>(null);
  const [localXp, setLocalXp] = useState<number | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [equipping, setEquipping] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.role !== "learner") return;
    Promise.all([getMascotShop(), getMascotConfig()]).then(([shop, cfg]) => {
      setShopItems(shop.items);
      setMascotConfig(cfg);
    }).catch(() => {});
  }, [currentUser?.role]);

  async function handlePurchase(key: string) {
    setPurchasing(key);
    try {
      const res = await purchaseMascotItem(key);
      setLocalXp(res.xp_remaining);
      const [shop, cfg] = await Promise.all([getMascotShop(), getMascotConfig()]);
      setShopItems(shop.items);
      setMascotConfig(cfg);
    } catch {
      // silent
    } finally {
      setPurchasing(null);
    }
  }

  async function handleEquip(key: string | null) {
    setEquipping(key ?? "unequip");
    try {
      const cfg = await equipMascotItem(key);
      setMascotConfig(cfg);
    } catch {
      // silent
    } finally {
      setEquipping(null);
    }
  }

  if (!currentUser) {
    return (
      <section className="bg-white border-2 border-b-4 border-slate-200 rounded-[28px] p-8 text-center py-16">
        <div className="text-5xl mb-4">🐾</div>
        <h2 className="m-0 font-black text-slate-800 text-2xl">Đăng nhập để mở Cửa hàng</h2>
        <p className="text-slate-500 font-bold mt-2 max-w-xs mx-auto text-sm">Dùng XP kiếm được để trang trí linh vật học tập của bạn!</p>
        <button
          onClick={onOpenAuth}
          type="button"
          className="px-6 py-3 bg-[#1cb0f6] border-b-4 border-[#1899d6] text-white font-black rounded-2xl cursor-pointer hover:bg-[#24c4ff] active:border-b-0 active:translate-y-[3px] transition-all text-base mt-6"
        >
          Đăng nhập ngay 🚀
        </button>
      </section>
    );
  }

  if (currentUser.role !== "learner") {
    return (
      <section className="bg-white border-2 border-b-4 border-slate-200 rounded-[28px] p-8 text-center py-16">
        <div className="text-5xl mb-4">🐾</div>
        <h2 className="m-0 font-black text-slate-800 text-2xl">Cửa hàng linh vật</h2>
        <p className="text-slate-500 font-bold mt-2 max-w-xs mx-auto text-sm">Tính năng này dành cho tài khoản học viên.</p>
      </section>
    );
  }

  const activeItem = shopItems.find(i => i.item_key === mascotConfig?.active_item_key);
  const mascotImageUrl = activeItem ? getMascotAssetUrl(activeItem.mascot_filename) : undefined;
  const displayXp = localXp ?? currentUser.learner_profile?.xp ?? 0;
  const isAnyBuying = purchasing !== null;
  const isAnyEquipping = equipping !== null;

  return (
    <section className="space-y-5">
      {/* Hero — mascot display */}
      <div className="bg-white border-2 border-b-4 border-slate-200 rounded-[28px] p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative flex-shrink-0">
          <div className="w-32 h-32 rounded-3xl overflow-hidden bg-slate-50 border-2 border-slate-100 flex items-center justify-center">
            <img
              src={mascotImageUrl ?? mascots[9]}
              alt="Linh vật"
              className="w-full h-full object-contain"
              style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.10))" }}
            />
          </div>
          {activeItem && (
            <span className="absolute -bottom-2 -right-2 bg-[#1cb0f6] text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white select-none">
              ✓ Đang mặc
            </span>
          )}
        </div>
        <div className="text-center sm:text-left flex-1">
          <p className="m-0 text-sm uppercase tracking-[0.18em] text-[#1cb0f6] font-black">🐾 Linh vật của bạn</p>
          <h2 className="m-0 mt-1 font-black text-slate-800 text-2xl">
            {activeItem ? activeItem.name : "Mặc định"}
          </h2>
          <p className="text-slate-500 mt-1 font-bold text-sm">
            {activeItem ? activeItem.description ?? "Đang trang bị trang phục này." : "Mua trang phục bên dưới để tùy chỉnh linh vật!"}
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 bg-[#f0f8ff] border-2 border-[#1cb0f6]/30 text-[#1cb0f6] font-black text-sm px-3 py-1 rounded-full select-none">
            ⭐ {displayXp} XP
          </div>
        </div>
      </div>

      {/* Shop grid */}
      <div className="bg-white border-2 border-b-4 border-slate-200 rounded-[28px] p-5 space-y-4">
        <h3 className="text-xl font-black text-slate-800 border-b-2 border-slate-100 pb-3 flex items-center gap-2 m-0 select-none">
          🛒 Cửa hàng
        </h3>

        {shopItems.length === 0 ? (
          <div className="text-slate-400 font-bold text-center py-8">Đang tải cửa hàng...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {shopItems.map((item) => {
              const isActive = mascotConfig?.active_item_key === item.item_key;
              const canAfford = displayXp >= item.xp_cost;
              const isBuying = purchasing === item.item_key;
              const previewUrl = getMascotAssetUrl(item.mascot_filename);

              return (
                <div
                  key={item.item_key}
                  className={`border-2 rounded-[20px] p-3 flex flex-col items-center gap-2 transition-all ${
                    isActive
                      ? "border-b-4 border-[#1cb0f6] bg-[#f0f8ff]"
                      : "border-b-4 border-slate-200 bg-white"
                  }`}
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                    {previewUrl ? (
                      <img src={previewUrl} alt={item.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl select-none">🎭</div>
                    )}
                  </div>

                  <div className="text-center w-full">
                    <h4 className="font-black text-slate-800 text-sm m-0 leading-tight">{item.name}</h4>
                    {item.description && (
                      <p className="text-[10px] text-slate-400 mt-0.5 m-0 leading-tight">{item.description}</p>
                    )}
                  </div>

                  {!item.owned && (
                    <span className="bg-[#fff8ee] text-[#ff9600] font-black text-xs px-2.5 py-0.5 rounded-full border border-[#ff9600]/30 select-none">
                      ⭐ {item.xp_cost} XP
                    </span>
                  )}

                  {item.owned ? (
                    <button
                      onClick={() => handleEquip(isActive ? null : item.item_key)}
                      disabled={isAnyEquipping}
                      type="button"
                      className={`w-full py-2 rounded-xl font-black text-xs border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${
                        isActive
                          ? "bg-[#1cb0f6] border-b-2 border-[#1899d6] text-white hover:bg-[#24c4ff] active:border-b-0 active:translate-y-[2px]"
                          : "bg-slate-100 border-b-2 border-slate-300 text-slate-600 hover:bg-slate-200 active:border-b-0 active:translate-y-[2px]"
                      }`}
                    >
                      {isAnyEquipping && (equipping === item.item_key || (equipping === "unequip" && isActive))
                        ? "..."
                        : isActive
                        ? "✓ Đang mặc · Bỏ"
                        : "Trang bị"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePurchase(item.item_key)}
                      disabled={!canAfford || isAnyBuying}
                      type="button"
                      className="w-full py-2 rounded-xl font-black text-xs border-2 border-b-2 bg-[#58cc02] border-[#46a302] text-white hover:bg-[#66d60e] active:border-b-0 active:translate-y-[2px] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                    >
                      {isBuying ? "..." : canAfford ? `Mua — ${item.xp_cost} XP` : "Cần thêm XP"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
