"use client";

import { useState, useEffect } from "react";
import { groupService, Group } from "@/services/groupService";

export default function MongoDBExample() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await groupService.getAllGroups();

      if (response.success && response.data) {
        setGroups(response.data);
      } else {
        setError(response.error || "Failed to load groups");
      }
    } catch (err) {
      setError("An error occurred while loading groups");
      console.error("Error loading groups:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={loadGroups}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">SDU Groups from MongoDB</h2>

      <div className="grid gap-4">
        {groups.map((group) => (
          <div
            key={group.group_id}
            className="border border-gray-200 rounded-lg p-4"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold">Group {group.group_id}</h3>
              {group.faculty && (
                <span className="text-sm text-gray-500">{group.faculty}</span>
              )}
            </div>

            <div className="mb-3">
              <h4 className="font-medium text-gray-700 mb-1">Academic Load:</h4>
              <div className="text-sm text-gray-600">
                {group.academic_load.length} subjects,{" "}
                {group.academic_load.reduce(
                  (total, subject) => total + subject.total_hours,
                  0
                )}{" "}
                total hours
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-1">
                Weekly Schedule:
              </h4>
              <div className="text-sm text-gray-600">
                {group.week_schedule.map((day) => (
                  <div key={day.day} className="flex justify-between">
                    <span>{day.day}:</span>
                    <span>{day.lessons.length} lessons</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="text-center py-8 text-gray-500">No groups found</div>
      )}
    </div>
  );
}
