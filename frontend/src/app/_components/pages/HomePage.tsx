"use client";

import React from "react";
import type { ToolKey } from "../../_config/tools";
import HomeConverter from "../converter/HomeConverter";

type Props = {
  activeTool: ToolKey;
  onSelectTool: (tool: ToolKey) => void;
};

export default function HomePage({ activeTool, onSelectTool }: Props) {
  return <HomeConverter activeTool={activeTool} onSelectTool={onSelectTool} />;
}
