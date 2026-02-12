import api from "./api";
import type {
  Incident,
  IncidentCreate,
  ApiResponse,
  PaginatedResponse,
} from "../types";

interface IncidentFilters {
  status?: string;
  category?: string;
  priority?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
}

class IncidentService {
  async getIncidents(
    filters: IncidentFilters = {},
  ): Promise<ApiResponse<PaginatedResponse<Incident>>> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    return api.get<ApiResponse<PaginatedResponse<Incident>>>(
      `/incidents?${params.toString()}`,
    );
  }

  async getIncident(id: string): Promise<ApiResponse<Incident>> {
    return api.get<ApiResponse<Incident>>(`/incidents/${id}`);
  }

  async createIncident(data: IncidentCreate): Promise<ApiResponse<Incident>> {
    return api.post<ApiResponse<Incident>>("/incidents", data);
  }

  async updateIncident(
    id: string,
    data: Partial<IncidentCreate>,
  ): Promise<ApiResponse<Incident>> {
    return api.patch<ApiResponse<Incident>>(`/incidents/${id}`, data);
  }

  async updateIncidentStatus(
    id: string,
    status: string,
    resolutionNotes?: string,
  ): Promise<ApiResponse<Incident>> {
    return api.patch<ApiResponse<Incident>>(`/incidents/${id}/status`, {
      status,
      resolutionNotes,
    });
  }

  async assignIncident(
    id: string,
    assignedTo: string,
  ): Promise<ApiResponse<Incident>> {
    return api.patch<ApiResponse<Incident>>(`/incidents/${id}/assign`, {
      assignedTo,
    });
  }

  async bulkUpdateIncidents(
    incidentIds: string[],
    status?: string,
    assignedTo?: string,
  ): Promise<ApiResponse<{ modifiedCount: number }>> {
    return api.patch<ApiResponse<{ modifiedCount: number }>>(
      "/incidents/bulk-update",
      {
        incidentIds,
        status,
        assignedTo,
      },
    );
  }

  async deleteIncident(id: string): Promise<ApiResponse> {
    return api.delete<ApiResponse>(`/incidents/${id}`);
  }

  async exportIncidents(
    format: "csv" | "pdf",
    filters: IncidentFilters = {},
  ): Promise<Blob> {
    const response = await api.post(
      "/incidents/export",
      { format, filters },
      { responseType: "blob" },
    );
    return response as unknown as Blob;
  }
}

export default new IncidentService();
