import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

export interface ExerciseLog {
  id: number;
  exerciseName: string;
  date: string;
  loggedAt: string;
  sets?: number | null;
  reps?: number | null;
  weight?: number | null;
  notes?: string | null;
}

// Subscriptions
export const useListSubscriptions = (clientId: string) => {
  return useQuery({
    queryKey: ["subscriptions", clientId],
    queryFn: () => apiFetch(`/api/subscriptions?clientId=${clientId}`),
    enabled: !!clientId,
  });
};

export const useCreateSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, data }: { clientId: string; data: any }) => {
      return apiFetch("/api/subscriptions", {
        method: "POST",
        body: JSON.stringify({ ...data, clientId: parseInt(clientId) }),
      });
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["subscriptions", variables.clientId] });
      qc.invalidateQueries({ queryKey: ["client", variables.clientId] });
    },
  });
};

export const useUpdateSubscription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, subId, data }: { clientId: string; subId: string; data: any }) => {
      return apiFetch(`/api/subscriptions/${subId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["subscriptions", variables.clientId] });
      qc.invalidateQueries({ queryKey: ["client", variables.clientId] });
    },
  });
};

// Payments
export const useListPayments = (clientId: string) => {
  return useQuery({
    queryKey: ["payments", clientId],
    queryFn: () => apiFetch(`/api/payments?clientId=${clientId}`),
    enabled: !!clientId,
  });
};

export const useCreatePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, data }: { clientId: string; data: any }) => {
      return apiFetch("/api/payments", {
        method: "POST",
        body: JSON.stringify({ ...data, clientId: parseInt(clientId) }),
      });
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["payments", variables.clientId] });
      qc.invalidateQueries({ queryKey: ["allPayments"] });
      qc.invalidateQueries({ queryKey: ["financialSummary"] });
    },
  });
};

export const useUpdatePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, payId, data }: { clientId: string; payId: string; data: any }) => {
      return apiFetch(`/api/payments/${payId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["payments", variables.clientId] });
      qc.invalidateQueries({ queryKey: ["allPayments"] });
      qc.invalidateQueries({ queryKey: ["financialSummary"] });
    },
  });
};

// Progress
export const useListProgress = (clientId: string) => {
  return useQuery({
    queryKey: ["progress", clientId],
    queryFn: () => apiFetch(`/api/progress?clientId=${clientId}`),
    enabled: !!clientId,
  });
};

export const useCreateProgress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, data }: { clientId: string; data: any }) => {
      return apiFetch("/api/progress", {
        method: "POST",
        body: JSON.stringify({ ...data, clientId: parseInt(clientId) }),
      });
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["progress", variables.clientId] });
    },
  });
};

// Exercises (Workout Logs)
export const useListExercises = (clientId: string) => {
  return useQuery({
    queryKey: ["exercises", clientId],
    queryFn: () => apiFetch<ExerciseLog[]>(`/api/workout-logs?clientId=${clientId}`),
    enabled: !!clientId,
  });
};

export const useCreateExercise = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, data }: { clientId: string; data: any }) => {
      return apiFetch("/api/workout-logs", {
        method: "POST",
        body: JSON.stringify({ ...data, clientId: parseInt(clientId) }),
      });
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["exercises", variables.clientId] });
    },
  });
};

// Followups
export const useListFollowups = (clientId: string) => {
  return useQuery({
    queryKey: ["followups", clientId],
    queryFn: () => apiFetch(`/api/followups?clientId=${clientId}`),
    enabled: !!clientId,
  });
};

export const useCreateFollowup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, data }: { clientId: string; data: any }) => {
      return apiFetch("/api/followups", {
        method: "POST",
        body: JSON.stringify({ ...data, clientId: parseInt(clientId) }),
      });
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["followups", variables.clientId] });
    },
  });
};

// Onboarding
export const useListOnboarding = (clientId: string) => {
  return useQuery({
    queryKey: ["onboarding", clientId],
    queryFn: () => apiFetch(`/api/onboarding?clientId=${clientId}`),
    enabled: !!clientId,
  });
};

// Legacy alias
export const useUpdateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, data }: { clientId: string; data: any }) => {
      return apiFetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["client", variables.clientId] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};
