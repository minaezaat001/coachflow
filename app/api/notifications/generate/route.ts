import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createNotification, clientTabUrl } from "@/lib/notifications";

export async function POST() {
  try {
    const user = await requireAuth();
    const now = new Date();
    const todayISO = now.toISOString().split("T")[0];
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const clients = await prisma.client.findMany({
      where: { coachId: user.id },
      select: {
        id: true, name: true,
        subscriptionEndDate: true, paymentStatus: true,
        nextCheckInDate: true,
      },
    });

    const existing = await prisma.notification.findMany({
      where: { coachId: user.id },
      select: { id: true, title: true, clientId: true, type: true },
    });
    const existingKeys = new Set(existing.map((n) => `${n.clientId}:${n.title}`));

    // Get all payments to detect partial payments older than 7 days
    const allPayments = await prisma.payment.findMany({
      where: { client: { coachId: user.id } },
      orderBy: { createdAt: "desc" },
      select: { clientId: true, amount: true, status: true, createdAt: true },
    });
    const latestPaymentByClient = new Map<number, { amount: number; status: string; createdAt: Date }>();
    for (const p of allPayments) {
      if (!latestPaymentByClient.has(p.clientId)) {
        latestPaymentByClient.set(p.clientId, { amount: p.amount, status: p.status, createdAt: p.createdAt });
      }
    }

    let created = 0;

    for (const client of clients) {
      // 1. Subscription expiring within 7 days
      if (client.subscriptionEndDate && client.subscriptionEndDate <= sevenDaysLater && client.subscriptionEndDate >= todayISO) {
        const key = `${client.id}:اشتراك ${client.name} ينتهي قريباً`;
        if (!existingKeys.has(key)) {
          await createNotification({
            coachId: user.id,
            clientId: client.id,
            clientName: client.name,
            type: "subscription",
            title: `اشتراك ${client.name} ينتهي قريباً`,
            message: `ينتهي الاشتراك في ${client.subscriptionEndDate}`,
            targetUrl: clientTabUrl(client.id, "subscriptions"),
          });
          created++;
        }
      }

      // 2. Subscription expired
      if (client.subscriptionEndDate && client.subscriptionEndDate < todayISO) {
        const key = `${client.id}:اشتراك ${client.name} منتهي`;
        if (!existingKeys.has(key)) {
          await createNotification({
            coachId: user.id,
            clientId: client.id,
            clientName: client.name,
            type: "subscription",
            title: `اشتراك ${client.name} منتهي`,
            message: `انتهى الاشتراك في ${client.subscriptionEndDate}`,
            targetUrl: clientTabUrl(client.id, "subscriptions"),
          });
          created++;
        }
      }

      // 3. Overdue payment — partial payment 7+ days old
      const latestPay = latestPaymentByClient.get(client.id);
      if (latestPay && (latestPay.status === "partial" || latestPay.status === "unpaid")) {
        const daysSincePayment = Math.floor((now.getTime() - new Date(latestPay.createdAt).getTime()) / (24 * 60 * 60 * 1000));
        if (daysSincePayment >= 7) {
          const key = `${client.id}:دفعات مستحقة لـ ${client.name}`;
          if (!existingKeys.has(key)) {
            await createNotification({
              coachId: user.id,
              clientId: client.id,
              clientName: client.name,
              type: "payment",
              title: `دفعات مستحقة لـ ${client.name}`,
              message: `آخر دفعة منذ ${daysSincePayment} يوم — ${latestPay.status === "partial" ? "مدفوع جزئياً" : "غير مدفوع"}`,
              targetUrl: clientTabUrl(client.id, "payments"),
            });
            created++;
          }
        }
      }

      // 4. Delayed check-in — strict nextCheckInDate logic
      // Only notify if: Current Date > nextCheckInDate + 1 Day
      // i.e., the scheduled check-in date has passed AND a full extra day has elapsed
      if (client.nextCheckInDate) {
        const checkInDate = new Date(client.nextCheckInDate + "T00:00:00");
        const dayAfterCheckIn = new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000);
        const dayAfterCheckInStr = dayAfterCheckIn.toISOString().split("T")[0];

        if (todayISO > dayAfterCheckInStr) {
          // Overdue — create notification if not already exists
          const title = `تأخر ${client.name} عن موعد متابعته المجدولة`;
          const key = `${client.id}:${title}`;
          if (!existingKeys.has(key)) {
            await createNotification({
              coachId: user.id,
              clientId: client.id,
              clientName: client.name,
              type: "checkin",
              title,
              message: `كان من المفترض أن يرسل متابعته في ${client.nextCheckInDate}`,
              targetUrl: `/clients/${client.id}`,
            });
            created++;
          }
        } else {
          // Not overdue — delete any stale check-in notification for this client
          await prisma.notification.deleteMany({
            where: {
              coachId: user.id,
              clientId: client.id,
              type: "checkin",
            },
          });
        }
      } else {
        // No nextCheckInDate set — delete any stale check-in notification
        await prisma.notification.deleteMany({
          where: {
            coachId: user.id,
            clientId: client.id,
            type: "checkin",
          },
        });
      }
    }

    return NextResponse.json({ created, cleaned: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate notifications" }, { status: 500 });
  }
}
