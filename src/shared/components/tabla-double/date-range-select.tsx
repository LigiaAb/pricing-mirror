"use client";

import * as React from "react";
import { Slider } from "@/shared/components/ui/slider";
import { formatearFecha } from "@/shared/lib/date";

interface DateRangeSelectProps {
  label: string;
  dateMin: Date;
  dateMax: Date;
  step?: number;
  value: [Date, Date];
  onChange: (value: [Date, Date]) => void;
  tipo?: "date" | "datetime";
  formatValue?: (val: Date) => string;
}

function parseTimestamp(value: string | number | Date | null | undefined): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isNaN(ms) ? null : ms;
  }

  const normalized = String(value).trim();
  if (!normalized) return null;

  const parsed = new Date(normalized).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function formatTimestamp(timestamp: number, tipo: "date" | "datetime") {
  if (!Number.isFinite(timestamp)) return "";
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return tipo === "datetime"
    ? `${year}-${month}-${day}T${hours}:${minutes}`
    : `${year}-${month}-${day}`;
}

function defaultFormatValue(date: Date) {
  return formatearFecha(date);
}

export default function DateRangeSelect({
  label,
  dateMin,
  dateMax,
  step,
  value,
  onChange,
  tipo = "date",
  formatValue = defaultFormatValue,
}: DateRangeSelectProps) {
  const min = dateMin.getTime();
  const max = dateMax.getTime();
  const effectiveStep = step ?? (tipo === "datetime" ? 60 * 1000 : 24 * 60 * 60 * 1000);

  const startMs = parseTimestamp(value[0]);
  const endMs = parseTimestamp(value[1]);

  const [lowMs, highMs] = React.useMemo(() => {
    const start = startMs ?? min;
    const end = endMs ?? max;
    return [Math.min(start, end), Math.max(start, end)] as [number, number];
  }, [startMs, endMs, min, max]);

  const handleInputChange = (index: 0 | 1, raw: string) => {
    const parsed = parseTimestamp(raw);
    if (parsed === null) return;

    const next: [number, number] = [lowMs, highMs];
    next[index] = parsed;
    const normalized: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
    onChange([new Date(normalized[0]), new Date(normalized[1])]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-xs text-muted-foreground font-medium">
          {formatValue(new Date(lowMs))} - {formatValue(new Date(highMs))}
        </p>
      </div>

      <Slider
        min={min}
        max={max}
        step={effectiveStep}
        value={[lowMs, highMs]}
        onValueChange={(v) => onChange([new Date(v[0] ?? min), new Date(v[1] ?? max)])}
        className="py-1"
      />

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm text-muted-foreground">
          <span>Desde</span>
          <input
            type={tipo === "datetime" ? "datetime-local" : "date"}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            value={formatTimestamp(lowMs, tipo)}
            min={formatTimestamp(min, tipo)}
            max={formatTimestamp(highMs, tipo)}
            onChange={(event) => handleInputChange(0, event.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm text-muted-foreground">
          <span>Hasta</span>
          <input
            type={tipo === "datetime" ? "datetime-local" : "date"}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            value={formatTimestamp(highMs, tipo)}
            min={formatTimestamp(lowMs, tipo)}
            max={formatTimestamp(max, tipo)}
            onChange={(event) => handleInputChange(1, event.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
