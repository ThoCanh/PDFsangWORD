import AdminDashboard from "../_components/admin/AdminDashboard";
import RequireAuth from "../_components/auth/RequireAuth";

export default function Page() {
  return (
    <RequireAuth allow={["admin"]}>
      <AdminDashboard />
    </RequireAuth>
  );
}

