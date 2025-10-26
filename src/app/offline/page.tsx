"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getLastSyncTime,
  isOfflineDataStale,
  hasCurrentGroupData,
} from "@/utils/offlineManager";

export const dynamic = "force-static";

export default function OfflinePage() {
  const [lastSync, setLastSync] = useState<number>(0);
  const [isStale, setIsStale] = useState(false);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const lastSyncTime = getLastSyncTime();
    const stale = isOfflineDataStale();
    const hasOfflineDataResult = hasCurrentGroupData(); // Check if current group data exists

    setLastSync(lastSyncTime);
    setIsStale(stale);
    setHasData(hasOfflineDataResult);
  }, []);

  const formatLastSync = (timestamp: number) => {
    if (timestamp === 0) return "Heç vaxt";

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "İndi";
    if (diffMins < 60) return `${diffMins} dəqiqə əvvəl`;
    if (diffHours < 24) return `${diffHours} saat əvvəl`;
    return `${diffDays} gün əvvəl`;
  };

  return (
    <main className="min-h-dvh flex items-center justify-center p-6 text-center bg-gray-50">
      <div className="max-w-md mx-auto">
        {/* Offline Icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 1 0 0 19.5 9.75 9.75 0 0 0 0-19.5z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold mb-4 text-gray-900">Offline rejim</h1>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <p className="text-gray-600 mb-4">
            İnternet bağlantısı yoxdur. Əvvəl ziyarət etdiyiniz səhifələr oflayn
            rejimdə mövcud ola bilər.
          </p>

          {/* Data Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                Offline məlumatlar:
              </span>
              <span
                className={`text-sm font-semibold ${
                  hasData ? "text-green-600" : "text-red-600"
                }`}
              >
                {hasData ? "Mövcuddur" : "Yoxdur"}
              </span>
            </div>

            {lastSync > 0 && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  Son yenilənmə:
                </span>
                <span
                  className={`text-sm font-semibold ${
                    isStale ? "text-yellow-600" : "text-green-600"
                  }`}
                >
                  {formatLastSync(lastSync)}
                </span>
              </div>
            )}

            {isStale && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Məlumatlar köhnədir. İnternet bərpa olunanda yeniləyin.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            Ana səhifəyə qayıt
          </Link>

          {hasData && (
            <Link
              href="/schedule-wizard"
              className="block w-full px-5 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
            >
              Offline rejimdə işlə
            </Link>
          )}

          <button
            onClick={() => window.location.reload()}
            className="block w-full px-5 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Yenidən yoxla
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-xs text-gray-500">
          <p>İnternet bərpa olunanda məlumatlar avtomatik yenilənəcək.</p>
        </div>
      </div>
    </main>
  );
}
