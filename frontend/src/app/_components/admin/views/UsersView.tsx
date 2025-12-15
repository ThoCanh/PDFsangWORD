"use client";

import React from "react";
import { Edit2, Search, UserPlus } from "lucide-react";
import { RoleBadge, StatusBadge } from "../_ui/Badges";
import { BACKEND_URL } from "../../../_config/app";
import type { UserRow } from "../_data/mock";
import { getAccessToken } from "../../auth/token";

type AdminUser = {
  id: number;
  email: string;
  role: string;
  created_at: string;
};

type Props = {
  onAddUser: () => void;
  onEditUser: (user: UserRow) => void;
  reloadToken?: number;
};

export default function UsersView({ onAddUser, onEditUser, reloadToken }: Props) {
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<UserRow[]>([]);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = getAccessToken();
        const res = await fetch(`${BACKEND_URL}/admin/users`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (res.status === 401) {
          throw new Error("Chưa đăng nhập (401). Hãy login để lấy access_token.");
        }
        if (res.status === 403) {
          throw new Error("Không đủ quyền (403). Tài khoản phải có role=admin.");
        }
        if (!res.ok) {
          throw new Error(`Lỗi tải danh sách users (${res.status}).`);
        }

        const data = (await res.json()) as AdminUser[];
        const mapped: UserRow[] = data.map((u) => {
          const created = u.created_at ? new Date(u.created_at) : null;
          return {
            id: String(u.id),
            name: u.email,
            email: u.email,
            role: u.role === "admin" ? "Admin" : "User",
            status: "active",
            lastLogin: "—",
            joinDate: created ? created.toLocaleString() : "—",
          };
        });

        if (!cancelled) setRows(mapped);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Không thể tải dữ liệu");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((u) =>
      [u.id, u.name, u.email, u.role, u.status].some((v) =>
        String(v).toLowerCase().includes(q),
      ),
    );
  }, [search, rows]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Người dùng</h3>
            <p className="text-sm text-slate-500 mt-1">
              Quản lý tài khoản, quyền và trạng thái.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onAddUser}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center"
            >
              <UserPlus size={16} className="mr-2" /> Thêm người dùng
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, email, id..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="text-sm text-slate-500">
            {loading ? (
              "Đang tải…"
            ) : (
              <>
                Hiển thị <span className="font-semibold">{filtered.length}</span> /{" "}
                {rows.length}
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 text-sm text-rose-600">{error}</div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  User
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Vai trò
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Trạng thái
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Lần đăng nhập
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Ngày tham gia
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center text-sm text-slate-500"
                  >
                    Đang tải danh sách người dùng…
                  </td>
                </tr>
              )}

              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="text-sm font-semibold text-slate-800">
                      {u.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {u.email} • {u.id}
                    </div>
                  </td>
                  <td className="p-4">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="p-4">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="p-4 text-sm text-slate-600">{u.lastLogin}</td>
                  <td className="p-4 text-sm text-slate-600">{u.joinDate}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => onEditUser(u)}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-900"
                    >
                      <Edit2 size={14} className="mr-2 text-slate-500" /> Sửa
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center text-sm text-slate-500"
                  >
                    Không có người dùng phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
