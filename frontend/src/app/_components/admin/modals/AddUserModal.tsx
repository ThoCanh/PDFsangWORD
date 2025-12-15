"use client";

import React from "react";
import { Edit, Lock, Mail, RotateCcw, Save, ShieldCheck, UserPlus, X } from "lucide-react";
import { BACKEND_URL } from "../../../_config/app";

type UserDraft = {
  name?: string;
  email?: string;
  role?: "Admin" | "User";
  status?: "active" | "inactive" | "banned";
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialData?: UserDraft | null;
};

export default function AddUserModal({ isOpen, onClose, onSave, initialData }: Props) {
  if (!isOpen) return null;
  const isEditMode = Boolean(initialData);

  const [name, setName] = React.useState(initialData?.name ?? "");
  const [email, setEmail] = React.useState(initialData?.email ?? "");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setName(initialData?.name ?? "");
    setEmail(initialData?.email ?? "");
    setPassword("");
    setError(null);
    setLoading(false);
  }, [initialData, isOpen]);

  async function handleSave() {
    if (isEditMode) {
      onSave();
      onClose();
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedPassword = password;

    if (!trimmedEmail) {
      setError("Vui lòng nhập email.");
      return;
    }
    if (!trimmedPassword || trimmedPassword.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Tạo tài khoản thất bại (${res.status}).`);
      }

      // Backend default: role=user, plan_key=free
      onSave();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Không thể tạo tài khoản.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-900 flex items-center">
            {isEditMode ? (
              <Edit size={20} className="mr-2 text-blue-600" />
            ) : (
              <UserPlus size={20} className="mr-2 text-indigo-600" />
            )}
            {isEditMode ? "Chỉnh Sửa Thông Tin" : "Thêm Người Dùng Mới"}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Họ tên
              </label>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              />
              <input
                type="email"
                placeholder="email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Vai trò (Role)
              </label>
              <select
                defaultValue={initialData?.role || "User"}
                disabled={!isEditMode}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-700"
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
              {!isEditMode && (
                <div className="mt-1 text-xs text-slate-500">
                  Tạo mới luôn là <span className="font-semibold">User</span> + gói <span className="font-semibold">Free</span>.
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">
                Trạng thái
              </label>
              <select
                defaultValue={initialData?.status || "active"}
                disabled={!isEditMode}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-700"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="banned">Banned</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              {isEditMode ? "Đặt lại mật khẩu" : "Mật khẩu khởi tạo"}
            </label>
            <div className="relative">
              <ShieldCheck
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder={isEditMode ? "Để trống nếu không đổi" : "Nhập mật khẩu (>= 8 ký tự)"}
                value={isEditMode ? "" : password}
                onChange={(e) => {
                  if (!isEditMode) setPassword(e.target.value);
                }}
                className={`w-full pl-9 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
                  isEditMode
                    ? "bg-white text-slate-900 placeholder:text-slate-400"
                    : "bg-slate-50 text-slate-700"
                }`}
                readOnly={isEditMode}
              />
              {isEditMode && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-600 text-xs font-bold hover:underline"
                >
                  <RotateCcw size={14} className="inline mr-1" /> Random
                </button>
              )}
            </div>
            {!isEditMode && (
              <p className="text-xs text-slate-500 mt-1">
                Người dùng sẽ được yêu cầu đổi mật khẩu khi đăng nhập lần đầu.
              </p>
            )}
          </div>

          {error && (
            <div className="text-sm text-rose-600 font-medium">{error}</div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md transition-colors flex items-center disabled:opacity-60 disabled:cursor-not-allowed ${
              isEditMode ? "bg-blue-600 hover:bg-blue-700" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            <Save size={16} className="mr-2" />
            {loading ? "Đang lưu…" : isEditMode ? "Lưu thay đổi" : "Tạo tài khoản"}
          </button>
        </div>
      </div>
    </div>
  );
}
