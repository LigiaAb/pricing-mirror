"use client";

import { Slider } from "@/shared/components/ui/slider";

interface RangeSelectProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (val: number) => string;
}

/**
 * Slider de rango doble (min-max) con etiqueta y valores formateados.
 */
export default function RangeSelect({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  formatValue = (v) => String(v),
}: RangeSelectProps) {
  const [low, high] = value;
  const idBase = label.replace(/\s+/g, "-").toLowerCase();

  const handleInputChange = (index: 0 | 1, raw: string) => {
    const parsed = raw === "" ? NaN : Number(raw);
    if (Number.isNaN(parsed)) return;
    const next: [number, number] = [low, high];
    next[index] = clamp(parsed, min, max);
    const normalized: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
    onChange(normalized);
  };

  function clamp(v: number, a: number, b: number) {
    return Math.min(Math.max(v, a), b);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-xs text-muted-foreground font-medium">
          {formatValue(low)} – {formatValue(high)}
        </p>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={(v) => onChange([v[0] ?? min, v[1] ?? max])}
        className="py-1"
      />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${idBase}-desde`} className="block text-xs text-muted-foreground mb-1">
            Desde
          </label>
          <input
            type="number"
            className="w-full rounded-md border border-border px-2 py-1 text-sm"
            value={String(low)}
            min={min}
            max={high}
            step={step}
            id={`${idBase}-desde`}
            onChange={(e) => handleInputChange(0, e.target.value)}
          />
        </div>
        <div>
          <label htmlFor={`${idBase}-hasta`} className="block text-xs text-muted-foreground mb-1">
            Hasta
          </label>
          <input
            type="number"
            className="w-full rounded-md border border-border px-2 py-1 text-sm"
            value={String(high)}
            min={low}
            max={max}
            step={step}
            id={`${idBase}-hasta`}
            onChange={(e) => handleInputChange(1, e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
