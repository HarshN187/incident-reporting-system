// import { useState, useEffect, useCallback } from "react";
// import incidentService from "../services/incident.service";
// import type { Incident, PaginatedResponse } from "../types";

// interface UseIncidentsOptions {
//   status?: string;
//   category?: string;
//   priority?: string;
//   search?: string;
//   page?: number;
//   limit?: number;
//   autoFetch?: boolean;
// }

// interface UseIncidentsResult {
//   incidents: Incident[];
//   loading: boolean;
//   error: string | null;
//   pagination: PaginatedResponse<Incident>["pagination"] | null;
//   fetchIncidents: () => Promise<void>;
//   refetch: () => Promise<void>;
// }

// export const useIncidents = (
//   options: UseIncidentsOptions = {},
// ): UseIncidentsResult => {
//   const {
//     status,
//     category,
//     priority,
//     search,
//     page = 1,
//     limit = 10,
//     autoFetch = true,
//   } = options;

//   const [incidents, setIncidents] = useState<Incident[]>([]);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const [pagination, setPagination] = useState<
//     PaginatedResponse<Incident>["pagination"] | null
//   >(null);

//   const fetchIncidents = useCallback(async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const response = await incidentService.getIncidents({
//         status,
//         category,
//         priority,
//         search,
//         page,
//         limit,
//       });

//       if (response.success && response.data) {
//         setIncidents(response.data.data);
//         setPagination(response.data.pagination);
//       }
//     } catch (err: any) {
//       setError(err.response?.data?.message || "Failed to fetch incidents");
//     } finally {
//       setLoading(false);
//     }
//   }, [status, category, priority, search, page, limit]);

//   useEffect(() => {
//     if (autoFetch) {
//       fetchIncidents();
//     }
//   }, [fetchIncidents, autoFetch]);

//   return {
//     incidents,
//     loading,
//     error,
//     pagination,
//     fetchIncidents,
//     refetch: fetchIncidents,
//   };
// };
