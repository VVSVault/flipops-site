import { PlaceholderPage } from "../components/placeholder-page";

export default function InboxPage() {
  return (
    <PlaceholderPage
      title="Inbox"
      description="Unified communication hub for all your lead interactions"
      features={[
        "Unified thread list organized by lead",
        "Multi-channel support (SMS, Email, Voicemail)",
        "Message templates and quick replies",
        "Sentiment analysis for each message",
        "Automated follow-up scheduling",
      ]}
    />
  );
}