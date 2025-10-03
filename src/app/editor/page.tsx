"use client";

import { useEffect, useMemo, useState } from "react";
import data from "@/data/SDU_muhendislik.json";
import { Day, Group, Lesson } from "@/types";

type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> };

type EditableGroup = Mutable<Group>;

export default function EditorPage() {
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState<EditableGroup[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // load once
  useEffect(() => {
    try {
      const initial: EditableGroup[] = Array.isArray(data)
        ? (data as EditableGroup[])
        : [];
      setGroups(initial);
    } catch {
      setGroups([]);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.group.toLowerCase().includes(q));
  }, [groups, search]);

  const toggleExpand = (groupName: string) => {
    setExpanded((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const updateGroupName = (index: number, name: string) => {
    setGroups((prev) => {
      const draft = [...prev];
      draft[index] = { ...draft[index], group: name };
      return draft;
    });
  };

  const updateDayName = (gIdx: number, dIdx: number, name: string) => {
    setGroups((prev) => {
      const draft = [...prev];
      const days = [...(draft[gIdx].week_schedule || [])];
      const day: Day = { ...days[dIdx], day: name };
      days[dIdx] = day;
      draft[gIdx] = { ...draft[gIdx], week_schedule: days };
      return draft;
    });
  };

  const updateLessonField = (
    gIdx: number,
    dIdx: number,
    lIdx: number,
    field: keyof Lesson,
    value: string
  ) => {
    setGroups((prev) => {
      const draft = [...prev];
      const days = [...(draft[gIdx].week_schedule || [])];
      const lessons = [...(days[dIdx].lessons || [])];
      const lesson: Lesson = { ...lessons[lIdx] };
      if (field === "lesson") {
        // ignore here; handled via nested fields below
      } else {
        (lesson as Record<string, unknown>)[field] = value;
      }
      lessons[lIdx] = lesson;
      days[dIdx] = { ...days[dIdx], lessons };
      draft[gIdx] = { ...draft[gIdx], week_schedule: days };
      return draft;
    });
  };

  const updateNested = (
    gIdx: number,
    dIdx: number,
    lIdx: number,
    half: "upper" | "lower",
    field: "subject" | "teacher" | "room",
    value: string
  ) => {
    setGroups((prev) => {
      const draft = [...prev];
      const days = [...(draft[gIdx].week_schedule || [])];
      const lessons = [...(days[dIdx].lessons || [])];
      const lesson: Lesson = { ...lessons[lIdx] };
      const current = lesson.lesson || {
        upper: { subject: "", teacher: "", room: "" },
        lower: { subject: "", teacher: "", room: "" },
      };
      const next = {
        upper: { ...current.upper },
        lower: { ...current.lower },
      };
      next[half] = { ...next[half], [field]: value };
      lesson.lesson = next;
      lessons[lIdx] = lesson;
      days[dIdx] = { ...days[dIdx], lessons };
      draft[gIdx] = { ...draft[gIdx], week_schedule: days };
      return draft;
    });
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(groups, null, 2));
      alert("JSON kopyalandı");
    } catch {
      alert("Kopyalama alınmadı");
    }
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(groups, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SDU_muhendislik.edited.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-dvh bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">JSON Redaktor</h1>
          <div className="flex gap-2">
            <button
              onClick={copyJson}
              className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Kopyala
            </button>
            <button
              onClick={downloadJson}
              className="px-3 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-900"
            >
              Yüklə
            </button>
          </div>
        </div>

        <div className="mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Qrup axtar..."
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-gray-500">Heç nə tapılmadı</div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((g, gi) => (
              <li
                key={g.group}
                className="bg-white rounded-xl border border-gray-200 shadow-sm"
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleExpand(g.group)}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200"
                      aria-label="Genişlət/Büz"
                    >
                      {expanded[g.group] ? "−" : "+"}
                    </button>
                    <input
                      value={g.group}
                      onChange={(e) => updateGroupName(gi, e.target.value)}
                      className="px-3 py-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300"
                    />
                  </div>
                </div>

                {expanded[g.group] && (
                  <div className="px-4 pb-4">
                    {(g.week_schedule || []).map((d, di) => (
                      <div
                        key={di}
                        className="mt-3 rounded-lg border border-gray-100 p-3"
                      >
                        <div className="mb-2">
                          <input
                            value={d.day}
                            onChange={(e) =>
                              updateDayName(gi, di, e.target.value)
                            }
                            className="px-3 py-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 w-full sm:w-64"
                          />
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-600">
                                <th className="px-2 py-1">Saat</th>
                                <th className="px-2 py-1">Fənn</th>
                                <th className="px-2 py-1">Müəllim</th>
                                <th className="px-2 py-1">Otaq</th>
                                <th className="px-2 py-1">Ust Fənn</th>
                                <th className="px-2 py-1">Ust Müəllim</th>
                                <th className="px-2 py-1">Ust Otaq</th>
                                <th className="px-2 py-1">Alt Fənn</th>
                                <th className="px-2 py-1">Alt Müəllim</th>
                                <th className="px-2 py-1">Alt Otaq</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(d.lessons || []).map((l, li) => (
                                <tr key={li} className="border-t">
                                  <td className="px-2 py-1">
                                    <input
                                      value={l.time || ""}
                                      onChange={(e) =>
                                        updateLessonField(
                                          gi,
                                          di,
                                          li,
                                          "time",
                                          e.target.value
                                        )
                                      }
                                      className="w-28 px-2 py-1 rounded border border-gray-200"
                                    />
                                  </td>
                                  <td className="px-2 py-1">
                                    <input
                                      value={l.subject || ""}
                                      onChange={(e) =>
                                        updateLessonField(
                                          gi,
                                          di,
                                          li,
                                          "subject",
                                          e.target.value
                                        )
                                      }
                                      className="w-44 px-2 py-1 rounded border border-gray-200"
                                    />
                                  </td>
                                  <td className="px-2 py-1">
                                    <input
                                      value={l.teacher || ""}
                                      onChange={(e) =>
                                        updateLessonField(
                                          gi,
                                          di,
                                          li,
                                          "teacher",
                                          e.target.value
                                        )
                                      }
                                      className="w-44 px-2 py-1 rounded border border-gray-200"
                                    />
                                  </td>
                                  <td className="px-2 py-1">
                                    <input
                                      value={l.room || ""}
                                      onChange={(e) =>
                                        updateLessonField(
                                          gi,
                                          di,
                                          li,
                                          "room",
                                          e.target.value
                                        )
                                      }
                                      className="w-28 px-2 py-1 rounded border border-gray-200"
                                    />
                                  </td>
                                  <td className="px-2 py-1">
                                    <input
                                      value={l.lesson?.upper.subject || ""}
                                      onChange={(e) =>
                                        updateNested(
                                          gi,
                                          di,
                                          li,
                                          "upper",
                                          "subject",
                                          e.target.value
                                        )
                                      }
                                      className="w-44 px-2 py-1 rounded border border-gray-200"
                                    />
                                  </td>
                                  <td className="px-2 py-1">
                                    <input
                                      value={l.lesson?.upper.teacher || ""}
                                      onChange={(e) =>
                                        updateNested(
                                          gi,
                                          di,
                                          li,
                                          "upper",
                                          "teacher",
                                          e.target.value
                                        )
                                      }
                                      className="w-44 px-2 py-1 rounded border border-gray-200"
                                    />
                                  </td>
                                  <td className="px-2 py-1">
                                    <input
                                      value={l.lesson?.upper.room || ""}
                                      onChange={(e) =>
                                        updateNested(
                                          gi,
                                          di,
                                          li,
                                          "upper",
                                          "room",
                                          e.target.value
                                        )
                                      }
                                      className="w-28 px-2 py-1 rounded border border-gray-200"
                                    />
                                  </td>
                                  <td className="px-2 py-1">
                                    <input
                                      value={l.lesson?.lower.subject || ""}
                                      onChange={(e) =>
                                        updateNested(
                                          gi,
                                          di,
                                          li,
                                          "lower",
                                          "subject",
                                          e.target.value
                                        )
                                      }
                                      className="w-44 px-2 py-1 rounded border border-gray-200"
                                    />
                                  </td>
                                  <td className="px-2 py-1">
                                    <input
                                      value={l.lesson?.lower.teacher || ""}
                                      onChange={(e) =>
                                        updateNested(
                                          gi,
                                          di,
                                          li,
                                          "lower",
                                          "teacher",
                                          e.target.value
                                        )
                                      }
                                      className="w-44 px-2 py-1 rounded border border-gray-200"
                                    />
                                  </td>
                                  <td className="px-2 py-1">
                                    <input
                                      value={l.lesson?.lower.room || ""}
                                      onChange={(e) =>
                                        updateNested(
                                          gi,
                                          di,
                                          li,
                                          "lower",
                                          "room",
                                          e.target.value
                                        )
                                      }
                                      className="w-28 px-2 py-1 rounded border border-gray-200"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
