"use client";

import React from "react";
import { Check } from "lucide-react";
import type { SelectedPlan } from "../../_types/app";
import { BACKEND_URL } from "../../_config/app";
import { useAuth } from "../auth/AuthContext";

const FEATURES_ORDER = [
  "Công nghệ OCR nâng cao",
  "JPG sang PNG",
  "Word sang PDF",
  "Nhận diện chữ viết tay",
];

const PERMISSIONS_ORDER = [
  "Tích hợp AI",
  "Tốc độ ưu tiên",
  "Hỗ trợ 24/7",
];

type Props = {
  selectedPlan: SelectedPlan;
  onSelectPlan: (plan: Exclude<SelectedPlan, null>) => void;
  onStartFree: () => void | Promise<void>;
};

export default function PricingPage({
  selectedPlan,
  onSelectPlan,
  onStartFree,
}: Props) {
  const { email, planKey: authPlanKey } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [plans, setPlans] = React.useState<
    Array<{
      id: number;
      name: string;
      price_vnd: number;
      billing_cycle: string;
      doc_limit_per_month: number;
      features: string[];
      notes: string | null;
    }>
  >([]);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BACKEND_URL}/plans`);
        if (!res.ok) throw new Error(`Không thể tải danh sách gói (${res.status}).`);
        const data = (await res.json()) as typeof plans;
        if (!cancelled) setPlans(Array.isArray(data) ? data : []);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Không thể tải danh sách gói");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = React.useMemo(() => {
    const normalize = (s: string) => (s || "").trim().toLowerCase();
    const isContact = (name: string) => {
      const n = normalize(name);
      return n === "liên hệ" || n === "lien he" || n === "lien hệ";
    };

    const sorted = plans.slice().sort((a, b) => {
      const aContact = isContact(a.name);
      const bContact = isContact(b.name);
      if (aContact && !bContact) return 1;
      if (!aContact && bContact) return -1;
      return (a.price_vnd ?? 0) - (b.price_vnd ?? 0);
    });

    return sorted;
  }, [plans]);

  const formatPrice = (vnd: number) => {
    try {
      return new Intl.NumberFormat("vi-VN").format(vnd) + "đ";
    } catch {
      return String(vnd) + "đ";
    }
  };

  const formatCycle = (cycle: string) => {
    const c = (cycle || "").toLowerCase();
    if (c === "month") return "/tháng";
    if (c === "year") return "/năm";
    if (c === "lifetime") return "";
    return c ? `/${cycle}` : "";
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">
          Bảng giá linh hoạt
        </h2>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Chọn gói phù hợp với nhu cầu của bạn. Bắt đầu miễn phí và nâng cấp khi
          bạn cần nhiều tính năng hơn.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {loading ? (
          <div className="col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center text-slate-500">
            Đang tải gói…
          </div>
        ) : error ? (
          <div className="col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center text-rose-600">
            {error}
          </div>
        ) : (
          cards.map((p) => {
            const cardPlanKey = `plan:${p.id}`;
            const isSelected = selectedPlan === cardPlanKey;
            const isFree = (p.price_vnd ?? 0) === 0;
            const isContact = (() => {
              const n = p.name.trim().toLowerCase();
              return n === "liên hệ" || n === "lien he" || n === "lien hệ";
            })();
            const isPaid = !isFree;
            const isUsingFree = !!email && !isContact && isFree && authPlanKey === "free";

            const cardClass = isPaid
              ? `bg-slate-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden cursor-pointer transition ${
                  isSelected ? "ring-2 ring-blue-400 scale-[1.01]" : ""
                }`
              : `bg-white p-8 rounded-2xl border shadow-sm transition-all hover:shadow-md cursor-pointer ${
                  isSelected
                    ? "border-blue-500 shadow-lg shadow-blue-100 scale-[1.01]"
                    : "border-slate-200"
                }`;

            const titleClass = isPaid
              ? "text-lg font-medium text-blue-200 mb-2"
              : "text-lg font-medium text-slate-700 mb-2";

            const priceClass = isPaid
              ? "text-4xl font-bold mb-6"
              : "text-4xl font-bold text-slate-800 mb-6";

            const priceUnitClass = isPaid
              ? "text-sm font-normal text-slate-400"
              : "text-sm font-normal text-slate-400";

            const okIconClass = isPaid ? "text-blue-400" : "text-green-500";
            const okTextClass = isPaid ? "text-white" : "text-slate-600";
            const noTextClass = isPaid ? "text-slate-400" : "text-slate-400";

            const buttonClass = isPaid
              ? "w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-900/50"
              : isUsingFree
                ? "w-full py-3 border border-slate-300 text-slate-400 font-semibold rounded-xl cursor-not-allowed"
                : "w-full py-3 border border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 active:scale-[0.99] transition duration-150";

            return (
              <div
                key={cardPlanKey}
                role="button"
                tabIndex={0}
                onClick={() => onSelectPlan(cardPlanKey)}
                onKeyDown={(e) => e.key === "Enter" && onSelectPlan(cardPlanKey)}
                className={cardClass}
              >
                <div className={titleClass}>{p.name}</div>
                <div className={priceClass}>
                  {formatPrice(p.price_vnd)}
                  <span className={priceUnitClass}>{formatCycle(p.billing_cycle)}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className={`flex items-center gap-3 ${okTextClass}`}>
                    <Check size={18} className={okIconClass} /> {p.doc_limit_per_month ?? 0} tài liệu/tháng
                  </li>

                  {(() => {
                    const raw = Array.isArray(p.features) ? p.features : [];
                    const set = new Set(raw.map((x) => String(x)));

                    const orderedSelected: string[] = [];
                    for (const f of FEATURES_ORDER) if (set.has(f)) orderedSelected.push(f);
                    for (const f of PERMISSIONS_ORDER) if (set.has(f)) orderedSelected.push(f);

                    // Keep any unknown/custom features (created by admin) after known items.
                    const known = new Set([...FEATURES_ORDER, ...PERMISSIONS_ORDER]);
                    const extras = raw
                      .map((x) => String(x))
                      .filter((x) => x.trim())
                      .filter((x) => !known.has(x));
                    for (const x of extras) if (!orderedSelected.includes(x)) orderedSelected.push(x);


                    return orderedSelected.map((f) => (
                      <li key={f} className={`flex items-center gap-3 ${okTextClass}`}>
                        <Check size={18} className={okIconClass} /> {f}
                      </li>
                    ));
                  })()}

                  {p.notes?.trim() ? (
                    <li className={`flex items-start gap-3 ${isPaid ? "text-slate-200" : "text-slate-600"}`}>
                      <Check size={18} className={okIconClass} />
                      <span>{p.notes.trim()}</span>
                    </li>
                  ) : null}
                </ul>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPlan(cardPlanKey);
                    if (!isUsingFree && isFree && !isContact) void onStartFree();
                  }}
                  className={buttonClass}
                  disabled={isUsingFree}
                >
                  {isContact
                    ? "Liên hệ"
                    : isFree
                      ? isUsingFree
                        ? "Đang sử dụng"
                        : "Bắt đầu miễn phí"
                      : "Chọn gói"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
