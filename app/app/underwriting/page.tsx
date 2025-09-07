import { PlaceholderPage } from "../components/placeholder-page";

export default function UnderwritingPage() {
  return (
    <PlaceholderPage
      title="Underwriting"
      description="Analyze deals with ARV, repair estimates, and MAO calculations"
      features={[
        "Automated comp selection and ARV calculation",
        "Repair cost estimation with line items",
        "MAO (Maximum Allowable Offer) calculator",
        "Deal packet generation",
        "LOI and offer letter templates",
        "Historical deal analysis",
      ]}
    />
  );
}
