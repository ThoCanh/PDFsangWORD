"use client";

import React from "react";
import { Edit2, Search, UserPlus } from "lucide-react";
import { MOCK_USERS } from "../_data/mock";
import type { UserRow } from "../_data/mock";
import { RoleBadge, StatusBadge } from "../_ui/Badges";

type Props = {
  onAddUser: () => void;
  onEditUser: (user: UserRow) => void;
};

export default function UsersView({ onAddUser, onEditUser }: Props) {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MOCK_USERS;
    return MOCK_USERS.filter((u) =>
      [u.id, u.name, u.email, u.role, u.status].some((v) =>
        String(v).toLowerCase().includes(q),
      ),
    );
  }, [search]);

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
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="text-sm text-slate-500">
            Hiển thị <span className="font-semibold">{filtered.length}</span> /{" "}
            {MOCK_USERS.length}
          </div>
        </div>
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
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                    >
                      <Edit2 size={14} className="mr-2 text-slate-500" /> Sửa
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
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
