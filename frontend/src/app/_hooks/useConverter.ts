"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ToolConfig, ToolKey } from "../_config/tools";
import { getAccessToken } from "../_components/auth/token";

export type ConvertStatus =
  | "idle"
  | "uploading"
  | "converting"
  | "success"
  | "error";

type Params = {
  activeTool: ToolKey;
  config: ToolConfig;
  isDemoMode: boolean;
  apiUrl: string;
};

export function useConverter({
  activeTool,
  config,
  isDemoMode,
  apiUrl,
}: Params) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ConvertStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFileName, setResultFileName] = useState<string | null>(null);
  const [conversionMode, setConversionMode] = useState<string | null>(null);
  const [pdfHasText, setPdfHasText] = useState<boolean | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [gateBlocked, setGateBlocked] = useState<
    { status: number; detail?: string } | null
  >(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropzoneRef = useRef<HTMLDivElement | null>(null);

  const acceptedExts = useMemo(
    () => config.accept.replace(/\s/g, "").split(","),
    [config.accept]
  );

  const resetForNewFile = useCallback(() => {
    setStatus("idle");
    setErrorMessage("");
    setProgress(0);
    setResultBlob(null);
    setResultFileName(null);
    setConversionMode(null);
    setPdfHasText(null);
    setGateBlocked(null);
  }, []);

  const triggerDownload = useCallback((blob: Blob, name: string) => {
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Give the browser a tick to start the download before revoking.
    setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
  }, []);

  const downloadResult = useCallback(() => {
    if (!resultBlob || !resultFileName) return;
    triggerDownload(resultBlob, resultFileName);
  }, [resultBlob, resultFileName, triggerDownload]);

  const validateAndSetFile = useCallback(
    (selectedFile: File) => {
      const fileExt =
        "." + (selectedFile.name.split(".").pop() || "").toLowerCase();

      let isValidType = false;
      if (selectedFile.type === config.mimeType) isValidType = true;
      if (acceptedExts.includes(fileExt)) isValidType = true;
      if (activeTool === "jpg-png" && (fileExt === ".jpg" || fileExt === ".jpeg")) {
        isValidType = true;
      }
      if (activeTool === "word-pdf" && (fileExt === ".doc" || fileExt === ".docx")) {
        isValidType = true;
      }

      if (!isValidType) {
        setErrorMessage(`Vui lòng chọn file đúng định dạng (${config.accept})`);
        setStatus("error");
        return;
      }

      if (selectedFile.size > 20 * 1024 * 1024) {
        setErrorMessage("File quá lớn. Vui lòng chọn file dưới 20MB");
        setStatus("error");
        return;
      }

      setFile(selectedFile);
      resetForNewFile();
    },
    [acceptedExts, activeTool, config.accept, config.mimeType, resetForNewFile]
  );

  const removeFile = useCallback(() => {
    setFile(null);
    resetForNewFile();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [resetForNewFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const dropped = e.dataTransfer.files?.[0];
      if (dropped) validateAndSetFile(dropped);
    },
    [validateAndSetFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      const picked = e.target.files?.[0];
      if (picked) validateAndSetFile(picked);
    },
    [validateAndSetFile]
  );

  const simulateConversion = useCallback(() => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 8;
      if (currentProgress > 85) {
        clearInterval(interval);
        setStatus("converting");
        setTimeout(() => {
          setProgress(100);
          setStatus("success");
        }, 1500);
      } else {
        setProgress(Math.round(currentProgress));
      }
    }, 200);
  }, []);

  // References for active request + background job
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const jobIdRef = useRef<number | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  const cancelConversion = useCallback(async () => {
    // If an XHR upload is in progress, abort it.
    if (xhrRef.current) {
      try {
        xhrRef.current.abort();
      } catch {
        /* ignore */
      }
      xhrRef.current = null;
      setStatus("idle");
      setProgress(0);
      setErrorMessage("Đã hủy chuyển đổi.");
      // Ask server to cancel job if it was created
      if (jobIdRef.current) {
        try {
          const token = getAccessToken();
          await fetch(`${apiUrl.replace(/\/convert\/?$/, "")}/convert/cancel/${jobIdRef.current}`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
        } catch {
          /* ignore */
        }
      }
      // stop polling
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }
  }, [apiUrl]);

  const handleConvert = useCallback(async (mode?: string) => {
    if (!file) return;

    setStatus("uploading");
    setProgress(0);

    if (isDemoMode) {
      simulateConversion();
      return;
    }

    try {
      const token = getAccessToken();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", activeTool);
      if (mode) formData.append("mode", mode);

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.open("POST", apiUrl, true);
      // We'll treat the response as blob for 200 case; for 202 we parse text
      xhr.responseType = "blob";
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 80);
          setProgress(percentComplete);
        }
      };

      xhr.onload = function () {
        xhrRef.current = null;
        // If backend returns 200 (legacy immediate), handle as before
        if (this.status === 200) {
          setProgress(100);
          setStatus("success");

          const blob = this.response as Blob;
          const outName = file.name.replace(/\.[^/.]+$/, "") + config.outputExt;
          setResultBlob(blob);
          setResultFileName(outName);

          const modeHeader = xhr.getResponseHeader("X-Conversion-Mode");
          setConversionMode(modeHeader);
          const hasTextHeader = xhr.getResponseHeader("X-PDF-Has-Text");
          if (hasTextHeader === "1") setPdfHasText(true);
          else if (hasTextHeader === "0") setPdfHasText(false);
          return;
        }

        // If backend scheduled a job, it will return 202 with JSON {job_id}
        if (this.status === 202) {
          setStatus("converting");
          // Read JSON from blob
          (this.response as Blob).text().then((t) => {
            try {
              const data = JSON.parse(t) as { job_id?: number };
              const jobId = data.job_id;
              if (!jobId) {
                setStatus("error");
                setErrorMessage("Không nhận được job id từ server.");
                return;
              }
              jobIdRef.current = jobId;

              // Poll status endpoint periodically
              const base = apiUrl.replace(/\/convert\/?$/, "");
              pollTimerRef.current = window.setInterval(async () => {
                try {
                  const res = await fetch(`${base}/convert/status/${jobId}`);
                  if (!res.ok) throw new Error(`Status ${res.status}`);
                  const s = await res.json();
                  if (s.status === "completed" && s.result_url) {
                    // Fetch result file
                    const r = await fetch(`${base}${s.result_url}`);
                    if (!r.ok) {
                      setStatus("error");
                      setErrorMessage("Không thể tải xuống file kết quả.");
                      if (pollTimerRef.current) {
                        window.clearInterval(pollTimerRef.current);
                        pollTimerRef.current = null;
                      }
                      return;
                    }
                    const b = await r.blob();
                    const outName = file.name.replace(/\.[^/.]+$/, "") + config.outputExt;
                    setResultBlob(b);
                    setResultFileName(outName);
                    setProgress(100);
                    setStatus("success");
                    if (pollTimerRef.current) {
                      window.clearInterval(pollTimerRef.current);
                      pollTimerRef.current = null;
                    }
                    return;
                  }

                  if (s.status === "failed" || s.status === "cancelled") {
                    setStatus("error");
                    setErrorMessage(s.error || `Job ${s.status}`);
                    if (pollTimerRef.current) {
                      window.clearInterval(pollTimerRef.current);
                      pollTimerRef.current = null;
                    }
                    return;
                  }

                  // Keep showing spinner; optionally increase progress slightly
                  setProgress((p) => Math.min(95, Math.max(p, p + 2)));
                } catch (e) {
                  // ignore transient polling errors
                }
              }, 2000);
            } catch (e) {
              setStatus("error");
              setErrorMessage("Không thể parse response job id.");
            }
          });

          return;
        }

        // Other non-200 statuses handled below
        const statusCode = this.status;
        const fallback = `Lỗi Server: ${statusCode} ${this.statusText}`.trim();

        // For plan/quota gating, let the UI show a modal instead of the error panel.
        if (statusCode === 403 || statusCode === 429) {
          setStatus("idle");
          setErrorMessage("");

          const resp = this.response as unknown;
          if (resp instanceof Blob) {
            resp
              .text()
              .then((t) => {
                try {
                  const parsed = JSON.parse(t) as { detail?: string };
                  setGateBlocked({ status: statusCode, detail: parsed?.detail || t || fallback });
                } catch {
                  setGateBlocked({ status: statusCode, detail: t || fallback });
                }
              })
              .catch(() => setGateBlocked({ status: statusCode, detail: fallback }));
          } else {
            setGateBlocked({ status: statusCode, detail: fallback });
          }
          return;
        }

        // Specific handling for service-unavailable (OCR missing)
        if (statusCode === 503) {
          setStatus("error");
          const resp = this.response as unknown;
          if (resp instanceof Blob) {
            resp
              .text()
              .then((t) => {
                setErrorMessage(t || fallback);
              })
              .catch(() => setErrorMessage(fallback));
          } else {
            setErrorMessage(fallback);
          }
          return;
        }

        setStatus("error");

        const resp = this.response as unknown;
        if (resp instanceof Blob) {
          resp
            .text()
            .then((t) => {
              try {
                const parsed = JSON.parse(t) as { detail?: string };
                if (parsed?.detail) setErrorMessage(`Lỗi Server: ${parsed.detail}`);
                else if (t) setErrorMessage(`Lỗi Server: ${t}`);
                else setErrorMessage(fallback);
              } catch {
                if (t) setErrorMessage(`Lỗi Server: ${t}`);
                else setErrorMessage(fallback);
              }
            })
            .catch(() => setErrorMessage(fallback));
        } else {
          setErrorMessage(fallback);
        }
      };

      xhr.onerror = function () {
        xhrRef.current = null;
        setStatus("error");
        setErrorMessage("Không thể kết nối đến server.");
      };

      xhr.onabort = function () {
        xhrRef.current = null;
        setStatus("idle");
        setErrorMessage("Đã hủy chuyển đổi.");
      };

      xhr.send(formData);
      setStatus("converting");
    } catch {
      setStatus("error");
      setErrorMessage("Đã xảy ra lỗi không mong muốn.");
    }
  }, [activeTool, apiUrl, config.outputExt, file, isDemoMode, simulateConversion, triggerDownload]);

  return {
    file,
    status,
    progress,
    errorMessage,
    resultBlob,
    resultFileName,
    conversionMode,
    pdfHasText,
    dragActive,
    fileInputRef,
    dropzoneRef,
    setDragActive,
    setProgress,
    setStatus,
    setErrorMessage,
    validateAndSetFile,
    removeFile,
    handleDrag,
    handleDrop,
    handleChange,
    handleConvert,
    downloadResult,
    gateBlocked,
    clearGateBlocked: () => setGateBlocked(null),
    cancelConversion,
  };
}
