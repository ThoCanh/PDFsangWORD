"use client";

import React from "react";
import { CreditCard, Edit2, Eye, PackagePlus, Search, Trash2, X } from "lucide-react";

import { BACKEND_URL } from "../../../_config/app";
import { getAccessToken } from "../../auth/token";
import { StatusBadge } from "../_ui/Badges";
import AddPlanModal from "../modals/AddPlanModal";

type Props = {
  onAddPlan: () => void;
  onAssignPackage: () => void;
  reloadToken?: number;
};

type Plan = {
  id: number;
  created_at: string;
  name: string;
  price_vnd: number;
  billing_cycle: "month" | "year" | "lifetime" | string;
  doc_limit_per_month: number;
  features: string[];
  tools: string[];
  notes: string | null;
};

type PurchaseRow = {
  id: number;
  name: string;
  plan: string;
  quantity: number;
  price_vnd: number;
  purchased_at: string;
  expires_at: string;
  active: boolean;
};

type AssignmentRow = {
  id: number;
  user_id: number;
  name: string;
  plan: string;
  start_at: string | null;
  end_at: string | null;
  duration_months: number | null;
  admin_name: string | null;
};

function formatPriceVnd(value: number) {
  try {
    return new Intl.NumberFormat("vi-VN").format(value) + "đ";
  } catch {
    return String(value) + "đ";
  }
}

function formatCycle(cycle: string) {
  const c = (cycle || "").toLowerCase();
  if (c === "month") return "Tháng";
  if (c === "year") return "Năm";
  if (c === "lifetime") return "Vĩnh viễn";
  return cycle;
}

export default function ProPlanView({ onAddPlan, onAssignPackage, reloadToken }: Props) {
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [viewing, setViewing] = React.useState<Plan | null>(null);
  const [editing, setEditing] = React.useState<Plan | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const [purchasesLoading, setPurchasesLoading] = React.useState(true);
  const [purchasesError, setPurchasesError] = React.useState<string | null>(null);
  const [purchases, setPurchases] = React.useState<PurchaseRow[]>([]);

  const [assignmentsLoading, setAssignmentsLoading] = React.useState(true);
  const [assignmentsError, setAssignmentsError] = React.useState<string | null>(null);
  const [assignments, setAssignments] = React.useState<AssignmentRow[]>([]);

  const deletePlan = React.useCallback(async (plan: Plan) => {
    const ok =
      typeof window !== "undefined"
        ? window.confirm(`Xóa gói "${plan.name}" (ID: ${plan.id})?`)
        : false;
    if (!ok) return;

    try {
      const token = getAccessToken();
      const res = await fetch(`${BACKEND_URL}/admin/plans/${plan.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (res.status === 401) {
        setError("Chưa đăng nhập (401). Hãy login để lấy access_token.");
        return;
      }
      if (res.status === 403) {
        setError("Không đủ quyền (403). Tài khoản phải có role=admin.");
        return;
      }
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        setError(msg || `Xóa gói thất bại (${res.status}).`);
        return;
      }

      setRefreshKey((v) => v + 1);
    } catch {
      setError("Không thể kết nối backend.");
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = getAccessToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const res = await fetch(`${BACKEND_URL}/admin/plans`, { headers });
        if (res.status === 401) {
          throw new Error("Chưa đăng nhập (401). Hãy login để lấy access_token.");
        }
        if (res.status === 403) {
          throw new Error("Không đủ quyền (403). Tài khoản phải có role=admin.");
        }
        if (!res.ok) {
          throw new Error(`Lỗi tải danh sách gói (${res.status}).`);
        }

        const data = (await res.json()) as Plan[];
        if (!cancelled) setPlans(Array.isArray(data) ? data : []);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Không thể tải dữ liệu");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken, refreshKey]);

  React.useEffect(() => {
    let cancelled = false;
    async function loadPurchases() {
      setPurchasesLoading(true);
      setPurchasesError(null);
      try {
        const token = getAccessToken();
        const res = await fetch(`${BACKEND_URL}/admin/purchases`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (res.status === 401) {
          throw new Error("Chưa đăng nhập (401). Hãy login để lấy access_token.");
        }
        if (res.status === 403) {
          throw new Error("Không đủ quyền (403). Tài khoản phải có role=admin.");
        }
        if (!res.ok) {
          throw new Error(`Lỗi tải danh sách mua gói (${res.status}).`);
        }

        const data = (await res.json()) as PurchaseRow[];
        if (!cancelled) setPurchases(Array.isArray(data) ? data : []);
      } catch (e: unknown) {
        if (!cancelled) setPurchasesError(e instanceof Error ? e.message : "Không thể tải dữ liệu");
      } finally {
        if (!cancelled) setPurchasesLoading(false);
      }
    }

    void loadPurchases();
    return () => {
      cancelled = true;
    };
  }, [reloadToken, refreshKey]);

  React.useEffect(() => {
    let cancelled = false;
    async function loadAssignments() {
      setAssignmentsLoading(true);
      setAssignmentsError(null);
      try {
        const token = getAccessToken();
        const res = await fetch(`${BACKEND_URL}/admin/plan-assignments`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (res.status === 401) {
          throw new Error("Chưa đăng nhập (401). Hãy login để lấy access_token.");
        }
        if (res.status === 403) {
          throw new Error("Không đủ quyền (403). Tài khoản phải có role=admin.");
        }
        if (!res.ok) {
          throw new Error(`Lỗi tải danh sách gán gói (${res.status}).`);
        }

        const data = (await res.json()) as AssignmentRow[];
        if (!cancelled) setAssignments(Array.isArray(data) ? data : []);
      } catch (e: unknown) {
        if (!cancelled) setAssignmentsError(e instanceof Error ? e.message : "Không thể tải dữ liệu");
      } finally {
        if (!cancelled) setAssignmentsLoading(false);
      }
    }

    void loadAssignments();
    return () => {
      cancelled = true;
    };
  }, [reloadToken, refreshKey]);

  const formatDate = (value: string) => {
    try {
      return value ? new Date(value).toLocaleString("vi-VN") : "—";
    } catch {
      return value || "—";
    }
  };

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return plans;
    return plans.filter((p) =>
      [p.id, p.name, p.billing_cycle, p.price_vnd, p.doc_limit_per_month]
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [search, plans]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Gói Pro</h3>
            <p className="text-sm text-slate-500 mt-1">
              Theo dõi khách hàng trả phí, gia hạn và mức sử dụng.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onAssignPackage}
              className="px-4 py-2 bg-indigo-600 text-slate-900 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center"
            >
              <CreditCard size={16} className="mr-2" /> Gán gói
            </button>
            <button
              onClick={onAddPlan}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-100 transition-colors flex items-center"
            >
              <PackagePlus size={16} className="mr-2 text-indigo-600" /> Tạo gói
            </button>
          </div>
        </div>

        <div className="mt-5 relative w-full md:max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên/email/id/gói..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Tên gói
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Giá
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Chu kỳ
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Giới hạn
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Tính năng
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Hoạt động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="text-sm font-semibold text-slate-800">{p.name}</div>
                    <div className="text-xs text-slate-500 mt-1">ID: {p.id}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-slate-700 font-medium">
                      {formatPriceVnd(p.price_vnd)}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{formatCycle(p.billing_cycle)}</td>
                  <td className="p-4 text-sm text-slate-600">
                    {p.doc_limit_per_month}/tháng
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-slate-700">
                      {Array.isArray(p.features) ? p.features.length : 0} tính năng
                    </div>
                    {p.notes ? (
                      <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {p.notes}
                      </div>
                    ) : null}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewing(p)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                        aria-label="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(p)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                        aria-label="Chỉnh sửa"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deletePlan(p)}
                        className="p-2 rounded-lg hover:bg-rose-50 text-rose-600"
                        aria-label="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {loading && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-sm text-slate-500">
                    Đang tải danh sách gói…
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-sm text-rose-600">
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center text-sm text-slate-500"
                  >
                    Chưa có gói nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="text-sm font-bold text-slate-800">Danh sách user đã mua gói</div>
          <div className="text-xs text-slate-500 mt-1">
            Hiển thị lịch sử mua gói: ID, Tên, Gói, Số lượng, Ngày mua, Ngày hết hạn, Giá tiền, Trạng thái và Hành động (Sửa/Xóa).
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">ID</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Tên</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Gói</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Số lượng</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Ngày mua</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Ngày hết hạn</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Giá tiền</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Trạng Thái</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Hoạt động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchasesLoading && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-sm text-slate-500">
                    Đang tải danh sách mua gói…
                  </td>
                </tr>
              )}

              {!purchasesLoading && purchasesError && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-sm text-rose-600">
                    {purchasesError}
                  </td>
                </tr>
              )}

              {!purchasesLoading && !purchasesError && purchases.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-sm text-slate-500">
                    Chưa có user nào mua gói.
                  </td>
                </tr>
              )}

              {!purchasesLoading && !purchasesError
                ? purchases.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm text-slate-700 font-medium">{r.id}</td>
                      <td className="p-4">
                        <div className="text-sm font-semibold text-slate-800">{r.name}</div>
                      </td>
                      <td className="p-4 text-sm text-slate-700">{r.plan}</td>
                      <td className="p-4 text-sm text-slate-700">{r.quantity}</td>
                      <td className="p-4 text-sm text-slate-600">{formatDate(r.purchased_at)}</td>
                      <td className="p-4 text-sm text-slate-600">{formatDate(r.expires_at)}</td>
                      <td className="p-4 text-sm text-slate-700 font-medium">{formatPriceVnd(r.price_vnd)}</td>
                      <td className="p-4 text-sm text-slate-700">
                        <StatusBadge status={r.active ? "active" : "expired"} />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              const ok = typeof window !== 'undefined' ? window.confirm(`Xóa bản ghi mua gói ID ${r.id}?`) : false;
                              if (!ok) return;
                              try {
                                const token = getAccessToken();
                                const res = await fetch(`${BACKEND_URL}/admin/purchases/${r.id}`, {
                                  method: 'DELETE',
                                  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                                });
                                if (!res.ok) {
                                  const txt = await res.text().catch(() => 'Lỗi');
                                  alert(`Xóa thất bại: ${txt}`);
                                  return;
                                }
                                setRefreshKey(v => v + 1);
                              } catch (e) {
                                alert(e instanceof Error ? e.message : String(e));
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-rose-50 text-rose-600"
                            title="Xóa mua gói"
                          >
                            <Trash2 size={16} />
                          </button>

                          <button
                            onClick={async () => {
                              const input = prompt('Sửa số lượng (tháng):', String(r.quantity));
                              if (input === null) return;
                              const n = Number(input);
                              if (Number.isNaN(n) || n <= 0) {
                                alert('Số lượng không hợp lệ');
                                return;
                              }

                              try {
                                const token = getAccessToken();
                                const res = await fetch(`${BACKEND_URL}/admin/purchases/${r.id}`, {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                  },
                                  body: JSON.stringify({ quantity: n }),
                                });
                                if (!res.ok) {
                                  const txt = await res.text().catch(() => 'Lỗi');
                                  alert(`Cập nhật thất bại: ${txt}`);
                                  return;
                                }
                                setRefreshKey(v => v + 1);
                              } catch (e) {
                                alert(e instanceof Error ? e.message : String(e));
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                            title="Sửa mua gói"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="text-sm font-bold text-slate-800">Danh sách Gán gói</div>
          <div className="text-xs text-slate-500 mt-1">
            Lịch sử các lần gán gói (ID, Tên, Gói, Ngày bắt đầu, Ngày kết thúc, Số tháng, ADMIN).
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">ID</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Tên</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Gói</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Ngày bắt đầu</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Ngày hết hạn</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Số tháng</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">ADMIN</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Trạng Thái</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Hoạt Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignmentsLoading && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-sm text-slate-500">
                    Đang tải danh sách gán gói…
                  </td>
                </tr>
              )}

              {!assignmentsLoading && assignmentsError && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-sm text-rose-600">
                    {assignmentsError}
                  </td>
                </tr>
              )}

              {!assignmentsLoading && !assignmentsError && assignments.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-sm text-slate-500">
                    Chưa có bản ghi gán gói.
                  </td>
                </tr>
              )}

              {!assignmentsLoading && !assignmentsError
                ? assignments.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm text-slate-700 font-medium">{r.id}</td>
                      <td className="p-4">
                        <div className="text-sm font-semibold text-slate-800">{r.name}</div>
                      </td>
                      <td className="p-4 text-sm text-slate-700">{r.plan}</td>
                      <td className="p-4 text-sm text-slate-600">{formatDate(r.start_at || '')}</td>
                      <td className="p-4 text-sm text-slate-600">{formatDate(r.end_at || '')}</td>
                      <td className="p-4 text-sm text-slate-700">{r.duration_months ?? '—'}</td>
                      <td className="p-4 text-sm text-slate-700">{r.admin_name ?? '—'}</td>
                      <td className="p-4 text-sm text-slate-700">
                        {(() => {
                          try {
                            if (!r.end_at) return <StatusBadge status={"active"} />;
                            const d = new Date(r.end_at);
                            return d.getTime() > Date.now() ? <StatusBadge status={"active"} /> : <StatusBadge status={"expired"} />;
                          } catch (e) {
                            return <StatusBadge status={"active"} />;
                          }
                        })()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              const ok = typeof window !== 'undefined' ? window.confirm(`Xóa bản ghi gán gói ID ${r.id}?`) : false;
                              if (!ok) return;
                              try {
                                const token = getAccessToken();
                                const res = await fetch(`${BACKEND_URL}/admin/plan-assignments/${r.id}`, {
                                  method: 'DELETE',
                                  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                                });
                                if (!res.ok) {
                                  const txt = await res.text().catch(() => 'Lỗi');
                                  alert(`Xóa thất bại: ${txt}`);
                                  return;
                                }
                                setRefreshKey(v => v + 1);
                              } catch (e) {
                                alert(e instanceof Error ? e.message : String(e));
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-rose-50 text-rose-600"
                            title="Xóa gán gói"
                          >
                            <Trash2 size={16} />
                          </button>

                          <button
                            onClick={async () => {
                              const input = prompt('Số tháng (để trống = vô hạn):', r.duration_months ? String(r.duration_months) : '');
                              if (input === null) return;
                              const n = input.trim() === '' ? null : Number(input);
                              if (n !== null && (Number.isNaN(n) || n < 0)) {
                                alert('Số tháng không hợp lệ');
                                return;
                              }

                              try {
                                const token = getAccessToken();
                                const res = await fetch(`${BACKEND_URL}/admin/plan-assignments/${r.id}`, {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                  },
                                  body: JSON.stringify({ duration_months: n }),
                                });
                                if (!res.ok) {
                                  const txt = await res.text().catch(() => 'Lỗi');
                                  alert(`Cập nhật thất bại: ${txt}`);
                                  return;
                                }
                                setRefreshKey(v => v + 1);
                              } catch (e) {
                                alert(e instanceof Error ? e.message : String(e));
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                            title="Sửa gán gói"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </div>

      {viewing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Chi tiết gói</h3>
              <button
                onClick={() => setViewing(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-3 overflow-y-auto">
              <div>
                <div className="text-xs text-slate-500">Tên gói</div>
                <div className="text-sm font-semibold text-slate-800">{viewing.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500">Giá</div>
                  <div className="text-sm text-slate-700">{formatPriceVnd(viewing.price_vnd)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Chu kỳ</div>
                  <div className="text-sm text-slate-700">{formatCycle(viewing.billing_cycle)}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Giới hạn</div>
                <div className="text-sm text-slate-700">{viewing.doc_limit_per_month}/tháng</div>
              </div>
              {viewing.notes ? (
                <div>
                  <div className="text-xs text-slate-500">Ghi chú</div>
                  <div className="text-sm text-slate-700 whitespace-pre-wrap">{viewing.notes}</div>
                </div>
              ) : null}
              <div>
                <div className="text-xs text-slate-500 mb-2">Tính năng</div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  {Array.isArray(viewing.features) && viewing.features.length ? (
                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                      {viewing.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-slate-500">Không có</div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewing(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AddPlanModal
        isOpen={!!editing}
        initialPlan={editing}
        onClose={() => setEditing(null)}
        onSave={() => {
          setEditing(null);
          setRefreshKey((v) => v + 1);
        }}
      />
    </div>
  );
}
