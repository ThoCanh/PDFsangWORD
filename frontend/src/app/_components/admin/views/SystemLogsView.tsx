"use client";

import React from "react";
import { Search } from "lucide-react";
import { LogLevelBadge } from "../_ui/Badges";
import { BACKEND_URL } from "../../../_config/app";

type ApiLogItem = {
  id: number;
  time: string;
  level: string;
  logger: string;
  message: string;
};

type LogRow = {
  id: number;
  time: string;
  level: "INFO" | "SUCCESS" | "WARN" | "ERROR";
  service: string;
  message: string;
  user: string;
};

type SystemStatus = {
  app_name: string;
  server_time: string;
  started_at: string | null;
  users_count: number;
  db_ok: boolean;
  conversion: any;
};

export default function SystemLogsView() {
  const [search, setSearch] = React.useState("");
  const [level, setLevel] = React.useState<
    "ALL" | "INFO" | "SUCCESS" | "WARN" | "ERROR"
  >("ALL");

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<SystemStatus | null>(null);
  const [logs, setLogs] = React.useState<LogRow[]>([]);

  React.useEffect(() => {
    let cancelled = false;

    function mapLevel(lv: string): LogRow["level"] {
      const upper = (lv || "").toUpperCase();
      if (upper === "WARNING") return "WARN";
      if (upper === "CRITICAL") return "ERROR";
      if (upper === "DEBUG") return "INFO";
      if (upper === "ERROR") return "ERROR";
      if (upper === "INFO") return "INFO";
      return "INFO";
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = window.localStorage.getItem("access_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const [statusRes, logsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/admin/system/status`, { headers }),
          fetch(`${BACKEND_URL}/admin/system/logs?limit=200`, { headers }),
        ]);

        const badAuth = (res: Response) => res.status === 401 || res.status === 403;
        if (badAuth(statusRes) || badAuth(logsRes)) {
          const code = badAuth(statusRes) ? statusRes.status : logsRes.status;
          throw new Error(
            code === 401
              ? "Chưa đăng nhập (401). Hãy login để lấy access_token."
              : "Không đủ quyền (403). Tài khoản phải có role=admin.",
          );
        }

        if (!statusRes.ok) throw new Error(`Lỗi tải system status (${statusRes.status}).`);
        if (!logsRes.ok) throw new Error(`Lỗi tải system logs (${logsRes.status}).`);

        const statusJson = (await statusRes.json()) as SystemStatus;
        const apiLogs = (await logsRes.json()) as ApiLogItem[];

        const mapped: LogRow[] = apiLogs
          .slice()
          .reverse()
          .map((l) => ({
            id: l.id,
            time: l.time,
            level: mapLevel(l.level),
            service: l.logger,
            message: l.message,
            user: "—",
          }));

        if (!cancelled) {
          setStatus(statusJson);
          setLogs(mapped);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Không thể tải dữ liệu");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      if (level !== "ALL" && l.level !== level) return false;
      if (!q) return true;
      return [l.time, l.level, l.service, l.message, l.user, String(l.id)].some(
        (v) => String(v).toLowerCase().includes(q),
      );
    });
  }, [search, level, logs]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">System Logs</h3>
            <p className="text-sm text-slate-500 mt-1">
              Theo dõi log theo dịch vụ, người dùng và mức độ.
            </p>
          </div>

          <div className="flex gap-2">
            <select
              value={level}
              onChange={(e) =>
                setLevel(e.target.value as typeof level)
              }
              className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="ALL">Tất cả mức độ</option>
              <option value="INFO">INFO</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>
        </div>

        <div className="mt-5 relative w-full md:max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo service, message, user..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {status && !error && (
          <div className="mt-4 text-xs text-slate-500">
            Backend: {status.app_name} • Users: {status.users_count} • DB: {status.db_ok ? "OK" : "ERROR"}
          </div>
        )}

        {error && <div className="mt-4 text-sm text-rose-600">{error}</div>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Thời gian
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Level
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Service
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  Message
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                  User
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-10 text-center text-sm text-slate-500"
                  >
                    Đang tải system logs…
                  </td>
                </tr>
              )}

              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-sm text-slate-600 font-mono">
                    {l.time}
                  </td>
                  <td className="p-4">
                    <LogLevelBadge level={l.level} />
                  </td>
                  <td className="p-4 text-sm text-slate-700 font-medium">
                    {l.service}
                  </td>
                  <td className="p-4 text-sm text-slate-600">{l.message}</td>
                  <td className="p-4 text-sm text-slate-600">{l.user}</td>
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-10 text-center text-sm text-slate-500"
                  >
                    Không có log phù hợp.
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
