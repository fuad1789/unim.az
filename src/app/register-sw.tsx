"use client";

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator) {
      const channel = new BroadcastChannel("pwa-sw-updates");
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // Could trigger a refresh banner
      });
      channel.addEventListener("message", (event) => {
        if (event.data?.type === "NEW_VERSION") {
          // Optionally notify user there is an update
        }
      });
    }
  }, []);
  return null;
}
