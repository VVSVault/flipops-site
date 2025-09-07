import { PlaceholderPage } from "../components/placeholder-page";

export default function DataSourcesPage() {
  return (
    <PlaceholderPage
      title="Data Sources & Automations"
      description="Manage data integrations and automation workflows"
      features={[
        "County data scraper configuration",
        "MLS integration settings",
        "Skip tracing service connections",
        "Job scheduling and monitoring",
        "Error logs and retry management",
        "Field mapping and data transformation",
      ]}
    />
  );
}
