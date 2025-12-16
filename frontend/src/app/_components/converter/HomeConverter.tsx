"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  ChevronRight,
  Copy,
  Download,
  Loader2,
  Mail,
  PenTool,
  Sparkles,
  Upload,
} from "lucide-react";
import { IS_DEMO_MODE, API_URL, GEMINI_API_KEY, BACKEND_URL } from "../../_config/app";
import ConversionModePanel from "./ConversionModePanel";
import { TOOL_CONFIG, type ToolKey } from "../../_config/tools";
import { useConverter } from "../../_hooks/useConverter";
import { useGeminiAssistant } from "../../_hooks/useGeminiAssistant";
import { useAuth } from "../auth/AuthContext";
import { getAccessToken } from "../auth/token";
import UpgradePlanNotification from "../modals/UpgradePlanNotification";

type Props = {
  activeTool: ToolKey;
  onSelectTool: (tool: ToolKey) => void;
};

function heroBgClass(activeTool: ToolKey) {
  if (activeTool === "pdf-word") return "bg-slate-900";
  if (activeTool === "jpg-png") return "bg-emerald-900";
  return "bg-rose-900";
}

function primaryButtonClass(activeTool: ToolKey) {
  if (activeTool === "pdf-word") return "bg-blue-600 hover:bg-blue-700 shadow-blue-200";
  if (activeTool === "jpg-png") return "bg-green-600 hover:bg-green-700 shadow-green-200";
  return "bg-red-600 hover:bg-red-700 shadow-red-200";
}

function uploadBadgeClass(activeTool: ToolKey) {
  if (activeTool === "pdf-word") return "bg-blue-100 text-blue-600";
  if (activeTool === "jpg-png") return "bg-green-100 text-green-600";
  return "bg-red-100 text-red-600";
}

export default function HomeConverter({ activeTool, onSelectTool }: Props) {
  const router = useRouter();
  const { planKey } = useAuth();
  const currentConfig = useMemo(() => TOOL_CONFIG[activeTool], [activeTool]);

  const [panelOpen, setPanelOpen] = React.useState(false);

  const [gateOpen, setGateOpen] = React.useState(false);
  const [gateTitle, setGateTitle] = React.useState("Giới hạn gói cước");
  const [gateMessage, setGateMessage] = React.useState(
    "Bạn đang sử dụng gói Free nên không thể sử dụng chức năng này.\n\nVui lòng nâng cấp để tiếp tục.",
  );

  const gateCooldownUntilRef = React.useRef<number>(0);
  const lastAutoGateKeyRef = React.useRef<string>("");

  const isFileDialogOpeningRef = React.useRef(false);

  const [allowedTools, setAllowedTools] = React.useState<Set<ToolKey> | null>(null);

  const converter = useConverter({
    activeTool,
    config: currentConfig,
    isDemoMode: IS_DEMO_MODE,
    apiUrl: API_URL,
  });

  const ai = useGeminiAssistant({ file: converter.file, apiKey: GEMINI_API_KEY });

  const [conversionMode, setConversionMode] = React.useState<string>("auto");
  const [canUseTierA, setCanUseTierA] = React.useState<boolean>(false);

  React.useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        if ((data?.plan_key || "").toString().startsWith("plan:")) setCanUseTierA(true);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  // If user is paid and conversionMode is still 'auto', default auto -> tier-a per request
  React.useEffect(() => {
    if (planKey && planKey.startsWith("plan:") && conversionMode === "auto") {
      setConversionMode("tier-a");
    }
  }, [planKey, conversionMode]);

  useEffect(() => {
    // Reset AI when file changes
    ai.setAiResult("");
    ai.setAiMode(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [converter.file]);

  const switchTool = (tool: ToolKey) => {
    onSelectTool(tool);
    converter.removeFile();
  };

  const openGateModal = useCallback((reason?: string | null, detail?: string) => {
    setGateTitle("Giới hạn gói cước");
    if (reason === "quota_exceeded") {
      setGateMessage(
        detail ||
          "Bạn đã hết lượt tài liệu trong tháng của gói hiện tại.\n\nVui lòng nâng cấp để tiếp tục.",
      );
    } else {
      setGateMessage(
        detail ||
          "Bạn đang sử dụng gói Free nên không thể sử dụng chức năng này.\n\nVui lòng nâng cấp để tiếp tục.",
      );
    }
    setGateOpen(true);
  }, []);

  const closeGateModal = useCallback(() => {
    // Avoid click-through immediately after closing.
    gateCooldownUntilRef.current = Date.now() + 450;
    setGateOpen(false);
  }, []);

  const checkAccess = useCallback(async (tool: ToolKey) => {
    if (IS_DEMO_MODE) return { allowed: true, reason: null, detail: null };

    try {
      const token = getAccessToken();
      const res = await fetch(
        `${BACKEND_URL}/convert/check?type=${encodeURIComponent(tool)}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );

      if (!res.ok) {
        // Fail-open: /convert will still enforce.
        return { allowed: true, reason: null, detail: null };
      }

      const data = (await res.json()) as {
        allowed?: boolean;
        reason?: string | null;
        detail?: string | null;
      };

      return {
        allowed: Boolean(data?.allowed),
        reason: (data?.reason ?? null) as string | null,
        detail: (data?.detail ?? null) as string | null,
      };
    } catch {
      return { allowed: true, reason: null, detail: null };
    }
  }, []);

  const ensureAllowed = useCallback(
    async (tool: ToolKey) => {
      if (gateOpen) return false;
      if (Date.now() < gateCooldownUntilRef.current) return false;

      const checked = await checkAccess(tool);
      if (!checked.allowed) {
        openGateModal(checked.reason, checked.detail || undefined);
        return false;
      }
      return true;
    },
    [checkAccess, gateOpen, openGateModal],
  );

  useEffect(() => {
    // Ensure quota-exceeded is surfaced BEFORE the user tries to pick a file.
    // Only auto-show for quota, not for tool-not-allowed (that one shows on interaction).
    let cancelled = false;
    void (async () => {
      if (gateOpen) return;
      if (Date.now() < gateCooldownUntilRef.current) return;

      const checked = await checkAccess(activeTool);
      if (cancelled) return;

      if (!checked.allowed && checked.reason === "quota_exceeded") {
        const key = `${activeTool}:${checked.reason}:${checked.detail ?? ""}`;
        if (lastAutoGateKeyRef.current !== key) {
          lastAutoGateKeyRef.current = key;
          openGateModal(checked.reason, checked.detail || undefined);
        }
      } else {
        lastAutoGateKeyRef.current = "";
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTool, gateOpen, openGateModal, checkAccess, planKey]);

  useEffect(() => {
    if (!converter.gateBlocked) return;
    const reason = converter.gateBlocked.status === 429 ? "quota_exceeded" : "tool_not_allowed";
    openGateModal(reason, converter.gateBlocked.detail);
    converter.clearGateBlocked();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [converter.gateBlocked]);

  useEffect(() => {
    let cancelled = false;

    async function loadAllowedTools() {
      // Free plan (also the default for guests)
      if (!planKey || planKey === "free") {
        try {
          const res = await fetch(`${BACKEND_URL}/plans/free`);
          if (!res.ok) {
            if (!cancelled) setAllowedTools(null);
            return;
          }
          const data = (await res.json()) as { tools?: string[] };
          const tools = Array.isArray(data?.tools) ? data.tools : [];
          const normalized = tools.map((t) => String(t)) as ToolKey[];
          const set = new Set<ToolKey>(
            normalized.filter((t) => t in TOOL_CONFIG) as ToolKey[],
          );
          if (!cancelled) setAllowedTools(set.size ? set : null);
        } catch {
          if (!cancelled) setAllowedTools(null);
        }
        return;
      }

      // Paid plan (plan:<id>)
      if (!planKey || !planKey.startsWith("plan:")) {
        if (!cancelled) setAllowedTools(null);
        return;
      }

      const id = Number(planKey.split(":", 2)[1]);
      if (!Number.isFinite(id)) {
        if (!cancelled) setAllowedTools(null);
        return;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/plans`);
        if (!res.ok) {
          if (!cancelled) setAllowedTools(null);
          return;
        }

        const data = (await res.json()) as Array<{ id: number; tools?: string[] }>;
        const plan = Array.isArray(data) ? data.find((p) => p?.id === id) : undefined;
        const tools = Array.isArray(plan?.tools) ? plan?.tools : [];
        const normalized = tools.map((t) => String(t)) as ToolKey[];
        const set = new Set<ToolKey>(
          normalized.filter((t) => t in TOOL_CONFIG) as ToolKey[],
        );

        // Backward compatible: empty list => allow all tools.
        if (!cancelled) setAllowedTools(set.size ? set : null);
      } catch {
        if (!cancelled) setAllowedTools(null);
      }
    }

    void loadAllowedTools();
    return () => {
      cancelled = true;
    };
  }, [planKey]);

  const isToolAllowed = useMemo(() => {
    return (tool: ToolKey) => !allowedTools || allowedTools.has(tool);
  }, [allowedTools]);

  const Icon = currentConfig.icon;

  return (
    <>
      <div
        className={`relative pt-20 pb-32 overflow-hidden transition-colors duration-500 ${heroBgClass(
          activeTool
        )} text-white`}
      >
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl mix-blend-overlay filter opacity-20" />
          <div className="absolute top-32 -left-24 w-72 h-72 bg-white rounded-full blur-3xl mix-blend-overlay filter opacity-20" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-medium mb-6 backdrop-blur-sm">
            <Sparkles size={14} className="text-yellow-400" /> Tích hợp AI
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            {currentConfig.title} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200 opacity-90">
              Nhanh chóng &amp; Chính xác
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 font-light">
            {currentConfig.desc} Giờ đây bạn có thể dùng AI để xử lý công việc sau
            khi chuyển đổi.
          </p>

          <button
            onClick={() =>
              document
                .getElementById("converter-area")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="px-8 py-4 bg-white text-slate-900 font-bold rounded-full text-lg shadow-lg hover:bg-slate-100 transition-all transform hover:-translate-y-1"
          >
            Bắt đầu ngay
          </button>
        </div>
      </div>

      <div id="converter-area" className="relative -mt-20 px-4 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center gap-2 mb-4">
            {Object.entries(TOOL_CONFIG).map(([key, config]) => {
              const toolKey = key as ToolKey;
              const TabIcon = config.icon;
              return (
                <button
                  key={toolKey}
                  onClick={() => {
                    switchTool(toolKey);
                    void (async () => {
                      const checked = await checkAccess(toolKey);
                      if (!checked.allowed) openGateModal(checked.reason, checked.detail || undefined);
                    })();
                  }}
                  className={`px-5 py-2 rounded-t-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeTool === toolKey
                      ? "bg-white text-slate-800 shadow-sm pt-3"
                      : "bg-white/10 text-white/70 hover:bg-white/20 backdrop-blur-sm"
                  }`}
                >
                  <TabIcon size={18} />
                  <span className="hidden sm:inline">{config.title}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden min-h-[400px] flex flex-col items-center justify-center p-8 relative">
            {!converter.file && (
              <div
                ref={converter.dropzoneRef}
                className={`w-full h-80 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer group ${
                  converter.dragActive
                    ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
                    : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
                }`}
                onDragEnter={converter.handleDrag}
                onDragLeave={converter.handleDrag}
                onDragOver={converter.handleDrag}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  converter.setDragActive(false);
                  const dropped = e.dataTransfer.files?.[0];
                  if (!dropped) return;

                  void ensureAllowed(activeTool).then((ok) => {
                    if (!ok) return;
                    converter.validateAndSetFile(dropped);
                  });
                }}
                onClick={() => {
                  void ensureAllowed(activeTool).then((ok) => {
                    if (!ok) return;
                    if (!isToolAllowed(activeTool)) {
                      openGateModal("tool_not_allowed");
                      return;
                    }
                    if (isFileDialogOpeningRef.current) return;
                    isFileDialogOpeningRef.current = true;
                    converter.fileInputRef.current?.click();
                    setTimeout(() => {
                      isFileDialogOpeningRef.current = false;
                    }, 600);
                  });
                }}
              >
                <input
                  ref={converter.fileInputRef}
                  type="file"
                  accept={currentConfig.accept}
                  className="hidden"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    isFileDialogOpeningRef.current = false;
                    const picked = e.target.files?.[0];
                    if (!picked) return;
                    void ensureAllowed(activeTool).then((ok) => {
                      if (!ok) {
                        if (converter.fileInputRef.current) converter.fileInputRef.current.value = "";
                        return;
                      }
                      converter.validateAndSetFile(picked);
                    });
                  }}
                />

                <div
                  className={`p-5 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300 ${uploadBadgeClass(
                    activeTool
                  )}`}
                >
                  <Upload size={40} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  Kéo thả file {currentConfig.accept}
                </h3>
                <p className="text-slate-400 mb-6">hoặc nhấn để chọn từ máy tính</p>
                <button className="px-6 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
                  Chọn tệp
                </button>
              </div>
            )}

            {converter.file && converter.status === "idle" && (
              <div className="w-full max-w-md">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                    <Icon size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">
                    {converter.file.name}
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    {(converter.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                  <div className={
                    (planKey && planKey.startsWith("plan:")) ? "flex gap-3 w-full" : "flex flex-col items-center gap-3 w-full"
                  }>
                    <button
                      onClick={converter.removeFile}
                      className={
                        (planKey && planKey.startsWith("plan:"))
                          ? "flex-1 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                          : "w-3/4 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                      }
                    >
                      Hủy bỏ
                    </button>
                    <div className={(planKey && planKey.startsWith("plan:")) ? "flex-1 flex items-center gap-3" : "w-full flex flex-col items-center gap-3"}>
                      {activeTool === "pdf-word" && (planKey && planKey.startsWith("plan:")) && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPanelOpen(true)}
                            className="px-3 py-1 bg-slate-100 text-slate-700 rounded border hover:bg-slate-200 transition"
                            type="button"
                          >
                            Chọn chế độ: <span className="ml-2 font-medium">{conversionMode === "tier-a" ? "AUTO" : conversionMode === "ocr" ? "Chế độ chuyển PDF(SCAN) sang Word văn bản" : "Chế độ chuyển đổi: tier-a"}</span>
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          void ensureAllowed(activeTool).then((ok) => {
                            if (!ok) return;
                            void converter.handleConvert(conversionMode === "auto" ? undefined : conversionMode);
                          });
                        }}
                        disabled={!isToolAllowed(activeTool)}
                        className={`${(planKey && planKey.startsWith("plan:")) ? 'flex-1' : 'w-3/4'} py-3 text-white font-medium rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${primaryButtonClass(
                          activeTool
                        )}`}
                      >
                        Chuyển đổi <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(converter.status === "uploading" || converter.status === "converting") && (
              <div className="w-full max-w-md text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <svg
                    className="animate-spin w-full h-full text-slate-500"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-600">
                    {converter.progress}%
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  Đang xử lý...
                </h3>
                <p className="text-slate-500 max-w-xs mx-auto">Vui lòng đợi. Nếu quá lâu, bạn có thể hủy và thử lại.</p>
                <div className="mt-4 flex justify-center gap-3">
                  <button
                    onClick={() => converter.cancelConversion()}
                    className="px-4 py-2 bg-rose-100 text-rose-600 rounded-lg font-medium hover:bg-rose-200 transition"
                    type="button"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            {converter.status === "success" && (
              <div className="w-full max-w-lg text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-sm relative">
                    <Check size={32} strokeWidth={3} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Thành công!</h3>
                <p className="text-slate-500 mb-6">
                  File {currentConfig.outputExt} đã sẵn sàng.
                </p>

                {converter.conversionMode && (
                  <div className="mb-6 text-sm text-slate-600">
                    Chế độ chuyển đổi: <span className="font-semibold">{converter.conversionMode}</span>
                    {converter.conversionMode === "tier-b" && (
                      <div className="mt-1 text-xs text-slate-500">
                        DOCX dạng ảnh để giữ giống bản gốc, nên sẽ khó chỉnh sửa nội dung.
                      </div>
                    )}
                    {converter.pdfHasText === false && (
                      <div className="mt-1 text-xs text-slate-500">
                        PDF này có vẻ là scan/ảnh (không có text layer). Muốn Word chỉnh sửa được cần OCR trước khi chuyển đổi.
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 mb-6 text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="text-indigo-600" size={18} />
                    <h4 className="font-semibold text-indigo-900">
                      Trợ lý Thông minh Gemini
                    </h4>
                  </div>

                  {!ai.canUseAi && (
                    <div className="text-sm text-slate-600">
                      Chưa có API key. Đặt biến môi trường
                      <span className="font-semibold"> NEXT_PUBLIC_GEMINI_API_KEY</span>
                      để bật AI.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => ai.callGeminiAI("email")}
                      disabled={ai.isAiLoading || !ai.canUseAi}
                      className="p-3 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 transition-all text-sm font-medium text-slate-700 flex flex-col items-center gap-2 disabled:opacity-70"
                    >
                      <Mail className="text-indigo-500" size={20} /> Soạn Email
                    </button>
                    <button
                      onClick={() => ai.callGeminiAI("title")}
                      disabled={ai.isAiLoading || !ai.canUseAi}
                      className="p-3 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 transition-all text-sm font-medium text-slate-700 flex flex-col items-center gap-2 disabled:opacity-70"
                    >
                      <PenTool className="text-purple-500" size={20} /> Đổi tên file
                    </button>
                  </div>

                  {ai.isAiLoading && (
                    <div className="text-center text-indigo-500 text-sm">
                      <Loader2 className="animate-spin inline mr-2" />
                      Gemini đang viết...
                    </div>
                  )}

                  {ai.aiResult && !ai.isAiLoading && (
                    <div>
                      <div className="bg-white p-3 rounded-lg border border-indigo-100 text-sm text-slate-700 max-h-40 overflow-y-auto whitespace-pre-wrap">
                        {ai.aiResult}
                      </div>
                      <button
                        onClick={ai.copyToClipboard}
                        className="text-xs text-indigo-600 mt-2 font-medium flex items-center gap-1 justify-end w-full"
                      >
                        <Copy size={12} /> Sao chép
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      if (converter.resultBlob && converter.resultFileName) {
                        converter.downloadResult();
                        return;
                      }

                      // Demo mode / no result blob available.
                      converter.removeFile();
                    }}
                    className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={20} /> Tải xuống file
                  </button>
                  <button
                    onClick={converter.removeFile}
                    className="w-full py-3 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors"
                  >
                    Chuyển đổi file khác
                  </button>
                </div>
              </div>
            )}

            {converter.status === "error" && (
              <div className="w-full max-w-md text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  Đã xảy ra lỗi
                </h3>
                <p className="text-red-500 bg-red-50 p-3 rounded-lg text-sm mb-6 border border-red-100">
                  {converter.errorMessage}
                </p>
                <button
                  onClick={converter.removeFile}
                  className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conversion mode panel (only visible when paid users open it) */}
      <ConversionModePanel
        visible={panelOpen}
        onClose={() => setPanelOpen(false)}
        onSelect={(m) => setConversionMode(m)}
        initial={conversionMode as any}
      />

      <UpgradePlanNotification
        isOpen={gateOpen}
        onClose={closeGateModal}
        onUpgrade={() => {
          closeGateModal();
          router.push("/upgrade");
        }}
        title={gateTitle}
        message={gateMessage}
      />
    </>
  );
}
