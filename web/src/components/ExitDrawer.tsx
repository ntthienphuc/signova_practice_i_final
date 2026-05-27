import { LogOut } from "lucide-react";

interface ExitDrawerProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExitDrawer({ open, onConfirm, onCancel }: ExitDrawerProps) {
  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0 }}
        onClick={onCancel}
      />

      {/* Drawer panel */}
      <div
        className="max-w-[767px] mx-auto absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] px-10 pt-10 pb-8 shadow-2xl transition-transform duration-300 ease-out"
        style={{
          borderTop: "3px solid #e2e8f0",
          transform: open ? "translateY(0)" : "translateY(100%)",
        }}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-5" />

        <div className="flex items-start gap-4 mb-6 ">
          <div
            className="w-12 h-12 rounded-2xl grid place-items-center flex-shrink-0"
            style={{ backgroundColor: "#fff1f0", border: "2px solid #fecaca" }}
          >
            <LogOut size={20} color="#ef4444" />
          </div>
          <div>
            <h3 className="m-0 font-black text-slate-800 text-lg leading-tight">
              Thoát bài học?
            </h3>
            <p className="m-0 text-slate-500 text-sm font-medium mt-1 leading-relaxed">
              Tiến trình của bạn sẽ được lưu lại. Bạn có thể quay lại bất cứ lúc nào.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-4 rounded-2xl font-black text-white text-sm cursor-pointer transition-all active:translate-y-[1px]"
            style={{
              backgroundColor: "#ef4444",
              border: "none",
              borderBottom: "3px solid #dc2626",
            }}
          >
            Thoát bài học
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-4 rounded-2xl font-black text-slate-700 text-sm cursor-pointer transition-all hover:bg-slate-100 active:translate-y-[1px]"
            style={{
              backgroundColor: "white",
              border: "2px solid #e2e8f0",
              borderBottom: "3px solid #d1d5db",
            }}
          >
            Ở lại và tiếp tục học 💪
          </button>
        </div>
      </div>
    </div>
  );
}
