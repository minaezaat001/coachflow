"use client"

import * as React from "react"
import { useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Flame,
  AlertTriangle,
} from "lucide-react"
import type { ExerciseLog } from "@/hooks/useClientData"

type GroupedExercise = {
  name: string
  logs: ExerciseLog[]
  trend: "up" | "down" | "stable" | "new"
  deltaPct: number | null
  suggestion: { type: "increase" | "modify" | "great" | null; text: string } | null
  maxWeight: number | null
  lastWeight: number | null
  prevWeight: number | null
}

function groupByExercise(logs: ExerciseLog[]): GroupedExercise[] {
  const map = new Map<string, ExerciseLog[]>()
  for (const log of logs) {
    if (!map.has(log.exerciseName)) map.set(log.exerciseName, [])
    map.get(log.exerciseName)!.push(log)
  }

  const result: GroupedExercise[] = []

  for (const [name, group] of map.entries()) {
    const sorted = [...group].sort(
      (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()
    )

    const weightLogs = sorted.map(l => {
      if (l.weight != null) return { ...l, maxSetWeight: l.weight }
      if (Array.isArray(l.sets) && l.sets.length > 0) {
        const setWeights = l.sets.map((s: any) => parseFloat(s.weight) || 0)
        return { ...l, maxSetWeight: Math.max(...setWeights) }
      }
      return null
    }).filter(l => l != null) as (ExerciseLog & { maxSetWeight: number })[]
    const maxWeight = weightLogs.length > 0 ? Math.max(...weightLogs.map((l) => l.maxSetWeight)) : null
    const lastWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].maxSetWeight : null
    const prevWeight = weightLogs.length > 1 ? weightLogs[weightLogs.length - 2].maxSetWeight : null

    let trend: GroupedExercise["trend"] = "new"
    let deltaPct: number | null = null

    if (lastWeight != null && prevWeight != null && prevWeight > 0) {
      deltaPct = ((lastWeight - prevWeight) / prevWeight) * 100
      if (Math.abs(deltaPct) < 1) trend = "stable"
      else if (deltaPct > 0) trend = "up"
      else trend = "down"
    }

    let suggestion: GroupedExercise["suggestion"] = null

    if (weightLogs.length >= 3) {
      const last3 = weightLogs.slice(-3)
      const allSame =
        last3[0].maxSetWeight === last3[1].maxSetWeight && last3[1].maxSetWeight === last3[2].maxSetWeight
      const decreasing =
        last3[0].maxSetWeight >= last3[1].maxSetWeight && last3[1].maxSetWeight >= last3[2].maxSetWeight

      if (allSame || decreasing) {
        suggestion = {
          type: "modify",
          text: "الأداء ثابت لـ 3 جلسات متتالية — يُقترح تعديل البرنامج أو تغيير التمرين",
        }
      } else if (deltaPct != null && deltaPct >= 10) {
        suggestion = {
          type: "increase",
          text: `تحسن ممتاز ${deltaPct.toFixed(0)}%! يُقترح زيادة الوزن في الجلسة القادمة`,
        }
      } else if (deltaPct != null && deltaPct > 0) {
        suggestion = {
          type: "great",
          text: `تحسن مستمر — استمر على نفس المنهج`,
        }
      }
    } else if (deltaPct != null && deltaPct >= 10) {
      suggestion = {
        type: "increase",
        text: `تحسن ${deltaPct.toFixed(0)}%! يُقترح زيادة الوزن قريباً`,
      }
    }

    result.push({
      name,
      logs: sorted.reverse(),
      trend,
      deltaPct,
      suggestion,
      maxWeight,
      lastWeight,
      prevWeight,
    })
  }

  return result.sort((a, b) => {
    const aDate = new Date(a.logs[0]?.date ?? 0).getTime()
    const bDate = new Date(b.logs[0]?.date ?? 0).getTime()
    return bDate - aDate
  })
}

function TrendIcon({ trend, pct }: { trend: GroupedExercise["trend"]; pct: number | null }) {
  if (trend === "new") return <Badge variant="outline" className="text-xs">جديد</Badge>
  if (trend === "up") return (
    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
      <TrendingUp className="w-4 h-4" />
      {pct != null ? `+${pct.toFixed(1)}%` : "↑"}
    </span>
  )
  if (trend === "down") return (
    <span className="flex items-center gap-1 text-red-500 text-sm font-medium">
      <TrendingDown className="w-4 h-4" />
      {pct != null ? `${pct.toFixed(1)}%` : "↓"}
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-gray-400 text-sm">
      <Minus className="w-4 h-4" />
      ثابت
    </span>
  )
}

function SuggestionBadge({ suggestion }: { suggestion: GroupedExercise["suggestion"] }) {
  if (!suggestion) return null
  const styles: Record<string, string> = {
    increase: "bg-blue-50 text-blue-800 border-blue-200",
    modify: "bg-orange-50 text-orange-800 border-orange-200",
    great: "bg-green-50 text-green-800 border-green-200",
  }
  const icons: Record<string, React.ReactNode> = {
    increase: <Flame className="w-3.5 h-3.5 shrink-0" />,
    modify: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />,
    great: <Lightbulb className="w-3.5 h-3.5 shrink-0" />,
  }
  const style = styles[suggestion.type!] ?? styles.great
  const icon = icons[suggestion.type!] ?? icons.great

  return (
    <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border font-medium ${style}`}>
      {icon}
      {suggestion.text}
    </div>
  )
}

const ExerciseCard: React.FC<{ group: GroupedExercise }> = ({ group }) => {
  const [open, setOpen] = useState(false)
  const [showChart, setShowChart] = useState(false)

  const chartData = [...group.logs]
    .map(l => {
      if (l.weight != null) return { date: l.date, weight: l.weight, label: l.date.slice(5) }
      if (Array.isArray(l.sets) && l.sets.length > 0) {
        return { date: l.date, weight: Math.max(...l.sets.map((s: any) => parseFloat(s.weight) || 0)), label: l.date.slice(5) }
      }
      return null
    })
    .filter(l => l != null)
    .reverse()

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <CardTitle className="text-base">{group.name}</CardTitle>
              <TrendIcon trend={group.trend} pct={group.deltaPct} />
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {group.lastWeight != null && (
                <span>
                  آخر وزن: <strong className="text-foreground">{group.lastWeight} كجم</strong>
                </span>
              )}
              {group.prevWeight != null && group.lastWeight != null && (
                <span>
                  السابق: {group.prevWeight} كجم
                  {group.lastWeight > group.prevWeight && (
                    <span className="text-green-600 mr-1">
                      (+{(group.lastWeight - group.prevWeight).toFixed(1)} كجم)
                    </span>
                  )}
                  {group.lastWeight < group.prevWeight && (
                    <span className="text-red-500 mr-1">
                      ({(group.lastWeight - group.prevWeight).toFixed(1)} كجم)
                    </span>
                  )}
                </span>
              )}
              {group.maxWeight != null && (
                <span>أعلى وزن: <strong className="text-foreground">{group.maxWeight} كجم</strong></span>
              )}
              <span className="text-muted-foreground">{group.logs.length} جلسة</span>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            {chartData.length >= 2 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => setShowChart(!showChart)}
              >
                📈 رسم
              </Button>
            )}
            <Collapsible open={open} onOpenChange={setOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
        {group.suggestion && <SuggestionBadge suggestion={group.suggestion} />}
      </CardHeader>

      {showChart && chartData.length >= 2 && (
        <div className="px-4 pb-3">
          <div className="text-xs text-muted-foreground mb-2">تطور الوزن (كجم)</div>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} width={35} />
              <Tooltip
                formatter={(v) => [`${v} كجم`, "الوزن"]}
                labelFormatter={(l) => `التاريخ: ${l}`}
              />
              {group.maxWeight != null && (
                <ReferenceLine y={group.maxWeight} stroke="#10b981" strokeDasharray="4 2" label={{ value: "أعلى", position: "right", fontSize: 10, fill: "#10b981" }} />
              )}
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 4, fill: "#2563eb" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleContent>
          <div className="border-t border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-xs">
                  <th className="py-2 px-4 text-right font-medium">التاريخ</th>
                  <th className="py-2 px-3 text-center font-medium">المجموعات</th>
                  <th className="py-2 px-4 text-right font-medium">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {group.logs.map((log, i) => (
                  <tr
                    key={log.id}
                    className={`border-t border-border/50 ${i === 0 ? "bg-blue-50/30" : ""}`}
                  >
                    <td className="py-2.5 px-4 text-right">
                      <span className="font-medium">{log.date}</span>
                      {i === 0 && (
                        <Badge variant="outline" className="mr-2 text-xs h-4 text-blue-600 border-border">
                          آخر
                        </Badge>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {Array.isArray(log.sets) ? log.sets.map((set: any, sIdx: number) => (
                          <Badge key={sIdx} variant="secondary" className="text-xs">
                            {set.reps} × {set.weight} كجم
                          </Badge>
                        )) : typeof log.sets === 'object' && log.sets !== null ? (
                          <Badge variant="secondary" className="text-xs">
                            {(log.sets as any).reps || log.reps} × {(log.sets as any).weight || log.weight} كجم
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {log.sets}×{log.reps} بوزن {log.weight}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right text-muted-foreground text-xs max-w-[150px] truncate">
                      {log.notes ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

type WorkoutTrackerProps = {
  exercises: ExerciseLog[] | undefined
}

export function WorkoutTracker({ exercises }: WorkoutTrackerProps) {
  const [filter, setFilter] = useState<"all" | "improving" | "stalled">("all")

  if (!exercises || exercises.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium mb-1">لا توجد تمارين مسجلة</p>
        <p className="text-sm">أضف أول جلسة تمرين للبدء في تتبع الأداء</p>
      </div>
    )
  }

  const grouped = groupByExercise(exercises)

  const improving = grouped.filter((g) => g.trend === "up").length
  const stalled = grouped.filter(
    (g) => g.trend === "stable" || g.trend === "down"
  ).length
  const totalExercises = grouped.length
  const totalSessions = exercises.length

  const filtered =
    filter === "improving"
      ? grouped.filter((g) => g.trend === "up")
      : filter === "stalled"
      ? grouped.filter((g) => g.trend === "stable" || g.trend === "down")
      : grouped

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold">{totalExercises}</div>
            <div className="text-xs text-muted-foreground">تمرين مختلف</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold">{totalSessions}</div>
            <div className="text-xs text-muted-foreground">جلسة مسجلة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-green-600">{improving}</div>
            <div className="text-xs text-muted-foreground">تمرين في تحسن</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-orange-500">{stalled}</div>
            <div className="text-xs text-muted-foreground">يحتاج مراجعة</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        {(["all", "improving", "stalled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f === "all" ? "الكل" : f === "improving" ? `في تحسن (${improving})` : `يحتاج مراجعة (${stalled})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">لا توجد تمارين في هذه الفئة</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((group) => (
            <ExerciseCard key={group.name} group={group} />
          ))}
        </div>
      )}
    </div>
  )
}
