"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Github,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  User,
} from "lucide-react";
import GoogleIcon from "../icons/GoogleIcon";
import type { ViewKey } from "../../_types/app";
import { BACKEND_URL } from "../../_config/app";

type Props = {
  onNavigate: (view: ViewKey) => void;
  onAuthSuccess?: (role: "user" | "admin") => void;
};

import { useAuth } from "../auth/AuthContext";

export default function AuthPage({ onNavigate, onAuthSuccess }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuth } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setError(null);

    try {
      if (!isLogin) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Mật khẩu xác nhận không khớp.");
        }

        const regRes = await fetch(`${BACKEND_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        if (!regRes.ok) {
          const msg = await regRes.text();
          throw new Error(msg || `Đăng ký thất bại (${regRes.status}).`);
        }

        // Sau khi đăng ký thành công, chuyển sang form đăng nhập
        setIsLogin(true);
        setIsLoading(false);
        setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
        setError("Đăng ký thành công! Vui lòng đăng nhập.");
        return;
      }

      // Đăng nhập
      const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!loginRes.ok) {
        const msg = await loginRes.text();
        throw new Error(msg || `Đăng nhập thất bại (${loginRes.status}).`);
      }

      const tokenJson = (await loginRes.json()) as { access_token: string };
      setAuth(tokenJson.access_token);

      const meRes = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      });

      if (!meRes.ok) {
        throw new Error("Không thể lấy thông tin tài khoản.");
      }

      const me = (await meRes.json()) as { role: "user" | "admin" };
      if (onAuthSuccess) {
        onAuthSuccess(me.role);
      } else {
        onNavigate("home");
      }
    } catch (err: any) {
      setError(err?.message ?? "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600 blur-[100px]" />
        </div>

        <div
          className="relative z-10 flex items-center space-x-2 text-xl font-bold cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onNavigate("home")}
        >
          <div className="bg-blue-600 p-2 rounded-lg">
            <span className="text-white font-bold text-xl">F</span>
          </div>
          <span className="tracking-wide">
            DocuFlow<span className="text-blue-400">AI</span>
          </span>
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold leading-tight mb-6">
            Tự động hóa quy trình xử lý tài liệu của bạn.
          </h2>
          <p className="text-slate-300 text-lg mb-8">
            Tham gia cùng hơn 2,000 doanh nghiệp đang sử dụng DocuFlowAI để trích
            xuất dữ liệu, phân loại văn bản và tiết kiệm thời gian nhập liệu thủ
            công.
          </p>

          <div className="flex items-center space-x-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs font-medium text-white"
                >
                  U{i}
                </div>
              ))}
            </div>
            <div className="text-sm">
              <div className="font-bold text-white">4.9/5.0 Đánh giá</div>
              <div className="text-slate-300">Từ 500+ khách hàng</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-slate-400 flex space-x-6">
          <a href="#" className="hover:text-white transition-colors">
            Điều khoản dịch vụ
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Chính sách bảo mật
          </a>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-xl lg:shadow-none lg:bg-transparent lg:p-0">
          <div className="lg:hidden flex justify-center mb-6">
            <div
              className="flex items-center space-x-2 text-xl font-bold text-slate-900 cursor-pointer"
              onClick={() => onNavigate("home")}
            >
              <div className="bg-blue-600 p-2 rounded-lg">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span>
                DocuFlow<span className="text-blue-600">AI</span>
              </span>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold text-slate-900">
              {isLogin ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
            </h1>
            <p className="mt-2 text-slate-500">
              {isLogin
                ? "Vui lòng nhập thông tin để truy cập Dashboard."
                : "Bắt đầu dùng thử miễn phí 14 ngày."}
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      required={!isLogin}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                      placeholder="Nguyễn Văn A"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                    placeholder="Email đăng ký tài khoản"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Mật khẩu
                  </label>
                  {isLogin && (
                    <a
                      href="#"
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      Quên mật khẩu?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    className="block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ShieldCheck className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      name="confirmPassword"
                      required={!isLogin}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <RefreshCw className="animate-spin h-5 w-5 mr-2" />
              ) : isLogin ? (
                "Đăng nhập ngay"
              ) : (
                "Tạo tài khoản"
              )}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </button>

            {error && (
              <div className="text-sm text-rose-600 text-center">{error}</div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">
                  Hoặc tiếp tục với
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="w-full inline-flex justify-center py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <GoogleIcon />
                <span className="ml-2">Google</span>
              </button>
              <button
                type="button"
                className="w-full inline-flex justify-center py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Github className="h-5 w-5 text-slate-800" />
                <span className="ml-2">GitHub</span>
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
              <button
                type="button"
                onClick={() => {
                  setIsLogin((v) => !v);
                  setFormData({
                    name: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                  });
                }}
                className="ml-2 font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                {isLogin ? "Đăng ký miễn phí" : "Đăng nhập"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
