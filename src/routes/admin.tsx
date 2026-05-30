import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  // Keep admin lists in sync the moment any admin (including this one)
  // uploads, deletes, or edits anything.
  useRealtimeInvalidate(["documents", "page_content", "weekly_reports"]);
  return <Outlet />;
}
