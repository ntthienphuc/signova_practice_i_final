import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getMascotShop, getMascotConfig } from "../api";
import type { MascotItem, MascotConfig } from "../api";
import { getMascotAssetUrl } from "../utils/mascotAssets";
import { mascots } from "../utils/mascot";

interface WelcomeMascotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeMascotModal({ isOpen, onClose }: WelcomeMascotModalProps) {
  const { currentUser } = useAuth();
  const [shopItems, setShopItems] = useState<MascotItem[]>([]);
  const [mascotConfig, setMascotConfig] = useState<MascotConfig | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isOpen || currentUser?.role !== "learner") return;
    setVisible(false);
    Promise.all([getMascotShop(), getMascotConfig()])
      .then(([shop, cfg]) => {
        const hasOwned = shop.items.some(i => i.owned);
        if (!hasOwned) { onClose(); return; }
        setShopItems(shop.items);
        setMascotConfig(cfg);
        setVisible(true);
      })
      .catch(() => onClose());
  }, [isOpen]);

  if (!isOpen || !visible) return null;

  const ownedItems = shopItems.filter(i => i.owned);
  const activeItem = shopItems.find(i => i.item_key === mascotConfig?.active_item_key);
  const displayItem = activeItem ?? ownedItems[0];
  const mascotImageUrl = getMascotAssetUrl(displayItem.mascot_filename);
  const displayName = currentUser?.learner_profile?.display_name || currentUser?.username || "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[32px] shadow-2xl border-2 border-b-4 border-slate-200 p-8 max-w-sm w-full text-center space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center">
          <div className="w-44 h-44 rounded-3xl overflow-hidden bg-slate-50 border-2 border-slate-100 flex items-center justify-center">
            <img
              src={mascotImageUrl ?? mascots[9]}
              alt="Linh vật"
              className="w-full h-full object-contain"
              style={{ filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.12))" }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-2xl font-black text-slate-800 m-0 leading-snug">
            Xin chào mừng bạn trở lại! 👋
          </h2>
          <p className="text-[#1cb0f6] font-black text-lg m-0">{displayName}</p>
        </div>

        {currentUser?.learner_profile && (
          <div className="flex justify-center gap-3">
            <div className="bg-[#fff8ee] border-2 border-b-4 border-[#ff9600]/40 rounded-2xl px-5 py-2.5 text-center">
              <div className="text-2xl font-black text-[#ff9600] leading-none">
                {currentUser.learner_profile.learning_streak}
              </div>
              <div className="text-[10px] font-black text-[#cc7a00] mt-0.5">🔥 ngày</div>
            </div>
            <div className="bg-[#f0f8ff] border-2 border-b-4 border-[#1cb0f6]/40 rounded-2xl px-5 py-2.5 text-center">
              <div className="text-2xl font-black text-[#1cb0f6] leading-none">
                {currentUser.learner_profile.xp}
              </div>
              <div className="text-[10px] font-black text-[#1899d6] mt-0.5">⭐ XP</div>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          type="button"
          className="w-full py-3 bg-[#1cb0f6] border-b-4 border-[#1899d6] text-white font-black rounded-2xl hover:bg-[#24c4ff] active:border-b-0 active:translate-y-[3px] transition-all text-base"
        >
          Bắt đầu học ngay! 🚀
        </button>
      </div>
    </div>
  );
}
