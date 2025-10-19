"use client";

import { useState, useEffect } from "react";
import InstallPrompt from "../../components/InstallPrompt";

export default function InstallTestPage() {
  const [platformInfo, setPlatformInfo] = useState({
    userAgent: "",
    isIOS: false,
    isAndroid: false,
    isStandalone: false,
    hasBeforeInstallPrompt: false,
  });

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);
    const isAndroid = /android/i.test(userAgent);
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;

    setPlatformInfo({
      userAgent,
      isIOS,
      isAndroid,
      isStandalone,
      hasBeforeInstallPrompt: false, // This will be updated by the component
    });

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = () => {
      setPlatformInfo((prev) => ({ ...prev, hasBeforeInstallPrompt: true }));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          PWA Install Test Page
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Platform Detection
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">User Agent:</span>
              <span className="text-gray-600 font-mono text-xs break-all">
                {platformInfo.userAgent}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">iOS Device:</span>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  platformInfo.isIOS
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {platformInfo.isIOS ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Android Device:</span>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  platformInfo.isAndroid
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {platformInfo.isAndroid ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Already Installed:</span>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  platformInfo.isStandalone
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {platformInfo.isStandalone ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">
                Before Install Prompt Available:
              </span>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  platformInfo.hasBeforeInstallPrompt
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {platformInfo.hasBeforeInstallPrompt ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Expected Behavior
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <strong>Android Users:</strong> Should see install button when
              beforeinstallprompt fires
            </div>
            <div>
              <strong>iOS Users:</strong> Should see install button that opens
              modal with instructions
            </div>
            <div>
              <strong>Already Installed:</strong> No install button should
              appear
            </div>
            <div>
              <strong>Dismissed:</strong> Button won&apos;t reappear for 7 days
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Check the bottom-right corner for the install button
          </p>
        </div>
      </div>

      {/* Install Prompt Component */}
      <InstallPrompt />
    </div>
  );
}
