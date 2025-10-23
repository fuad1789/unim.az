"use client";

import { useEffect } from "react";
import {
  initializeOfflineMode,
  preloadOfflineData,
} from "@/utils/offlineManager";

export default function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      // Initialize offline mode
      initializeOfflineMode();

      // Register service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered successfully:", registration);

          // Preload offline data when service worker is ready
          if (registration.active) {
            preloadOfflineData();
          }
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });

      // Listen for service worker updates
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("Service Worker controller changed");
        // Reload page to get new service worker
        window.location.reload();
      });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "CACHE_UPDATED") {
          console.log("Cache updated, refreshing data...");
          // Trigger a custom event for components to listen to
          window.dispatchEvent(new CustomEvent("offlineDataUpdated"));
        }
      });

      // Handle online/offline events
      const handleOnline = () => {
        console.log("App is online");
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: "ONLINE" });
        }
      };

      const handleOffline = () => {
        console.log("App is offline");
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: "OFFLINE" });
        }
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // Cleanup
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  return null;
}
