import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"

export default async function PricingPage() {
  const coach = await prisma.user.findFirst({
    where: { role: { in: ["super_admin", "coach"] } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  })

  if (coach) {
    redirect(`/pricing/${coach.id}`)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
      <p className="text-lg font-black text-muted-foreground">لا يوجد مدربين متاحين</p>
    </div>
  )
}
