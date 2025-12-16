"use client";

import React from "react";
import { Search } from "lucide-react";
import { BACKEND_URL } from "../../../_config/app";
import { getAccessToken } from "../../auth/token";
import { Calendar, CreditCard, Save, X } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
};


export default function AssignPackageModal({ isOpen, onClose, onSave }: Props) {
    const [saving, setSaving] = React.useState(false);
    const [saveResult, setSaveResult] = React.useState<null | { ok: boolean; message: string }>(null);
  const [plans, setPlans] = React.useState<Array<{
    id: number;
    name: string;
    price_vnd: number;
    billing_cycle: string;
  }>>([]);
  const [plansLoading, setPlansLoading] = React.useState(false);
  const [plansError, setPlansError] = React.useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = React.useState<number | null>(null);
  const [email, setEmail] = React.useState("");
  const [checkingEmail, setCheckingEmail] = React.useState(false);
  const [emailCheckResult, setEmailCheckResult] = React.useState<null | { found: boolean; user?: any; error?: string }>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    async function loadPlans() {
      setPlansLoading(true);
      setPlansError(null);
      try {
        const token = getAccessToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const res = await fetch(`${BACKEND_URL}/admin/plans`, { headers });
        if (!res.ok) throw new Error(`Lỗi tải danh sách gói (${res.status})`);
        const data = await res.json();
        if (!cancelled) setPlans(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setPlansError(e instanceof Error ? e.message : "Không thể tải gói");
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    }
    loadPlans();
    return () => { cancelled = true; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center">
            <CreditCard size={20} className="mr-2 text-indigo-600" /> Gán Gói
            Dịch Vụ
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Khách hàng
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setEmailCheckResult(null);
                }}
                placeholder="customer@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900"
                style={{ color: '#111827' }}
              />
              <button
                type="button"
                className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-200 flex items-center gap-1 disabled:opacity-60"
                disabled={checkingEmail || !email.trim()}
                onClick={async () => {
                  setCheckingEmail(true);
                  setEmailCheckResult(null);
                  try {
                    const token = getAccessToken && getAccessToken();
                    const res = await fetch(`${BACKEND_URL}/admin/users`, {
                      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                    });
                    if (!res.ok) throw new Error("Không thể tải danh sách user");
                    const users = await res.json();
                    const found = Array.isArray(users) ? users.find((u) => (u.email || "").toLowerCase() === email.trim().toLowerCase()) : null;
                    setEmailCheckResult(found ? { found: true, user: found } : { found: false });
                  } catch (e) {
                    setEmailCheckResult({ found: false, error: e instanceof Error ? e.message : String(e) });
                  } finally {
                    setCheckingEmail(false);
                  }
                }}
                title="Kiểm tra email này có tồn tại không"
              >
                <Search size={16} /> Kiểm tra
              </button>
            </div>
            {emailCheckResult && (
              <div className={
                emailCheckResult.found
                  ? "text-xs text-emerald-600 mt-1"
                  : emailCheckResult.error
                  ? "text-xs text-rose-600 mt-1"
                  : "text-xs text-rose-600 mt-1"
              }>
                {emailCheckResult.found
                  ? `✔️ Đã tìm thấy user: ${emailCheckResult.user?.email || email}`
                  : emailCheckResult.error
                  ? `Lỗi: ${emailCheckResult.error}`
                  : "Không tìm thấy user với email này"}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Loại Gói
            </label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
              style={{ color: '#111827' }}
              value={selectedPlanId ?? ''}
              onChange={e => setSelectedPlanId(Number(e.target.value) || null)}
              disabled={plansLoading}
            >
              <option value="">Chọn gói…</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({plan.price_vnd?.toLocaleString("vi-VN")}đ/{plan.billing_cycle === 'year' ? 'năm' : plan.billing_cycle === 'month' ? 'tháng' : plan.billing_cycle})
                </option>
              ))}
            </select>
            {plansError && <div className="text-xs text-rose-600 mt-1">{plansError}</div>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ngày bắt đầu
              </label>
              <div className="relative">
                <Calendar
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                />
                <input
                  type="date"
                  className="w-full pl-9 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Thời hạn (Tháng)
              </label>
              <input
                type="number"
                defaultValue={12}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ghi chú (Tùy chọn)
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
              style={{ color: '#111827' }}
              placeholder="Lý do nâng cấp thủ công..."
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
          {saveResult && (
            <div className={saveResult.ok ? "text-emerald-600 text-sm" : "text-rose-600 text-sm"}>
              {saveResult.message}
            </div>
          )}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              disabled={saving}
            >
              Hủy bỏ
            </button>
            <button
              onClick={async () => {
                setSaving(true);
                setSaveResult(null);
                try {
                  if (!email.trim() || !selectedPlanId) {
                    setSaveResult({ ok: false, message: "Vui lòng nhập email và chọn gói." });
                    setSaving(false);
                    return;
                  }
                  const token = getAccessToken && getAccessToken();
                  const res = await fetch(`${BACKEND_URL}/admin/assign-plan`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({ email: email.trim(), plan_id: selectedPlanId }),
                  });
                  const data = await res.json();
                  if (res.ok && data.ok) {
                    setSaveResult({ ok: true, message: `Đã gán gói thành công cho ${data.email}` });
                    onSave && onSave();
                  } else {
                    setSaveResult({ ok: false, message: data.error || "Gán gói thất bại" });
                  }
                } catch (e) {
                  setSaveResult({ ok: false, message: e instanceof Error ? e.message : "Gán gói thất bại" });
                } finally {
                  setSaving(false);
                }
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md transition-colors flex items-center disabled:opacity-60"
              disabled={saving}
            >
              <Save size={16} className="mr-2" /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
