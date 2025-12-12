"use client";

import { useCallback, useMemo, useState } from "react";

export type AiMode = "email" | "title" | null;

type Params = {
  file: File | null;
  apiKey: string;
};

export function useGeminiAssistant({ file, apiKey }: Params) {
  const [aiResult, setAiResult] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState<AiMode>(null);

  const canUseAi = useMemo(() => Boolean(apiKey), [apiKey]);

  const callGeminiAI = useCallback(
    async (mode: Exclude<AiMode, null>) => {
      if (!file) return;

      setIsAiLoading(true);
      setAiMode(mode);
      setAiResult("");

      try {
        let prompt = "";
        if (mode === "email") {
          prompt = `Hãy đóng vai một trợ lý văn phòng chuyên nghiệp. Viết một email ngắn gọn, lịch sự bằng tiếng Việt để gửi đính kèm tập tin có tên là "${file.name}". Nội dung email nên bao gồm lời chào, thông báo đã gửi file và lời cảm ơn.`;
        } else if (mode === "title") {
          prompt = `Tập tin gốc có tên là "${file.name}". Hãy gợi ý 5 các đặt tên khác cho tập tin này sao cho chuyên nghiệp, ngắn gọn và dễ hiểu hơn (dùng tiếng Việt). Trả về dưới dạng danh sách gạch đầu dòng.`;
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          }
        );

        const data = (await response.json()) as any;
        if (data?.error) throw new Error(data.error.message);

        const text: string | undefined =
          data?.candidates?.[0]?.content?.parts?.[0]?.text;
        setAiResult(text || "Không thể tạo nội dung lúc này.");
      } catch (error) {
        console.error("AI Error:", error);
        setAiResult(
          "Xin lỗi, tính năng AI đang gặp sự cố kết nối. Vui lòng thử lại sau."
        );
      } finally {
        setIsAiLoading(false);
      }
    },
    [apiKey, file]
  );

  const copyToClipboard = useCallback(() => {
    if (!aiResult) return;

    navigator.clipboard
      .writeText(aiResult)
      .then(() => {
        // ok
      })
      .catch(() => {
        // ignore, fallback below
      });

    // Fallback for older browsers / blocked clipboard
    const textarea = document.createElement("textarea");
    textarea.value = aiResult;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Fallback copy failed", err);
    }
    document.body.removeChild(textarea);
  }, [aiResult]);

  return {
    aiResult,
    aiMode,
    canUseAi,
    isAiLoading,
    setAiMode,
    setAiResult,
    callGeminiAI,
    copyToClipboard,
  };
}
