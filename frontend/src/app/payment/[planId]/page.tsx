import PaymentPage from "../../_components/pages/PaymentPage";

export default function Page({ params }: { params: { planId: string } }) {
  return <PaymentPage planId={params.planId} />;
}
