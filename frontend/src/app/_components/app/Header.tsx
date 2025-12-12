"use client";

import React from "react";
import { Menu, Upload, X } from "lucide-react";
import type { ViewKey } from "../../_types/app";
import UserInfoButton from "../auth/UserInfoButton";
import { useAuth } from "../auth/AuthContext";

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
  const { email } = useAuth();
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <nav className="flex items-center justify-between px-4 sm:px-6 py-4">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onNavigate("home")}
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            F
          </div>
          <span className="text-xl font-bold text-slate-800">DocuFlowAI</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <button
            onClick={() => onNavigate("home")}
            className={`hover:text-blue-600 transition-colors ${
              view === "home" ? "text-blue-600" : ""
            }`}
          >
            Trang chủ
          </button>
          <button
            onClick={() => onNavigate("tools")}
            className={`hover:text-blue-600 transition-colors ${
              view === "tools" ? "text-blue-600" : ""
            }`}
          >
            Công cụ
          </button>
          <button
            onClick={() => onNavigate("pricing")}
            className={`hover:text-blue-600 transition-colors ${
              view === "pricing" ? "text-blue-600" : ""
            }`}
          >
            Giá cả
          </button>
          <button
            onClick={() => onNavigate("about")}
            className={`hover:text-blue-600 transition-colors ${
              view === "about" ? "text-blue-600" : ""
            }`}
          >
            Giới thiệu & FAQ
          </button>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {email ? (
            <UserInfoButton />
          ) : (
            <button
              onClick={() => onNavigate("login")}
              className="px-4 py-2 text-sm font-medium border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 active:scale-[0.98] active:shadow-inner transition duration-150 shadow-sm flex items-center gap-2"
            >
              Đăng nhập
            </button>
          )}
          <button
            onClick={() => onNavigate("tools")}
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
              onClick={() => onNavigate("home")}
              className={`flex justify-between items-center py-2 hover:text-blue-600 transition-colors ${
                view === "home" ? "text-blue-600" : ""
              }`}
            >
              Trang chủ
            </button>
            <button
              onClick={() => onNavigate("tools")}
              className={`flex justify-between items-center py-2 hover:text-blue-600 transition-colors ${
                view === "tools" ? "text-blue-600" : ""
              }`}
            >
              Công cụ
            </button>
            <button
              onClick={() => onNavigate("pricing")}
              className={`flex justify-between items-center py-2 hover:text-blue-600 transition-colors ${
                view === "pricing" ? "text-blue-600" : ""
              }`}
            >
              Giá cả
            </button>
            <button
              onClick={() => onNavigate("about")}
              className={`flex justify-between items-center py-2 hover:text-blue-600 transition-colors ${
                view === "about" ? "text-blue-600" : ""
              }`}
            >
              Giới thiệu & FAQ
            </button>
            <div className="flex flex-col gap-2 pt-2">
              {email ? (
                <div className="w-full flex justify-start">
                  <UserInfoButton />
                </div>
              ) : (
                <button
                  onClick={() => onNavigate("login")}
                  className="w-full px-4 py-2 text-sm font-medium border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 active:scale-[0.98] active:shadow-inner transition duration-150 shadow-sm flex items-center justify-center gap-2"
                >
                  Đăng nhập
                </button>
              )}
              <button
                onClick={() => onNavigate("tools")}
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
