"use client";

import React from "react";

export default function GlobalStyles() {
  return (
    <style>{`
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes scaleUp {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .animate-fade-in {
        animation: fadeIn 0.4s ease-out forwards;
      }
      .animate-scale-up {
        animation: scaleUp 0.3s ease-out forwards;
      }
      /* Custom Scrollbar for nicer look */
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      ::-webkit-scrollbar-track {
        background: #f1f5f9;
      }
      ::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `}</style>
  );
}
