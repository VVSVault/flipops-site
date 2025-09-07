import { PlaceholderPage } from "../components/placeholder-page";

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="Configure your account and system preferences"
      features={[
        "Organization profile management",
        "User and role management (RBAC)",
        "Pipeline and status configuration",
        "Tag management",
        "Custom field definitions",
        "Compliance settings (DNC, quiet hours)",
        "API keys and integrations",
        "Branding customization",
      ]}
    />
  );
}
