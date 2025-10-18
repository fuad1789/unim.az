export interface Group {
  _id?: string;
  group_id: string;
  faculty: string;
  academic_load: {
    subject: string;
    total_hours: number;
  }[];
  week_schedule: {
    day: string;
    lessons: {
      time: string;
      subject: string;
      teacher: string;
      room: string;
      upper?: {
        subject: string;
        teacher: string;
        room: string;
      };
      lower?: {
        subject: string;
        teacher: string;
        room: string;
      };
    }[];
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class GroupService {
  private baseUrl = "/api/groups";

  async getAllGroups(faculty?: string): Promise<ApiResponse<Group[]>> {
    try {
      const url = faculty
        ? `${this.baseUrl}?faculty=${encodeURIComponent(faculty)}`
        : this.baseUrl;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error("Error fetching groups:", error);
      return { success: false, error: "Failed to fetch groups" };
    }
  }

  async getGroupById(groupId: string): Promise<ApiResponse<Group>> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching group:", error);
      return { success: false, error: "Failed to fetch group" };
    }
  }

  async createGroup(group: Omit<Group, "_id">): Promise<ApiResponse<Group>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(group),
      });
      return await response.json();
    } catch (error) {
      console.error("Error creating group:", error);
      return { success: false, error: "Failed to create group" };
    }
  }

  async updateGroup(
    groupId: string,
    group: Partial<Group>
  ): Promise<ApiResponse<Group>> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(group),
      });
      return await response.json();
    } catch (error) {
      console.error("Error updating group:", error);
      return { success: false, error: "Failed to update group" };
    }
  }

  async deleteGroup(groupId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/${groupId}`, {
        method: "DELETE",
      });
      return await response.json();
    } catch (error) {
      console.error("Error deleting group:", error);
      return { success: false, error: "Failed to delete group" };
    }
  }

  // Helper method to get unique faculties
  async getFaculties(): Promise<ApiResponse<string[]>> {
    try {
      const response = await this.getAllGroups();
      if (response.success && response.data) {
        const faculties = [
          ...new Set(response.data.map((group) => group.faculty)),
        ];
        return { success: true, data: faculties };
      }
      return { success: false, error: "Failed to fetch faculties" };
    } catch (error) {
      console.error("Error fetching faculties:", error);
      return { success: false, error: "Failed to fetch faculties" };
    }
  }
}

export const groupService = new GroupService();
