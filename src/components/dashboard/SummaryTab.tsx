"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import {
  Timer,
  MessageSquare,
  CheckCircle2,
  Users,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

interface SummaryData {
  avgResolutionHours: number;
  avgFirstResponseHours: number;
  resolvedThisMonth: number;
  resolutionTrend: number;
  responseTrend: number;
  resolvedTrend: number;
  last7Days: { date: string; opened: number; closed: number }[];
  priorityBreakdown: { Low: number; Normal: number; High: number; Urgent: number };
  activeUsers: number;
  unassignedCount: number;
  avgCommentsPerTicket: number;
}

// ─── Trend Badge ────────────────────────────────────────────────────────────

function TrendBadge({ value, lowerIsBetter = false }: { value: number; lowerIsBetter?: boolean }) {
  const isGood = lowerIsBetter ? value <= 0 : value >= 0;
  const isNeutral = value === 0;

  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
        <Minus size={10} />
        %0
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
        isGood
          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
      }`}
    >
      {isGood ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {value > 0 ? "+" : ""}
      {value}%
    </span>
  );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  unit,
  trend,
  trendLabel,
  lowerIsBetter,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: number;
  unit: string;
  trend: number;
  trendLabel: string;
  lowerIsBetter?: boolean;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={20} className={iconColor} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <div className="mt-1 flex items-end gap-1.5 flex-wrap">
            <span className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
              {value.toLocaleString("tr-TR")}
            </span>
            <span className="mb-0.5 text-sm text-gray-400 dark:text-gray-500">{unit}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            <TrendBadge value={trend} lowerIsBetter={lowerIsBetter} />
            <span className="text-xs text-gray-400 dark:text-gray-500">{trendLabel}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Area Chart ──────────────────────────────────────────────────────────────

function AreaChart({ data }: { data: { date: string; opened: number; closed: number }[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(t);
  }, []);

  const W = 600;
  const H = 180;
  const PAD = { top: 16, right: 16, bottom: 32, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const allValues = data.flatMap((d) => [d.opened, d.closed]);
  const maxVal = Math.max(...allValues, 1);

  const xStep = chartW / Math.max(data.length - 1, 1);
  const yScale = (v: number) => chartH - (v / maxVal) * chartH;

  const pointsFor = (key: "opened" | "closed") =>
    data.map((d, i) => ({ x: PAD.left + i * xStep, y: PAD.top + yScale(d[key]) }));

  const polyline = (pts: { x: number; y: number }[]) =>
    pts.map((p) => `${p.x},${p.y}`).join(" ");

  const polygon = (pts: { x: number; y: number }[]) => {
    const first = pts[0];
    const last = pts[pts.length - 1];
    const bottom = PAD.top + chartH;
    return [
      ...pts.map((p) => `${p.x},${p.y}`),
      `${last.x},${bottom}`,
      `${first.x},${bottom}`,
    ].join(" ");
  };

  // Smooth bezier path
  const smoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpX = (prev.x + curr.x) / 2;
      d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  const smoothFill = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return "";
    const bottom = PAD.top + chartH;
    const first = pts[0];
    const last = pts[pts.length - 1];
    let d = `M ${first.x} ${bottom} L ${first.x} ${first.y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpX = (prev.x + curr.x) / 2;
      d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    d += ` L ${last.x} ${bottom} Z`;
    return d;
  };

  const openedPts = pointsFor("opened");
  const closedPts = pointsFor("closed");

  // Y-axis grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: PAD.top + chartH * (1 - f),
    label: Math.round(maxVal * f),
  }));

  return (
    <div className="relative w-full overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 200 }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="grad-opened" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="grad-closed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLines.map((g) => (
          <g key={g.y}>
            <line
              x1={PAD.left}
              y1={g.y}
              x2={W - PAD.right}
              y2={g.y}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-gray-100 dark:text-gray-700"
              strokeDasharray="4 4"
            />
            <text
              x={PAD.left - 6}
              y={g.y + 4}
              textAnchor="end"
              fontSize="9"
              className="fill-gray-400 dark:fill-gray-500"
              fill="currentColor"
            >
              {g.label}
            </text>
          </g>
        ))}

        {/* Area fills */}
        <path
          d={smoothFill(openedPts)}
          fill="url(#grad-opened)"
          style={{
            opacity: animated ? 1 : 0,
            transition: "opacity 0.6s ease",
          }}
        />
        <path
          d={smoothFill(closedPts)}
          fill="url(#grad-closed)"
          style={{
            opacity: animated ? 1 : 0,
            transition: "opacity 0.6s ease 0.1s",
          }}
        />

        {/* Lines */}
        <path
          d={smoothPath(openedPts)}
          fill="none"
          stroke="#6366F1"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            opacity: animated ? 1 : 0,
            transition: "opacity 0.5s ease",
          }}
        />
        <path
          d={smoothPath(closedPts)}
          fill="none"
          stroke="#10B981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            opacity: animated ? 1 : 0,
            transition: "opacity 0.5s ease 0.1s",
          }}
        />

        {/* Data points */}
        {openedPts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill="#6366F1"
            stroke="white"
            strokeWidth="1.5"
            style={{
              opacity: animated ? 1 : 0,
              transition: `opacity 0.3s ease ${0.3 + i * 0.05}s`,
            }}
          />
        ))}
        {closedPts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill="#10B981"
            stroke="white"
            strokeWidth="1.5"
            style={{
              opacity: animated ? 1 : 0,
              transition: `opacity 0.3s ease ${0.35 + i * 0.05}s`,
            }}
          />
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={PAD.left + i * xStep}
            y={H - 6}
            textAnchor="middle"
            fontSize="9"
            fill="currentColor"
            className="fill-gray-400 dark:fill-gray-500"
          >
            {d.date}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="mt-1 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#6366F1]" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Açılan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Kapanan</span>
        </div>
      </div>
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({ data }: { data: { Low: number; Normal: number; High: number; Urgent: number } }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const bars = [
    { key: "Low", label: "Düşük", color: "bg-gray-400 dark:bg-gray-500", textColor: "text-gray-500", value: data.Low },
    { key: "Normal", label: "Normal", color: "bg-blue-500", textColor: "text-blue-500", value: data.Normal },
    { key: "High", label: "Yüksek", color: "bg-amber-500", textColor: "text-amber-500", value: data.High },
    { key: "Urgent", label: "Acil", color: "bg-red-500", textColor: "text-red-500", value: data.Urgent },
  ];

  const maxVal = Math.max(...bars.map((b) => b.value), 1);

  // Y-axis grid
  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="flex h-48 gap-3">
      {/* Y-axis */}
      <div className="flex flex-col-reverse justify-between pb-6">
        {gridSteps.map((f) => (
          <span key={f} className="text-right text-[9px] text-gray-400 dark:text-gray-500">
            {Math.round(maxVal * f)}
          </span>
        ))}
      </div>

      {/* Bars area */}
      <div className="relative flex flex-1 flex-col">
        {/* Grid lines */}
        <div className="absolute inset-0 mb-6 flex flex-col-reverse justify-between">
          {gridSteps.map((f) => (
            <div
              key={f}
              className="w-full border-t border-dashed border-gray-100 dark:border-gray-700/60"
            />
          ))}
        </div>

        {/* Bars */}
        <div className="relative flex h-full items-end gap-2 pb-6">
          {bars.map((bar, idx) => (
            <div key={bar.key} className="flex flex-1 flex-col items-center gap-1">
              {/* Value label */}
              <span
                className={`text-xs font-semibold tabular-nums transition-opacity duration-300 ${bar.textColor} ${
                  animated ? "opacity-100" : "opacity-0"
                }`}
                style={{ transitionDelay: `${idx * 80 + 400}ms` }}
              >
                {bar.value}
              </span>
              {/* Bar */}
              <div className="relative w-full max-w-[52px] overflow-hidden rounded-t-lg">
                <div className="h-32 w-full bg-gray-50 dark:bg-gray-700/30 rounded-t-lg" />
                <div
                  className={`absolute bottom-0 w-full rounded-t-lg ${bar.color} transition-all duration-700`}
                  style={{
                    height: animated ? `${(bar.value / maxVal) * 100}%` : "0%",
                    transitionDelay: `${idx * 80}ms`,
                    transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* X-axis labels */}
        <div className="flex gap-2">
          {bars.map((bar) => (
            <div key={bar.key} className="flex-1 text-center">
              <span className="text-[10px] text-gray-500 dark:text-gray-400">{bar.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Small Stat Card ──────────────────────────────────────────────────────────

function SmallStatCard({
  label,
  value,
  unit,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: number | string;
  unit?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
            {value}
            {unit && <span className="ml-1 text-sm font-normal text-gray-400">{unit}</span>}
          </p>
        </div>
      </div>
    </Card>
  );
}

// ─── Main SummaryTab ──────────────────────────────────────────────────────────

export function SummaryTab() {
  const { data, isLoading, isError } = useQuery<SummaryData>({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/summary");
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json() as Promise<SummaryData>;
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-center text-sm text-red-400">Özet verileri yüklenemedi.</p>
    );
  }

  return (
    <div className="space-y-5">
      {/* Row 1 — 3 Metric Cards */}
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard
          label="Ortalama Kapatma Süresi"
          value={data.avgResolutionHours}
          unit="saat"
          trend={data.resolutionTrend}
          trendLabel="geçen aya göre"
          lowerIsBetter
          icon={Timer}
          iconBg="bg-[#EEF2FF] dark:bg-[#312E81]/30"
          iconColor="text-[#6366F1]"
        />
        <MetricCard
          label="Ortalama İlk Yanıt Süresi"
          value={data.avgFirstResponseHours}
          unit="saat"
          trend={data.responseTrend}
          trendLabel="geçen aya göre"
          lowerIsBetter
          icon={MessageSquare}
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          iconColor="text-amber-500"
        />
        <MetricCard
          label="Bu Ay Çözülen Talepler"
          value={data.resolvedThisMonth}
          unit="talep"
          trend={data.resolvedTrend}
          trendLabel="geçen aya göre"
          icon={CheckCircle2}
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          iconColor="text-emerald-500"
        />
      </div>

      {/* Row 2 — Area Chart + Bar Chart */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Son 7 Günlük Talep Akışı
            </h3>
            <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-xs font-medium text-[#6366F1] dark:bg-[#312E81]/30 dark:text-indigo-400">
              Bu Hafta
            </span>
          </div>
          <AreaChart data={data.last7Days} />
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Öncelik Dağılımı
            </h3>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              Tüm Zamanlar
            </span>
          </div>
          <BarChart data={data.priorityBreakdown} />
        </Card>
      </div>

      {/* Row 3 — 3 Small Stat Cards */}
      <div className="grid gap-3 md:grid-cols-3">
        <SmallStatCard
          label="Aktif Kullanıcı (30 Gün)"
          value={data.activeUsers}
          unit="kişi"
          icon={Users}
          iconBg="bg-[#EEF2FF] dark:bg-[#312E81]/30"
          iconColor="text-[#6366F1]"
        />
        <SmallStatCard
          label="Atanmamış Açık Talepler"
          value={data.unassignedCount}
          unit="talep"
          icon={AlertCircle}
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          iconColor="text-amber-500"
        />
        <SmallStatCard
          label="Ort. Yorum / Talep"
          value={data.avgCommentsPerTicket}
          unit="yorum"
          icon={MessageSquare}
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          iconColor="text-emerald-500"
        />
      </div>
    </div>
  );
}
