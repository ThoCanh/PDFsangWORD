"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ToolConfig, ToolKey } from "../_config/tools";

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
  const [dragActive, setDragActive] = useState(false);

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
  }, []);

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

  const handleConvert = useCallback(async () => {
    if (!file) return;

    setStatus("uploading");
    setProgress(0);

    if (isDemoMode) {
      simulateConversion();
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", activeTool);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", apiUrl, true);
      xhr.responseType = "blob";

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 80);
          setProgress(percentComplete);
        }
      };

      xhr.onload = function () {
        if (this.status === 200) {
          setProgress(100);
          setStatus("success");

          const blob = this.response as Blob;
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = file.name.replace(/\.[^/.]+$/, "") + config.outputExt;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(downloadUrl);
        } else {
          setStatus("error");
          setErrorMessage(`Lỗi Server: ${this.statusText}`);
        }
      };

      xhr.onerror = function () {
        setStatus("error");
        setErrorMessage("Không thể kết nối đến server.");
      };

      xhr.send(formData);
      setStatus("converting");
    } catch {
      setStatus("error");
      setErrorMessage("Đã xảy ra lỗi không mong muốn.");
    }
  }, [activeTool, apiUrl, config.outputExt, file, isDemoMode, simulateConversion]);

  return {
    file,
    status,
    progress,
    errorMessage,
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
  };
}
