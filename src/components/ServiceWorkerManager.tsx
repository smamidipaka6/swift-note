"use client";

import { useEffect, useState } from "react";

export function ServiceWorkerManager() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // First check if we're in a browser environment
    if (typeof window === "undefined") {
      return; // Silent return for server-side rendering
    }

    // Then check if service workers are supported
    if (!("serviceWorker" in navigator)) {
      console.log("Service workers are not supported in this browser");
      return;
    }

    // Finally check if we're in development mode
    if (process.env.NODE_ENV === "development") {
      console.log("Service worker disabled in development mode");
      return;
    }

    // If we passed all checks, register the service worker
    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        console.log("Service worker registered successfully");
        setRegistration(reg);

        // Check for service worker updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            // When a new service worker is installed and waiting
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log("New service worker available - update ready");
              setUpdateAvailable(true);
            }
          });
        });
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    };

    registerSW();

    // Setup version check to run periodically
    const checkForUpdates = async () => {
      const lastCheckTime = localStorage.getItem("lastUpdateCheck");
      const now = Date.now();
      const oneDayInMs = 24 * 60 * 60 * 1000;

      // Check for updates once per day
      if (!lastCheckTime || now - parseInt(lastCheckTime) > oneDayInMs) {
        // Delay the check to prioritize initial page load
        setTimeout(async () => {
          try {
            // Store current version for comparison
            const currentVersion = localStorage.getItem("appVersion") || "0";

            // Fetch latest version with cache-busting query parameter
            const response = await fetch(`/version.json?t=${now}`);
            if (!response.ok) return;

            const latestVersion = await response.json();

            if (latestVersion.version !== currentVersion) {
              // New version available
              setUpdateAvailable(true);
            } else {
              // Same version, update stored version
              localStorage.setItem("appVersion", latestVersion.version);
            }

            // Update last check time
            localStorage.setItem("lastUpdateCheck", now.toString());
          } catch (error) {
            console.error("Error checking for updates:", error);
          }
        }, 6000); // Check after 6 seconds
      }
    };

    checkForUpdates();

    // Clean up on unmount
    return () => {
      // Nothing to clean up for service worker itself
    };
  }, []);

  // Don't render update notification if no update available
  if (!updateAvailable) return null;

  // Render update notification
  return (
    <div className="fixed bottom-12 right-4 z-50">
      <button
        onClick={() => {
          if (registration && registration.waiting) {
            // Instruct the waiting service worker to activate
            registration.waiting.postMessage({ action: "skipWaiting" });

            // Get the new version and store it
            fetch("/version.json?t=" + Date.now())
              .then((res) => res.json())
              .then((data) => {
                localStorage.setItem("appVersion", data.version);

                // Reload the page to use the new service worker
                window.location.reload();
              });
          }
        }}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg hover:bg-primary/90 transition-colors"
      >
        Update Available! Click to refresh
      </button>
    </div>
  );
}
