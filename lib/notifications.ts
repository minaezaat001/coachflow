import { prisma } from "@/lib/db"

export async function createNotification(params: {
  coachId: string
  clientId?: number
  clientName?: string
  type: string
  title: string
  message?: string
  targetUrl?: string
}) {
  return prisma.notification.create({
    data: {
      coachId: params.coachId,
      clientId: params.clientId || null,
      title: params.title,
      message: params.message || null,
      type: params.type,
      targetUrl: params.targetUrl || "",
    },
  })
}

export function clientLink(clientId: number) {
  return `/clients/${clientId}`
}

export function clientTabUrl(clientId: number, tab: string) {
  return `/clients/${clientId}?tab=${tab}`
}
