import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 px-4 py-2 text-body-sm font-medium text-white shadow-md"
      style={{ backgroundColor: "#0F2A47" }}
      role="status"
      aria-live="polite"
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}
      >
        cloud_off
      </span>
      <span>You are offline. Data may be outdated.</span>
    </div>
  );
}
