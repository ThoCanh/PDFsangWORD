"use client";

import RequireAuth from "../_components/auth/RequireAuth";
import UserDashboard from "../_components/user/UserDashboard";

export default function Page() {
  return (
    <RequireAuth allow={["user"]}>
      <UserDashboard />
    </RequireAuth>
  );
}
