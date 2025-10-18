# "Be Your Group's Hero" Feature Implementation

## Overview

This feature allows users to create schedules for their groups when no existing schedule is found. When a user searches for a group and no results are found, they are presented with an interactive Call-To-Action (CTA) that invites them to create the schedule for their group.

## Implementation Details

### 1. Group Selection Component Enhancement

**File:** `src/app/page.tsx`

- **Detection Logic:** The feature activates when:

  - The search input field is not empty (`groupQuery.trim()` is truthy)
  - The list of filtered groups is empty (`filteredGroups.length === 0`)
  - Groups are not currently loading (`!isLoadingGroups`)

- **CTA UI:** When the "No Results" condition is met, the component shows:
  - A clear, encouraging heading: "Qrupunu tapa bilmədin?"
  - Empowering text: "İlk sən yarat, bütün qrup yoldaşların faydalansın."
  - A prominent action button: "[+] Qrupunun Qəhrəmanı Ol və Cədvəli Yarat"

### 2. Schedule Creation Wizard

**File:** `src/components/ScheduleCreationWizard.tsx`

A multi-step wizard with 3 steps:

#### Step 1: Academic Load

- Users can add subjects with their total hours
- Common subjects are suggested via datalist
- Subjects can be added, edited, and removed

#### Step 2: Weekly Schedule

- Users can organize lessons for each day of the week
- Time slots are predefined (08:30-09:50, 10:05-11:25, etc.)
- Each lesson includes: time, subject, teacher, and room
- Lessons can be added, edited, and removed for each day

#### Step 3: Review and Confirmation

- Shows a summary of all entered data
- Displays group information, academic load, and weekly schedule
- Final confirmation to create the schedule

### 3. Data Management

**File:** `src/utils/scheduleManager.ts`

Comprehensive localStorage management system:

#### Wizard Data Management

- `saveWizardData()` - Saves temporary data during wizard process
- `loadWizardData()` - Loads saved wizard data
- `clearWizardData()` - Clears temporary wizard data

#### Schedule Management

- `saveSchedule()` - Saves completed schedule
- `loadSchedule()` - Loads a specific schedule by group name
- `loadAllSchedules()` - Loads all created schedules
- `deleteSchedule()` - Deletes a schedule
- `scheduleExists()` - Checks if a schedule exists
- `getCreatedGroupNames()` - Gets list of all created group names

#### Import/Export

- `exportSchedules()` - Exports all schedules as JSON
- `importSchedules()` - Imports schedules from JSON
- `clearAllSchedules()` - Clears all schedules

### 4. Data Structure

The schedule data follows the same structure as the existing `sdu.json` format:

```typescript
interface ScheduleData {
  group_id: string;
  faculty: string;
  academic_load: AcademicLoad[];
  week_schedule: Day[];
}

interface AcademicLoad {
  subject: string;
  total_hours: number;
}

interface Day {
  day: string;
  lessons: Lesson[];
}

interface Lesson {
  time: string;
  subject: string;
  teacher: string;
  room: string;
}
```

## User Flow

1. **Search for Group:** User types in the group search field
2. **No Results Found:** System detects no matching groups
3. **CTA Display:** "Be Your Group's Hero" CTA appears
4. **Wizard Launch:** User clicks the CTA button
5. **Step-by-Step Creation:** User goes through 3-step wizard
6. **Data Persistence:** Schedule is saved to localStorage
7. **Success:** User receives confirmation and can use the new schedule

## Technical Features

- **Progressive Saving:** Data is saved step-by-step during wizard process
- **Error Handling:** Graceful handling of localStorage errors
- **Responsive Design:** Works on mobile and desktop
- **Accessibility:** Proper keyboard navigation and focus management
- **Type Safety:** Full TypeScript support with proper interfaces
- **Testing:** Comprehensive test coverage for utility functions

## Storage Strategy

- **Temporary Storage:** Wizard data is stored temporarily during the creation process
- **Permanent Storage:** Completed schedules are stored permanently
- **Data Isolation:** Each group's schedule is stored separately
- **Backup/Export:** Users can export and import their created schedules

## Future Enhancements

- Integration with existing group data
- Sharing schedules with other users
- Schedule validation and conflict detection
- Advanced scheduling features (recurring lessons, etc.)
- Cloud synchronization
