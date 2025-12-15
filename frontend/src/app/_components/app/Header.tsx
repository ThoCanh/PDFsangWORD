"use client";

import React from "react";
import { Menu, Upload, X } from "lucide-react";
import type { ViewKey } from "../../_types/app";
import UserInfoButton from "../auth/UserInfoButton";
import { useAuth } from "../auth/AuthContext";
import { useRouter } from "next/navigation";

type Props = {
  view: ViewKey;
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onNavigate: (view: ViewKey) => void;
};

export default function Header({
  view,
  isMobileMenuOpen,
  onToggleMobileMenu,
  onNavigate,
}: Props) {
  const { email, role, logout } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <nav className="relative flex items-center justify-between px-4 sm:px-6 py-4">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            F
          </div>
          <span className="text-xl font-bold text-slate-800">DocuFlowAI</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 absolute left-1/2 -translate-x-1/2">
          <button
            onClick={() => router.push("/")}
            className={`hover:text-blue-600 transition-colors ${
              view === "home" ? "text-blue-600" : ""
            }`}
          >
            Trang chủ
          </button>
          <button
            onClick={() => router.push("/Tools")}
            className={`hover:text-blue-600 transition-colors ${
              view === "tools" ? "text-blue-600" : ""
            }`}
          >
            Công cụ
          </button>
          <button
            onClick={() => router.push("/upgrade")}
            className={`hover:text-blue-600 transition-colors ${
              view === "pricing" ? "text-blue-600" : ""
            }`}
          >
            Giá cả
          </button>
          <button
            onClick={() => router.push("/introduce")}
            className={`hover:text-blue-600 transition-colors ${
              view === "about" ? "text-blue-600" : ""
            }`}
          >
            Giới thiệu & FAQ
          </button>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {email ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="px-4 py-2 text-sm font-medium border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 active:scale-[0.98] active:shadow-inner transition duration-150 shadow-sm flex items-center gap-2"
              >
                <UserInfoButton />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-md py-2">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/account");
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Thông tin tài khoản
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                      router.replace("/login");
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 text-sm font-medium border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 active:scale-[0.98] active:shadow-inner transition duration-150 shadow-sm flex items-center gap-2"
            >
              Đăng nhập
            </button>
          )}
          <button
            onClick={() => router.push("/Tools")}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-shadow shadow-md shadow-blue-200 flex items-center gap-2"
          >
            <Upload size={16} /> Tải lên tệp
          </button>
        </div>

        <button
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          onClick={onToggleMobileMenu}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-sm">
          <div className="px-4 py-3 flex flex-col gap-2 text-sm font-medium text-slate-700">
            <button
              onClick={() => { setMenuOpen(false); router.push("/"); }}
              className={`flex justify-between items-center py-2 hover:text-blue-600 transition-colors ${
                view === "home" ? "text-blue-600" : ""
              }`}
            >
              Trang chủ
            </button>
            <button
              onClick={() => { setMenuOpen(false); router.push("/Tools"); }}
              className={`flex justify-between items-center py-2 hover:text-blue-600 transition-colors ${
                view === "tools" ? "text-blue-600" : ""
              }`}
            >
              Công cụ
            </button>
            <button
              onClick={() => { setMenuOpen(false); router.push("/upgrade"); }}
              className={`flex justify-between items-center py-2 hover:text-blue-600 transition-colors ${
                view === "pricing" ? "text-blue-600" : ""
              }`}
            >
              Giá cả
            </button>
            <button
              onClick={() => { setMenuOpen(false); router.push("/introduce"); }}
              className={`flex justify-between items-center py-2 hover:text-blue-600 transition-colors ${
                view === "about" ? "text-blue-600" : ""
              }`}
            >
              Giới thiệu & FAQ
            </button>
            <div className="flex flex-col gap-2 pt-2">
              {email ? (
                <div className="w-full">
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setMenuOpen((v) => !v)}
                      className="w-full px-4 py-2 text-sm font-medium border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 active:scale-[0.98] active:shadow-inner transition duration-150 shadow-sm flex items-center justify-between gap-2"
                    >
                      <UserInfoButton />
                    </button>
                    {menuOpen && (
                      <div className="absolute right-0 mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-md py-2">
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            router.push("/account");
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Thông tin tài khoản
                        </button>
                        <button
                          onClick={() => {
                            logout();
                            setMenuOpen(false);
                            router.replace("/login");
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setMenuOpen(false); router.push("/login"); }}
                  className="w-full px-4 py-2 text-sm font-medium border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 active:scale-[0.98] active:shadow-inner transition duration-150 shadow-sm flex items-center justify-center gap-2"
                >
                  Đăng nhập
                </button>
              )}
              <button
                onClick={() => { setMenuOpen(false); router.push("/Tools"); }}
                className="w-full px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-shadow shadow-md shadow-blue-200 flex items-center justify-center gap-2"
              >
                <Upload size={16} /> Tải lên tệp
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
