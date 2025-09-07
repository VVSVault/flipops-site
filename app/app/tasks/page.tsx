import { PlaceholderPage } from "../components/placeholder-page";

export default function TasksPage() {
  return (
    <PlaceholderPage
      title="Tasks"
      description="Track and manage all your to-dos and follow-ups"
      features={[
        "Task list and calendar views",
        "SLA tracking and alerts",
        "Team assignment",
        "Recurring task templates",
        "Integration with leads and deals",
        "Automated task creation from triggers",
      ]}
    />
  );
}
