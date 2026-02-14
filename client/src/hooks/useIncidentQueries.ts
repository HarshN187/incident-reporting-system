import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import incidentService from "../services/incident.service";
import type { IncidentCreate } from "../types";
import { toast } from "react-toastify";

export const incidentKeys = {
  all: ["incidents"] as const,
  lists: () => [...incidentKeys.all, "list"] as const,
  list: (filters: Record<string, any>) =>
    [...incidentKeys.lists(), filters] as const,
  details: () => [...incidentKeys.all, "detail"] as const,
  detail: (id: string) => [...incidentKeys.details(), id] as const,
  myIncidents: () => [...incidentKeys.all, "my-incidents"] as const,
};

export const useIncidents = (filters: Record<string, any> = {}) => {
  return useQuery({
    queryKey: incidentKeys.list(filters),
    queryFn: async () => {
      const response = await incidentService.getIncidents(filters);
      return response.data;
    },
  });
};

export const useIncident = (id: string) => {
  return useQuery({
    queryKey: incidentKeys.detail(id),
    queryFn: async () => {
      const response = await incidentService.getIncident(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IncidentCreate) => incidentService.createIncident(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      toast.success("Incident created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create incident");
    },
  });
};

export const useUpdateIncidentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      resolutionNotes,
    }: {
      id: string;
      status: string;
      resolutionNotes?: string;
    }) => incidentService.updateIncidentStatus(id, status, resolutionNotes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: incidentKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      toast.success("Status updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    },
  });
};

export const useBulkUpdateIncidents = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      incidentIds,
      status,
      assignedTo,
    }: {
      incidentIds: string[];
      status?: string;
      assignedTo?: string;
    }) => incidentService.bulkUpdateIncidents(incidentIds, status, assignedTo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      toast.success("Incidents updated successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update incidents",
      );
    },
  });
};

export const useExportIncidents = () => {
  return useMutation({
    mutationFn: async ({
      format,
      filters,
    }: {
      format: "csv" | "pdf";
      filters?: Record<string, any>;
    }) => {
      const blob = await incidentService.exportIncidents(format, filters);
      return blob;
    },
    onSuccess: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const isPdf = blob.type.includes("pdf");
      const ext = isPdf ? "pdf" : "csv";
      const filename = `incidents-export-${Date.now()}.${ext}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export started");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Export failed");
    },
  });
};

export const useAssignIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, assignedTo }: { id: string; assignedTo: string }) =>
      incidentService.assignIncident(id, assignedTo),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: incidentKeys.detail(variables.id),
      });
      toast.success("Incident assigned successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to assign incident");
    },
  });
};
