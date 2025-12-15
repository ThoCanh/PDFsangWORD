import RequireAuth from "../_components/auth/RequireAuth";
import AccountPage from "../_components/account/AccountPage";

export default function Page() {
  return (
    <RequireAuth allow={["user", "admin"]}>
      <AccountPage />
    </RequireAuth>
  );
}
