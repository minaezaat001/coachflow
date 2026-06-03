import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { calculateClientStatus } from "@/lib/utils";

export interface Client {
  id: number;
  name: string;
  phone: string;
  goal: string;
  weight?: number | null;
  height?: number | null;
  tags?: string[];
  notes?: string | null;
  dietPlanUrl?: string | null;
  workoutPlanUrl?: string | null;
  subscriptionType?: string | null;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  subscriptionStatus: string;
  paymentStatus: string;
  commitmentScore?: number | null;
  uniqueToken?: string | null;
  onboarded: boolean;
  createdAt: string;
  updatedAt: string;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "API request failed");
  }
  return res.json();
}

export const useListClients = (filters?: { search?: string; status?: string; goal?: string }) => {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.status && filters.status !== "all") params.set("status", filters.status);
  if (filters?.goal && filters.goal !== "all") params.set("goal", filters.goal);
  const qs = params.toString();

  return useQuery<Client[]>({
    queryKey: ["clients", filters],
    queryFn: async () => {
      const data = await apiFetch<{ clients: Client[] }>(`/api/clients${qs ? `?${qs}` : ""}`);
      return (data.clients || []).map((c) => ({ ...c, subscriptionStatus: calculateClientStatus(c) }));
    },
  });
};

export const useGetClient = (id: string) => {
  return useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const data = await apiFetch<{ client: Client }>(`/api/clients/${id}`);
      return { ...data.client, subscriptionStatus: calculateClientStatus(data.client) };
    },
    enabled: !!id,
  });
};

export const useCreateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiFetch<{ client: Client }>("/api/clients", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.client;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};

export const useUpdateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiFetch(`/api/clients/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["client", variables.id] });
    },
  });
};

export const useDeleteClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      return apiFetch(`/api/clients/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};
