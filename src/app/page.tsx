"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import universitiesData from "@/data/universities.json";
import { calculateCurrentWeekType, University } from "@/utils/weekCalculator";
import { Share2 } from "lucide-react";

// Azerbaijani-aware normalizer: maps special letters to Latin counterparts and lowercases
function normalizeAz(input: string): string {
  if (!input) return "";
  const map: Record<string, string> = {
    ə: "e",
    Ə: "e",
    ı: "i",
    I: "i", // dotless I -> i
    İ: "i", // dotted capital I -> i
    ü: "u",
    Ü: "u",
    ö: "o",
    Ö: "o",
    ç: "c",
    Ç: "c",
    ş: "s",
    Ş: "s",
    ğ: "g",
    Ğ: "g",
  };
  let out = "";
  for (const ch of input) {
    out += map[ch] ?? ch;
  }
  return out.toLowerCase();
}

// Compute initials from words (e.g., "Bakı Dövlət Universiteti" -> "BDU")
function computeInitials(name: string): string {
  const words = name
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
  const stopwords = new Set([
    // common Azerbaijani stopwords in names
    "və",
    "ve",
    "yanında",
    "üzrə",
    "uzre",
    "dövlət",
    "dovlet",
    "universiteti",
    "akademiyası",
    "akademiyasi",
    "institutu",
  ]);
  const letters: string[] = [];
  for (const w of words) {
    const n = normalizeAz(w);
    if (!n || stopwords.has(n)) continue;
    letters.push(n[0]);
  }
  return letters.join("");
}

// Levenshtein distance (iterative, memory-optimized)
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    let curr = new Array(n + 1);
    curr[0] = i;
    const aChar = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = aChar === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1, // insertion
        prev[j] + 1, // deletion
        prev[j - 1] + cost // substitution
      );
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

// Compute match score between query and a university
function scoreUniversity(queryRaw: string, uni: University): number {
  const q = normalizeAz(queryRaw);
  if (!q) return 0;

  const nameNorm = normalizeAz(uni.name);
  const shortNorm = normalizeAz(uni.shortName || "");
  const initialsNorm = computeInitials(uni.name); // already normalized

  // Exact or prefix/substring matches
  if (nameNorm === q) return 200;
  if (shortNorm === q) return 200;
  if (initialsNorm === q) return 190;

  if (nameNorm.startsWith(q)) return 180 - (nameNorm.length - q.length);
  if (shortNorm.startsWith(q)) return 175 - (shortNorm.length - q.length);
  if (initialsNorm.startsWith(q)) return 170 - (initialsNorm.length - q.length);

  if (nameNorm.includes(q)) return 160 - (nameNorm.indexOf(q) || 0);
  if (shortNorm.includes(q)) return 155 - (shortNorm.indexOf(q) || 0);
  if (initialsNorm.includes(q)) return 150 - (initialsNorm.indexOf(q) || 0);

  // Fuzzy distances (normalized)
  const dName = levenshtein(q, nameNorm);
  const dShort = shortNorm
    ? levenshtein(q, shortNorm)
    : Number.MAX_SAFE_INTEGER;
  const dInit = initialsNorm
    ? levenshtein(q, initialsNorm)
    : Number.MAX_SAFE_INTEGER;

  const lenName = Math.max(nameNorm.length, 1);
  const lenShort = Math.max(shortNorm.length, 1);
  const lenInit = Math.max(initialsNorm.length, 1);

  const nName = 1 - dName / Math.max(lenName, q.length);
  const nShort = shortNorm ? 1 - dShort / Math.max(lenShort, q.length) : 0;
  const nInit = initialsNorm ? 1 - dInit / Math.max(lenInit, q.length) : 0;

  // Weighted max of normalized similarities
  const fuzzy = Math.max(nName * 100, nShort * 110, nInit * 95);

  // Threshold: only consider if somewhat similar
  if (fuzzy > 40) return fuzzy;

  return 0;
}

// Find the first direct normalized substring match range in original text
function findNormalizedMatchRange(
  original: string,
  queryRaw: string
): [number, number] | null {
  const q = normalizeAz(queryRaw);
  if (!q) return null;
  let normAccum = "";
  // Map normalized index -> original index
  const mapIdx: number[] = [];
  for (let i = 0; i < original.length; i++) {
    const n = normalizeAz(original[i]);
    normAccum += n;
    for (let k = 0; k < n.length; k++) {
      mapIdx.push(i);
    }
  }
  const start = normAccum.indexOf(q);
  if (start === -1) return null;
  const end = start + q.length - 1;
  const startOrig = mapIdx[start];
  const endOrig = mapIdx[end] + 1; // slice is non-inclusive
  return [startOrig, endOrig];
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const range = findNormalizedMatchRange(text, query);
  if (!query || !range) return <>{text}</>;
  const [s, e] = range;
  return (
    <>
      {text.slice(0, s)}
      <mark className="bg-yellow-200 text-inherit px-0.5 rounded-sm">
        {text.slice(s, e)}
      </mark>
      {text.slice(e)}
    </>
  );
}

export default function Home() {
  const [selectedUniversityId, setSelectedUniversityId] = useState<
    number | null
  >(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const universities: University[] =
    universitiesData as unknown as University[];

  useEffect(() => {
    try {
      const stored = localStorage.getItem("universityId");
      if (stored) {
        setSelectedUniversityId(Number(stored));
        setIsSelectorOpen(false);
      } else {
        setIsSelectorOpen(true);
      }
    } catch {
      setIsSelectorOpen(true);
    }
  }, []);

  // Debounce query
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(id);
  }, [query]);

  const selectedUniversity = useMemo(() => {
    return universities.find((u) => u.id === selectedUniversityId) || null;
  }, [selectedUniversityId, universities]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim();
    if (!q) return universities;

    // Score and sort by quality
    const scored = universities
      .map((u) => ({ u, s: scoreUniversity(q, u) }))
      .filter(({ s }) => s > 0)
      .sort((a, b) => b.s - a.s || a.u.name.localeCompare(b.u.name));

    // If nothing scored above threshold, fall back to simple contains on normalized
    if (scored.length === 0) {
      const qn = normalizeAz(q);
      return universities.filter((u) => {
        const nn = normalizeAz(u.name);
        const sn = normalizeAz(u.shortName || "");
        const ini = computeInitials(u.name);
        return nn.includes(qn) || sn.includes(qn) || ini.includes(qn);
      });
    }

    return scored.map(({ u }) => u);
  }, [debouncedQuery, universities]);

  // Ensure active index stays within bounds when list changes
  useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(0);
  }, [filtered.length, activeIndex]);

  // Scroll active item into view on change
  useEffect(() => {
    const el = itemRefs.current[activeIndex];
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, filtered.length]);

  const handleSelectUniversity = (value: University) => {
    localStorage.setItem("universityId", String(value.id));
    setSelectedUniversityId(value.id);
    setIsSelectorOpen(false);
  };

  const handleChangeUniversity = () => {
    localStorage.removeItem("universityId");
    setSelectedUniversityId(null);
    setQuery("");
    setDebouncedQuery("");
    setIsSelectorOpen(true);
    setActiveIndex(0);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSelectorOpen) return;
    if (filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) handleSelectUniversity(item);
    }
  };

  const handleShare = async () => {
    if (!selectedUniversity) return;
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://unim.az";

    // Template message with university and week info
    const template = `${selectedUniversity.name}\n\n🗓 Bu həftə: ${resultText}\n\n🔗 Mənbə: unim.az`;
    const fullMessage = template;

    // Prefer WhatsApp share to ensure text is preserved
    const waUrl = `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;
    try {
      window.open(waUrl, "_blank", "noopener,noreferrer");
      return;
    } catch (_) {
      // fall through to clipboard
    }

    try {
      await navigator.clipboard.writeText(fullMessage);
      alert("Mətn və link kopyalandı ✨");
    } catch (err) {
      alert("Paylaşmaq alınmadı. Zəhmət olmasa özünüz kopyalayın.");
    }
  };

  const resultText = selectedUniversity
    ? calculateCurrentWeekType(selectedUniversity)
    : "";
  const resultLetters = useMemo(() => Array.from(resultText), [resultText]);
  const titleVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
  };
  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    const first = parts[0]?.[0] || "?";
    const last = parts[1]?.[0] || "";
    return (first + last).toUpperCase();
  };

  return (
    <main className="min-h-dvh flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl">
        {/* Result View */}
        <AnimatePresence mode="wait">
          {selectedUniversity && !isSelectorOpen && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="text-center"
            >
              {/* Headline first */}
              <motion.h1
                className="text-3xl sm:text-6xl font-extrabold tracking-tight leading-tight"
                initial="hidden"
                animate="visible"
                variants={titleVariants}
              >
                {resultLetters.map((char, idx) => (
                  <motion.span
                    key={idx}
                    className="inline-block"
                    variants={letterVariants}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </motion.h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Identity row under headline (kept outside any transformed parent) */}
        {selectedUniversity && !isSelectorOpen && (
          <div
            className="fixed left-1/2 -translate-x-1/2 mx-auto flex items-center gap-2 sm:gap-3"
            style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)" }}
          >
            <div className="flex items-center gap-2 sm:gap-3 text-gray-700 bg-white/90 backdrop-blur-md ring-1 ring-black/5 shadow-md rounded-full px-3 py-2 sm:px-4 sm:py-2.5 max-w-[78vw]">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-1 ring-black/5 overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                {selectedUniversity.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedUniversity.img}
                    alt={selectedUniversity.name}
                    className="h-full w-full object-contain"
                    loading="eager"
                  />
                ) : (
                  <span className="text-[10px] font-semibold text-gray-600">
                    {getInitials(selectedUniversity.name)}
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base md:text-lg text-gray-800 max-w-[52vw] sm:max-w-none truncate">
                {selectedUniversity.name}
              </p>
              <span className="hidden sm:inline text-gray-300">•</span>
              <button
                onClick={handleChangeUniversity}
                className="text-sm sm:text-base text-blue-600 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded px-1 shrink-0"
              >
                Dəyişdir
              </button>
            </div>
            <button
              onClick={handleShare}
              aria-label="Paylaş"
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white/90 backdrop-blur-md ring-1 ring-black/5 shadow-md flex items-center justify-center text-blue-600 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <Share2 className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Selection Overlay */}
        <AnimatePresence>
          {isSelectorOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              />

              {/* Scrollable Centered Area */}
              <motion.div
                key="card"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="fixed inset-0 p-4 overflow-y-auto"
              >
                <div className="mx-auto my-6 w-full max-w-lg bg-white/90 backdrop-blur-md rounded-2xl shadow-xl ring-1 ring-black/5 p-5 sm:p-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 text-center">
                    Universitetini Seç
                  </h2>

                  {/* Search Input */}
                  <div className="mt-4 relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </span>
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder="Universitet axtar..."
                      className="w-full pl-10 pr-3 py-2.5 bg-gray-100/90 border border-transparent hover:border-gray-200 rounded-lg text-gray-800 text-sm sm:text-base md:text-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 transition"
                    />
                  </div>

                  {/* Results List */}
                  <div className="mt-3 rounded-lg max-h-[52vh] sm:max-h-72 overflow-auto">
                    {filtered.length === 0 ? (
                      <div className="text-center text-sm text-gray-500 py-6">
                        Uyğun universitet tapılmadı
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-100/80">
                        {filtered.map((u, idx) => (
                          <li key={u.id}>
                            <button
                              ref={(el) => {
                                itemRefs.current[idx] = el;
                              }}
                              onClick={() => handleSelectUniversity(u)}
                              className={`w-full text-left px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition flex items-center gap-3 overflow-hidden ${
                                idx === activeIndex ? "bg-gray-50" : ""
                              }`}
                              aria-selected={idx === activeIndex}
                              tabIndex={-1}
                            >
                              <div className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full overflow-hidden bg-gray-100 ring-1 ring-black/5 flex items-center justify-center shrink-0">
                                {u.img ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={u.img}
                                    alt={u.name}
                                    className="h-full w-full object-contain"
                                    loading="lazy"
                                  />
                                ) : (
                                  <span className="text-[10px] font-semibold text-gray-600">
                                    {getInitials(u.name)}
                                  </span>
                                )}
                              </div>
                              <span className="text-gray-800 text-sm sm:text-base md:text-lg flex-1 min-w-0 whitespace-nowrap truncate">
                                <HighlightedText
                                  text={u.name}
                                  query={debouncedQuery}
                                />
                              </span>
                              <span className="ml-2 shrink-0 inline-flex items-center gap-1">
                                {u.shortName && (
                                  <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                                    {u.shortName}
                                  </span>
                                )}
                                {/* startDate hidden per request */}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
