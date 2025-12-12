"use client";

import React from "react";
import { CreditCard, PackagePlus, Search } from "lucide-react";
import { PRO_USERS_DATA } from "../_data/mock";
import { StatusBadge } from "../_ui/Badges";

type Props = {
  onAddPlan: () => void;
  onAssignPackage: () => void;
};

export default function ProPlanView({ onAddPlan, onAssignPackage }: Props) {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PRO_USERS_DATA;
    return PRO_USERS_DATA.filter((u) =>
      [u.id, u.name, u.email, u.plan, u.status].some((v) =>
        String(v).toLowerCase().includes(q),
      ),
    );
  }, [search]);

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
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center"
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
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Khách hàng
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Gói
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Trạng thái
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Gia hạn
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Mức sử dụng
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
                    <div className="text-sm text-slate-700 font-medium">
                      {u.plan}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{u.price}</div>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="p-4 text-sm text-slate-600">{u.renewal}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-28 bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            u.usage > 90
                              ? "bg-red-500"
                              : u.usage > 70
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${u.usage}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {u.usage}%
                      </div>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-10 text-center text-sm text-slate-500"
                  >
                    Không có khách hàng phù hợp.
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
