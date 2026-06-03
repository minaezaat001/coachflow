import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateClientStatus(client: {
  subscriptionEndDate?: string | null;
  subscriptionStatus?: string | null;
}) {
  if (!client.subscriptionEndDate) return client.subscriptionStatus || "pending";

  const now = new Date();
  const endDate = new Date(client.subscriptionEndDate);
  endDate.setHours(23, 59, 59, 999);

  if (endDate < now) return "expired";
  return client.subscriptionStatus || "active";
}

export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export function parseTags(tags: string | string[]): string[] {
  if (Array.isArray(tags)) return tags;
  return safeJsonParse<string[]>(tags, []);
}

export function tagsToString(tags: string[]): string {
  return JSON.stringify(tags);
}
