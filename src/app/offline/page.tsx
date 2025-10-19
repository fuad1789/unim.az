import Link from "next/link";

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-bold mb-3">Offline rejim</h1>
        <p className="text-gray-600 mb-6">
          İnternet bağlantısı yoxdur. Əvvəl ziyarət etdiyiniz səhifələr oflayn
          rejimdə mövcud ola bilər.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
        >
          Ana səhifəyə qayıt
        </Link>
      </div>
    </main>
  );
}
