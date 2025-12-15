"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, Copy, ShieldCheck, CreditCard, Download, Info } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { BACKEND_URL } from "../../_config/app";
import { getAccessToken } from "../auth/token";

type SelectedPlan = {
  id: string;
  name: string;
  description: string;
  price: number; // VND
  features: string[];
};

type BankInfo = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
};

type PaymentOrder = {
  order_id: number;
  order_code: string;
  status: string;
  plan_id: number;
  plan_name: string;
  quantity: number;
  subtotal_vnd: number;
  discount_vnd: number;
  total_vnd: number;
  transfer_content: string;
  qr_image_url: string;
  bank: string;
  va_account: string;
};

type Props = {
  planId: string;
};

export default function PaymentPage({ planId }: Props) {
  const router = useRouter();
  const params = useParams();
  const paramPlanId = (() => {
    const v = (params as any)?.planId;
    if (typeof v === "string") return v;
    if (Array.isArray(v) && typeof v[0] === "string") return v[0];
    return "";
  })();

  const effectivePlanId = (String(planId || "").trim() || String(paramPlanId || "").trim());

  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const promoRate = 0.1; // Mock: 10% off

  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const [bankInfo] = useState<BankInfo>({
    bankName: "TPBank",
    accountName: "CÔNG TY CỔ PHẦN DOCUFLOW AI",
    accountNumber: "03456789999",
    branch: "Hội sở chính",
  });

  const displayBankName = order?.bank?.trim() || bankInfo.bankName;
  const displayAccountNumber = order?.va_account?.trim() || bankInfo.accountNumber;

  useEffect(() => {
    let cancelled = false;

    const safeDecode = (value: string) => {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    };

    const normalize = (value: string) => {
      return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}+/gu, "")
        .replace(/\s+/g, " ");
    };

    const toSlug = (value: string) => {
      return normalize(value)
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]/g, "")
        .replace(/\-+/g, "-")
        .replace(/^\-+|\-+$/g, "");
    };

    async function loadPlan() {
      setLoading(true);
      setError(null);
      try {
        const rawParam = String(effectivePlanId || "").trim();
        const decodedParam = safeDecode(rawParam);
        const numericId = (() => {
          const raw = decodedParam.startsWith("plan:") ? decodedParam.split(":", 2)[1] : decodedParam;
          const cleaned = String(raw).trim().replace(/^\+/, "");
          const n = Number(cleaned);
          return Number.isFinite(n) ? n : null;
        })();

        const res = await fetch(`${BACKEND_URL}/plans`);
        if (!res.ok) throw new Error(`Không thể tải danh sách gói (${res.status}).`);
        const data = (await res.json()) as any[];

        const found = Array.isArray(data)
          ? data.find((p) => {
              if (numericId != null) return Number(p?.id) === numericId;
              const name = typeof p?.name === "string" ? p.name : "";
              if (!name) return false;

              const a = normalize(name);
              const b = normalize(decodedParam);
              const bRaw = normalize(rawParam);
              return (
                a === b ||
                a === bRaw ||
                toSlug(name) === toSlug(decodedParam) ||
                toSlug(name) === toSlug(rawParam)
              );
            })
          : null;

        if (!found) {
          const names = Array.isArray(data)
            ? data
                .map((p) => (typeof p?.name === "string" ? p.name.trim() : ""))
                .filter((x) => x)
                .slice(0, 12)
                .join(", ")
            : "";
          throw new Error(
            `Không tìm thấy gói đã chọn (${decodedParam}). Các gói hiện có: ${names || "(trống)"}.`,
          );
        }

        const features: string[] = Array.isArray(found?.features)
          ? found.features.map((x: any) => String(x)).filter((x: string) => x.trim())
          : [];

        // Use notes as a short description if present.
        const notes = typeof found?.notes === "string" ? found.notes.trim() : "";

        const mapped: SelectedPlan = {
          id: String(found.id),
          name: String(found?.name ?? "Gói"),
          description: notes || "Chi tiết gói dịch vụ đã đăng ký.",
          price: Number(found?.price_vnd ?? 0),
          features,
        };

        if (!cancelled) setSelectedPlan(mapped);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Không thể tải gói");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPlan();
    return () => {
      cancelled = true;
    };
  }, [effectivePlanId]);

  // Tính tổng tiền
  const subtotalAmount = useMemo(() => {
    if (order) return order.subtotal_vnd;
    if (!selectedPlan) return 0;
    return selectedPlan.price * quantity;
  }, [order, quantity, selectedPlan]);

  const discountAmount = useMemo(() => {
    if (order) return order.discount_vnd;
    if (!promoApplied) return 0;
    return Math.max(0, Math.round(subtotalAmount * promoRate));
  }, [order, promoApplied, promoRate, subtotalAmount]);

  const totalAmount = useMemo(() => {
    if (order) return order.total_vnd;
    return Math.max(0, subtotalAmount - discountAmount);
  }, [order, discountAmount, subtotalAmount]);

  // Format tiền tệ VND
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const transferNote = useMemo(() => {
    if (order?.transfer_content) return order.transfer_content;
    return "";
  }, [order]);

  useEffect(() => {
    if (!selectedPlan) return;

    const planId = Number(selectedPlan.id);
    if (!Number.isFinite(planId) || planId <= 0) {
      setOrderError("Gói không hợp lệ để tạo đơn thanh toán.");
      return;
    }

    let cancelled = false;

    async function ensureOrder() {
      setOrderError(null);
      setOrderLoading(true);
      try {
        const token = getAccessToken();
        if (!token) throw new Error("Bạn cần đăng nhập để tạo đơn thanh toán.");

        const promo = promoApplied ? promoCode.trim() : "";
        const res = await fetch(`${BACKEND_URL}/payments/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            plan_id: planId,
            quantity,
            promo_code: promo || null,
          }),
        });

        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(msg || `Không thể tạo đơn (${res.status}).`);
        }

        const data = (await res.json()) as PaymentOrder;
        if (!cancelled) setOrder(data);
      } catch (e: unknown) {
        if (!cancelled) setOrderError(e instanceof Error ? e.message : "Không thể tạo đơn");
      } finally {
        if (!cancelled) setOrderLoading(false);
      }
    }

    void ensureOrder();
    return () => {
      cancelled = true;
    };
  }, [selectedPlan]);

  useEffect(() => {
    if (!order) return;

    const orderId = order.order_id;

    let cancelled = false;
    async function updateExistingOrder() {
      setOrderError(null);
      setOrderLoading(true);
      try {
        const token = getAccessToken();
        if (!token) throw new Error("Bạn cần đăng nhập để thanh toán.");

        const promo = promoApplied ? promoCode.trim() : "";
        const res = await fetch(`${BACKEND_URL}/payments/orders/${orderId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            quantity,
            promo_code: promo || null,
          }),
        });

        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(msg || `Không thể cập nhật đơn (${res.status}).`);
        }

        const data = (await res.json()) as PaymentOrder;
        if (!cancelled) setOrder(data);
      } catch (e: unknown) {
        if (!cancelled) setOrderError(e instanceof Error ? e.message : "Không thể cập nhật đơn");
      } finally {
        if (!cancelled) setOrderLoading(false);
      }
    }

    void updateExistingOrder();
    return () => {
      cancelled = true;
    };
  }, [order?.order_id, promoApplied, promoCode, quantity]);

  // Auto clear copied state
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  // Hàm copy số tài khoản
  const handleCopy = async () => {
    const textToCopy = displayAccountNumber;

    // Fallback cho việc copy nếu navigator không hỗ trợ (môi trường iframe)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
      } catch {
        // fall through to textarea fallback
      }
    }

    // Fallback sử dụng textarea
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      setCopied(true);
    } catch {
      // ignore
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 cursor-pointer"
            aria-label="Go to home"
          >
            <div className="bg-blue-600 p-1.5 rounded-lg text-white font-bold">D</div>
            <span className="font-bold text-xl text-slate-900">DocuFlowAI</span>
          </button>
        </div>
      </nav>

      <main className="max-w-6xl w-full mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center lg:text-left">
          Thanh toán đơn hàng
        </h1>

        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center text-slate-500">
            Đang tải gói…
          </div>
        ) : error ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center text-rose-600">
            {error}
          </div>
        ) : !selectedPlan ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center text-rose-600">
            Không tìm thấy gói.
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* CỘT BÊN TRÁI: THÔNG TIN GÓI */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl sticky top-6">
              <h3 className="text-xl font-bold mb-1">Đơn hàng của bạn</h3>
              <p className="text-slate-400 text-sm mb-6">Chi tiết gói dịch vụ đã đăng ký</p>

              {/* Card Gói */}
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 mb-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-lg font-bold text-white">{selectedPlan.name}</h4>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded font-medium">
                      Phổ biến nhất
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">{formatCurrency(selectedPlan.price)}</p>
                    <p className="text-xs text-slate-400">/tháng</p>
                  </div>
                </div>

                <p className="text-sm text-slate-300 mb-4">{selectedPlan.description}</p>

                <div className="space-y-2">
                  {selectedPlan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm text-slate-300">
                      <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tính toán tiền */}
              <div className="space-y-3 py-4 border-t border-slate-700">
                <div className="flex justify-between text-slate-300">
                  <span>Đơn giá</span>
                  <span>{formatCurrency(selectedPlan.price)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Số lượng</span>
                  <span>{quantity} tháng</span>
                </div>

                {/* Mã khuyến mãi (mock) */}
                <div className="pt-1">
                  <div className="text-slate-300 text-sm mb-2 font-medium">Mã khuyến mãi</div>
                  <div className="flex items-center gap-2">
                    <input
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value);
                        setPromoApplied(false);
                        setPromoMessage(null);
                      }}
                      placeholder="Nhập mã..."
                      className="flex-1 h-10 rounded-lg bg-slate-900/40 border border-slate-700 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const code = promoCode.trim();
                        if (!code) {
                          setPromoApplied(false);
                          setPromoMessage("Vui lòng nhập mã khuyến mãi.");
                          return;
                        }
                        // Mock apply: any non-empty code => apply 10%.
                        setPromoApplied(true);
                        setPromoMessage("Đã áp dụng mã khuyến mãi (giảm 10%).");
                      }}
                      className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
                    >
                      Áp dụng
                    </button>
                  </div>
                  {promoMessage ? (
                    <div className={`mt-2 text-xs ${promoApplied ? "text-emerald-300" : "text-rose-300"}`}>
                      {promoMessage}
                    </div>
                  ) : null}
                </div>

                {promoApplied && discountAmount > 0 ? (
                  <div className="flex justify-between text-slate-300">
                    <span>Giảm giá</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-slate-300">
                  <span>VAT (0%)</span>
                  <span>0 ₫</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
                <span className="text-lg font-bold">Tổng thanh toán</span>
                <span className="text-2xl font-bold text-blue-400">{formatCurrency(totalAmount)}</span>
              </div>

              <div className="mt-6 bg-slate-800/50 p-4 rounded-lg flex items-start gap-3">
                <ShieldCheck className="text-green-400 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm font-semibold text-white">Bảo mật thanh toán</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Thông tin của bạn được mã hoá 256-bit SSL. Hoàn tiền trong 7 ngày nếu không hài lòng.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition"
                >
                  <Download size={12} /> Tải xuống báo giá (PDF)
                </button>
              </div>
            </div>
          </div>

          {/* CỘT BÊN PHẢI: THANH TOÁN QR */}
          <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
            {/* Box chọn số lượng */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Info size={20} className="text-blue-600" />
                Tuỳ chỉnh gói dịch vụ
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-700">Số lượng gói (Tháng)</p>
                  <p className="text-sm text-slate-500">Gia hạn tự động hàng tháng</p>
                </div>
                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border-r border-slate-300 transition"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    readOnly
                    value={quantity}
                    className="w-16 text-center py-2 font-semibold outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border-l border-slate-300 transition"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Box QR Code */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                KHUYÊN DÙNG
              </div>

              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <CreditCard size={20} className="text-blue-600" />
                Thanh toán qua Ngân hàng / QR Code
              </h2>

              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                {/* Phần hình ảnh QR */}
                <div className="flex-shrink-0 bg-blue-50 p-4 rounded-xl border-2 border-dashed border-blue-200 text-center">
                    {orderLoading ? (
                      <div className="w-48 h-48 flex items-center justify-center text-sm text-slate-500">
                        Đang tạo QR…
                      </div>
                    ) : orderError ? (
                      <div className="w-48 h-48 flex items-center justify-center text-sm text-rose-600 text-center px-2">
                        {orderError}
                      </div>
                    ) : order?.qr_image_url ? (
                      <img
                        src={order.qr_image_url}
                        alt="SePay VietQR"
                        className="w-48 h-48 mix-blend-multiply mx-auto"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-sm text-slate-500 text-center px-2">
                        Chưa cấu hình SePay QR.
                      </div>
                    )}
                  <p className="mt-2 text-sm text-blue-600 font-medium flex items-center justify-center gap-1">
                    <ShieldCheck size={14} /> Quét mã để thanh toán
                  </p>
                </div>

                {/* Phần thông tin chuyển khoản */}
                <div className="flex-1 w-full space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Ngân hàng thụ hưởng</p>
                    <p className="font-medium text-lg text-blue-900">{displayBankName}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Chủ tài khoản</p>
                    <p className="font-medium text-slate-800">{bankInfo.accountName}</p>
                  </div>

                  <div className="relative">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Số tài khoản</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-mono text-2xl font-bold text-slate-900 tracking-wider">
                        {displayAccountNumber}
                      </p>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="p-2 hover:bg-blue-50 rounded-full transition text-blue-600"
                        title="Sao chép số tài khoản"
                      >
                        {copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
                      </button>
                    </div>
                    {copied && (
                      <span className="absolute left-0 -bottom-6 text-xs text-green-600 font-medium animate-pulse">
                        Đã sao chép vào bộ nhớ tạm!
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Nội dung chuyển khoản</p>
                    <div className="bg-amber-50 border border-amber-200 p-2 rounded mt-1">
                      <p className="font-mono text-sm font-bold text-amber-800">{transferNote || "—"}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 italic">*Vui lòng nhập chính xác nội dung này</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="text-sm text-slate-500">
                  <p>Sau khi chuyển khoản, hệ thống sẽ tự động kích hoạt gói trong 5 phút.</p>
                </div>
                <button
                  type="button"
                  className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-200 transition transform active:scale-95"
                >
                  Xác nhận đã thanh toán
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
      </main>

      <div className="border-t border-slate-200 mt-12 py-8 text-center text-slate-400 text-sm">
        <div className="flex justify-center gap-4 mb-4">
          <a href="#" className="hover:text-blue-500">
            Điều khoản
          </a>
          <a href="#" className="hover:text-blue-500">
            Bảo mật
          </a>
          <a href="#" className="hover:text-blue-500">
            Liên hệ
          </a>
        </div>
        <div>© {new Date().getFullYear()} DocuFlowAI</div>
      </div>
    </div>
  );
}
