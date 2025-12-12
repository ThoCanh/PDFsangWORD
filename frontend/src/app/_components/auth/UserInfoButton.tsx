"use client";

import { useAuth } from "./AuthContext";

export default function UserInfoButton() {
  const { email } = useAuth();
  if (!email) return null;
  return (
    <span className="px-4 py-2 text-sm font-medium border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 active:scale-[0.98] active:shadow-inner transition duration-150 shadow-sm flex items-center gap-2">
      {email}
    </span>
  );
}