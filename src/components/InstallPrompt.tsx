"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, X, Share, Plus, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Extend Window interface to include PWA events
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}

interface InstallPromptProps {
  className?: string;
}

export default function InstallPrompt({ className = "" }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Platform detection
  useEffect(() => {
    const checkPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      const isStandalone = window.matchMedia(
        "(display-mode: standalone)"
      ).matches;

      setIsIOS(isIOSDevice);
      setIsInstalled(isStandalone);
    };

    checkPlatform();
  }, []);

  // Handle beforeinstallprompt for Android
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowIOSModal(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Check if user has dismissed the prompt
  useEffect(() => {
    const dismissed = localStorage.getItem("install-prompt-dismissed");
    if (dismissed) {
      const dismissTime = parseInt(dismissed);
      const now = Date.now();
      // Show again after 7 days
      if (now - dismissTime < 7 * 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem("install-prompt-dismissed");
      }
    }
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      setIsLoading(true);
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
          // Installation was successful
          setDeferredPrompt(null);
        } else {
          // User dismissed the prompt
          handleDismiss();
        }
      } catch (error) {
        console.error("Error during installation:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setDeferredPrompt(null);
    setShowIOSModal(false);
    localStorage.setItem("install-prompt-dismissed", Date.now().toString());
  };

  const handleIOSModalClose = () => {
    setShowIOSModal(false);
    handleDismiss();
  };

  // Don't show if already installed, dismissed, or no prompt available
  if (isInstalled || isDismissed || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <>
      {/* Install Button */}
      <AnimatePresence>
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            delay: 1, // Delay to let page load
          }}
          onClick={handleInstallClick}
          disabled={isLoading}
          className={`
            fixed bottom-6 right-6 z-40 
            flex items-center gap-2 
            px-4 py-3 
            bg-gradient-to-r from-blue-600 to-blue-700 
            text-white font-medium text-sm
            rounded-full shadow-xl hover:shadow-2xl
            transition-all duration-200
            hover:scale-105 active:scale-95
            disabled:opacity-70 disabled:cursor-not-allowed
            ${className}
          `}
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            <Smartphone className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isIOS ? "Ana Ekrana Ekle" : "Tətbiqi Quraşdır"}
          </span>
          <span className="sm:hidden">{isIOS ? "Ekle" : "Quraşdır"}</span>
        </motion.button>
      </AnimatePresence>

      {/* iOS Modal */}
      <AnimatePresence>
        {showIOSModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={handleIOSModalClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Ana Ekrana Ekle
                  </h3>
                </div>
                <button
                  onClick={handleIOSModalClose}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Instructions */}
              <div className="space-y-4 mb-6">
                <p className="text-gray-600 text-sm">
                  Tətbiqi ana ekranınıza əlavə etmək üçün aşağıdakı addımları
                  izləyin:
                </p>

                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 font-medium mb-1">
                      Paylaş düyməsini basın
                    </p>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Share className="w-4 h-4" />
                      <span className="text-xs">
                        Brauzerin alt hissəsindəki paylaş düyməsi
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 font-medium mb-1">
                      &quot;Ana Ekrana Ekle&quot; seçin
                    </p>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Plus className="w-4 h-4" />
                      <span className="text-xs">
                        Açılan menyudan &quot;Ana Ekrana Ekle&quot; seçin
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 font-medium mb-1">
                      Hazır!
                    </p>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Check className="w-4 h-4" />
                      <span className="text-xs">
                        Tətbiq ana ekranınızda görünəcək
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Guide */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
                    <Share className="w-4 h-4" />
                  </div>
                  <span className="text-xs">→</span>
                  <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-xs">→</span>
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleIOSModalClose}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Bağla
                </button>
                <button
                  onClick={() => {
                    setShowIOSModal(false);
                    // Don't dismiss permanently for iOS users
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Anladım
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
