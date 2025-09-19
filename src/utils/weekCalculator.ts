import { differenceInCalendarWeeks, startOfWeek } from "date-fns";

export type University = {
  id: number;
  name: string;
  startWeekType: "ust" | "alt";
  startDate: string; // YYYY-MM-DD, Monday of first academic week
  img?: string; // Optional logo URL
  shortName?: string; // Optional abbreviation
};

export function calculateCurrentWeekType(
  university: University
): "ÜST HƏFTƏDİR" | "ALT HƏFTƏDİR" {
  const startMonday = startOfWeek(new Date(university.startDate), {
    weekStartsOn: 1,
  });
  const todayMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weeksElapsed = differenceInCalendarWeeks(todayMonday, startMonday, {
    weekStartsOn: 1,
  });
  const isEven = Math.abs(weeksElapsed) % 2 === 0;

  const baseIsUst = university.startWeekType === "ust";
  const currentIsUst = isEven ? baseIsUst : !baseIsUst;
  return currentIsUst ? "ÜST HƏFTƏDİR" : "ALT HƏFTƏDİR";
}
