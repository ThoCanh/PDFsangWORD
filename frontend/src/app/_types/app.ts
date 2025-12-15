import type { ToolKey } from "../_config/tools";

export type ViewKey = "home" | "tools" | "pricing" | "about" | "login";

export type ConvertStatus =
  | "idle"
  | "uploading"
  | "converting"
  | "success"
  | "error";

export type SelectedPlan = string | null;

export type ActiveTool = ToolKey;
