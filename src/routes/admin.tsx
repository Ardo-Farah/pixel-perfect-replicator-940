import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  // TODO: re-enable role check before backend wiring.
  // Mock-data phase: allow anyone to preview the admin UI.
  return <Outlet />;
}
