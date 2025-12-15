import type { LucideIcon } from "lucide-react";
import { FileText, Image as ImageIcon, FileText as FileIcon } from "lucide-react";

export type ToolKey = "pdf-word" | "jpg-png" | "word-pdf";

export type ToolConfig = {
  title: string;
  accept: string;
  mimeType: string;
  icon: LucideIcon;
  color: "blue" | "green" | "red";
  desc: string;
  outputExt: string;
};

export const TOOL_CONFIG: Record<ToolKey, ToolConfig> = {
  "pdf-word": {
    title: "PDF sang Word",
    accept: ".pdf",
    mimeType: "application/pdf",
    icon: FileText,
    color: "blue",
    desc: "Chuyển đổi tài liệu PDF sang Word dễ chỉnh sửa.",
    outputExt: ".docx",
  },
  "jpg-png": {
    title: "JPG sang PNG",
    accept: ".jpg, .jpeg",
    mimeType: "image/jpeg",
    icon: ImageIcon,
    color: "green",
    desc: "Chuyển đổi ảnh JPG sang định dạng PNG chất lượng cao.",
    outputExt: ".png",
  },
  "word-pdf": {
    title: "Word sang PDF",
    accept: ".docx, .doc",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    icon: FileIcon,
    color: "red",
    desc: "Chuyển đổi tài liệu Word sang PDF chuẩn in ấn.",
    outputExt: ".pdf",
  },
};
