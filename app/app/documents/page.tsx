import { PlaceholderPage } from "../components/placeholder-page";

export default function DocumentsPage() {
  return (
    <PlaceholderPage
      title="Documents"
      description="Generate and manage contracts, offers, and agreements"
      features={[
        "Template library (LOI, PSA, JV, Assignment)",
        "Document generation with merge fields",
        "E-signature integration",
        "Version control",
        "Document storage and organization",
        "Automated packet creation",
      ]}
    />
  );
}
