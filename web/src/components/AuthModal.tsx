import { useState } from "react";
import { loginUser, registerUser } from "../api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, user: any) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("learner"); // learner, parent, school
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (username.length < 3) {
      setError("Tên tài khoản phải từ 3 ký tự trở lên.");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải từ 6 ký tự trở lên.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const data = await loginUser(username, password);
        localStorage.setItem("signova_token", data.access_token);
        onSuccess(data.access_token, null);
        onClose();
      } else {
        const data = await registerUser(username, password, role);
        localStorage.setItem("signova_token", data.access_token);
        onSuccess(data.access_token, null);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md overflow-hidden bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/80 animate-scale-up">
        {/* Header */}
        <div className="relative px-6 py-6 text-center border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-sky-50">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-200/50 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xl leading-none">S</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            {isLogin ? "Đăng Nhập Signova" : "Đăng Ký Tài Khoản"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isLogin ? "Sử dụng tài khoản học sinh, phụ huynh hoặc trường học" : "Tạo tài khoản học và theo dõi lộ trình nhanh chóng"}
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg text-center font-medium">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Tên tài khoản
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-none transition-all text-sm text-slate-800"
              placeholder="Nhập tên tài khoản..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-none transition-all text-sm text-slate-800"
              placeholder="Nhập mật khẩu..."
            />
          </div>

          {/* Role selector for registration */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Vai trò của bạn
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "learner", label: "Cá nhân" },
                  { id: "parent", label: "Phụ huynh" },
                  { id: "school", label: "Trường học" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRole(item.id)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      role === item.id
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-200 cursor-pointer flex items-center justify-center gap-2 border-0"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span>{isLogin ? "Đăng Nhập" : "Đăng Ký"}</span>
            )}
          </button>

          {/* Switch Tab */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-transparent border-0 cursor-pointer"
            >
              {isLogin ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
