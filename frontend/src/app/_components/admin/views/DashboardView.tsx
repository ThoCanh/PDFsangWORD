"use client";

import React from "react";
import { Activity, Cpu, Database, FileText, MoreVertical } from "lucide-react";
import { Bot, CheckCircle, Clock } from "lucide-react";
import { BACKEND_URL } from "../../../_config/app";
import { RECENT_DOCS, SYSTEM_LOGS } from "../_data/mock";
import ConfidenceBar from "../_ui/ConfidenceBar";
import { StatusBadge } from "../_ui/Badges";
import { getAccessToken } from "../../auth/token";

type AdminStatsResponse = {
  total_documents: number;
  ai_processed: number;
  accuracy_rate: number;
  processing_queue: number;
  total_documents_change: string;
  ai_processed_change: string;
  accuracy_rate_change: string;
  processing_queue_change: string;
};

type SystemMetrics = {
  cpu_percent: number;
  ram_used_bytes: number;
  ram_total_bytes: number;
  ram_percent: number;
  note?: string | null;
};

function changeClass(change: string) {
  if (change.startsWith("+")) return "text-green-600";
  if (change.startsWith("-")) return "text-red-600";
  return "text-slate-400";
}

export default function DashboardView() {
  const [stats, setStats] = React.useState<AdminStatsResponse | null>(null);
  const [statsError, setStatsError] = React.useState<string | null>(null);

  const [metrics, setMetrics] = React.useState<SystemMetrics | null>(null);
  const [metricsError, setMetricsError] = React.useState<string | null>(null);
  const [loadingMetrics, setLoadingMetrics] = React.useState(false);

  const formatRam = (usedBytes: number, totalBytes: number) => {
    const usedGb = usedBytes / 1024 / 1024 / 1024;
    const totalGb = totalBytes / 1024 / 1024 / 1024;
    return `${usedGb.toFixed(1)}GB / ${totalGb.toFixed(1)}GB`;
  };

  React.useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setStatsError("Missing token");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          // Try to surface server error details
          const txt = await res.text().catch(() => `HTTP ${res.status}`);
          let detail = txt;
          try {
            const j = JSON.parse(txt);
            detail = j.detail || j.message || txt;
          } catch (e) {
            /* not json */
          }
          throw new Error(detail || `HTTP ${res.status}`);
        }

        const data = (await res.json()) as AdminStatsResponse;
        if (!cancelled) {
          setStats(data);
          setStatsError(null);
        }
      } catch (e) {
        if (!cancelled) setStatsError(e instanceof Error ? e.message : "Không thể tải thống kê");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    let cancelled = false;
    const controller = new AbortController();

    const fetchMetrics = async () => {
      setLoadingMetrics(true);
      setMetricsError(null);

      try {
        const res = await fetch(`${BACKEND_URL}/admin/system/metrics`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!res.ok) {
          // Surface server error body if available
          const txt = await res.text().catch(() => `HTTP ${res.status}`);
          let detail = txt;
          try {
            const j = JSON.parse(txt);
            detail = j.detail || j.message || txt;
          } catch (e) {
            /* not json */
          }
          throw new Error(detail || `HTTP ${res.status}`);
        }

        const data = (await res.json()) as SystemMetrics;
        if (!cancelled) setMetrics(data);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof DOMException && e.name === "AbortError") return;
        setMetricsError(e instanceof Error ? e.message : "Không thể tải trạng thái hệ thống.");
      } finally {
        if (!cancelled) setLoadingMetrics(false);
      }
    };

    fetchMetrics();
    const timer = window.setInterval(fetchMetrics, 5000);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  const cards = React.useMemo(() => {
    if (!stats) return [];
    return [
      {
        label: "Tổng tài liệu",
        value: stats.total_documents.toLocaleString("vi-VN"),
        change: stats.total_documents_change,
        icon: FileText,
        color: "text-blue-600",
        bg: "bg-blue-100",
      },
      {
        label: "AI Đã xử lý",
        value: stats.ai_processed.toLocaleString("vi-VN"),
        change: stats.ai_processed_change,
        icon: Bot,
        color: "text-purple-600",
        bg: "bg-purple-100",
      },
      {
        label: "Tỉ lệ chính xác",
        value: `${stats.accuracy_rate.toFixed(1)}%`,
        change: stats.accuracy_rate_change,
        icon: CheckCircle,
        color: "text-green-600",
        bg: "bg-green-100",
      },
      {
        label: "Hàng đợi xử lý",
        value: stats.processing_queue.toLocaleString("vi-VN"),
        change: stats.processing_queue_change,
        icon: Clock,
        color: "text-orange-600",
        bg: "bg-orange-100",
      },
    ];
  }, [stats]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {!stats && !statsError &&
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 animate-pulse"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                  <div className="h-8 w-24 bg-slate-200 rounded" />
                </div>
                <div className="h-12 w-12 bg-slate-200 rounded-lg" />
              </div>
              <div className="mt-4 h-4 w-40 bg-slate-200 rounded" />
            </div>
          ))}

        {statsError && (
          <div className="lg:col-span-4 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <div className="text-sm text-rose-700 font-medium">{statsError}</div>
            <div className="text-xs text-slate-500 mt-1">
              Hãy đảm bảo bạn đăng nhập admin và backend đang chạy.
            </div>
          </div>
        )}

        {cards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-2">
                    {stat.value}
                  </h3>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon className={stat.color} size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className={changeClass(stat.change)}>{stat.change}</span>
                <span className="text-slate-400 ml-2">so với tháng trước</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Tài liệu gần đây</h3>
            <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              Xem tất cả
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                    Tên file
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                    Loại
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                    Độ tin cậy
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {RECENT_DOCS.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center">
                        <FileText size={16} className="text-slate-400 mr-2" />
                        <span className="text-sm font-medium text-slate-700">
                          {doc.name}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 ml-6">
                        {doc.id} • {doc.date}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{doc.type}</td>
                    <td className="p-4">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="p-4">
                      {doc.status === "completed" ? (
                        <ConfidenceBar value={doc.confidence} />
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-1 hover:bg-slate-200 rounded text-slate-500">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Trạng thái hệ thống</h3>
            <Activity size={18} className="text-slate-400" />
          </div>

          <div className="p-6 grid grid-cols-2 gap-4 border-b border-slate-100">
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <div className="flex items-center justify-center mb-1 text-slate-500 text-xs uppercase font-bold">
                <Cpu size={12} className="mr-1" /> CPU Usage
              </div>
              <div className="text-xl font-bold text-slate-700">
                {loadingMetrics
                  ? "…"
                  : metrics?.cpu_percent != null
                    ? `${Math.round(metrics.cpu_percent)}%`
                    : "—"}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <div className="flex items-center justify-center mb-1 text-slate-500 text-xs uppercase font-bold">
                <Database size={12} className="mr-1" /> RAM Usage
              </div>
              <div className="text-xl font-bold text-slate-700">
                {loadingMetrics
                  ? "…"
                  : metrics
                    ? formatRam(metrics.ram_used_bytes, metrics.ram_total_bytes)
                    : "—"}
              </div>
            </div>
          </div>

          {metricsError ? (
            <div className="px-6 pb-4 text-xs text-rose-700 font-medium">
              {metricsError}
            </div>
          ) : null}

          {(!metricsError && metrics?.note) ? (
            <div className="px-6 pb-4 text-xs text-amber-700 font-medium space-y-1">
              <div>{metrics.note}</div>
              <div className="text-xxs text-slate-600">Ví dụ cài đặt (chạy trên server/backend env): <code className="bg-slate-100 px-2 py-0.5 rounded">pip install psutil</code></div>
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[300px]">
            {SYSTEM_LOGS.map((log) => (
              <div
                key={`${log.time}-${log.level}`}
                className="flex items-start text-xs border-l-2 pl-3 py-1"
                style={{
                  borderColor:
                    log.level === "ERROR"
                      ? "#ef4444"
                      : log.level === "WARN"
                        ? "#eab308"
                        : log.level === "SUCCESS"
                          ? "#22c55e"
                          : "#3b82f6",
                }}
              >
                <div className="min-w-[60px] text-slate-400 font-mono">
                  {log.time}
                </div>
                <div className="text-slate-600 ml-2">{log.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
