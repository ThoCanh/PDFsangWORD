"use client";

import React from "react";

export default function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-24 bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${
            value > 90
              ? "bg-green-500"
              : value > 70
                ? "bg-yellow-500"
                : "bg-red-500"
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-gray-500">{value}%</span>
    </div>
  );
}
