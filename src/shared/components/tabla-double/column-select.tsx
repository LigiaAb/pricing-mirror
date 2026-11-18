"use client";

import { Checkbox } from "@radix-ui/react-checkbox";
import { Columns3 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";

interface ColumnaConfig {
  key: string;
  label: string;
}

interface ColumnSelectProps {
  columns: ColumnaConfig[];
  visibleKeys: Set<string>;
  onChange: (visibleKeys: Set<string>) => void;
}

/**
 * Dropdown con checkboxes para mostrar/ocultar columnas de la tabla.
 */
export default function ColumnSelect({ columns, visibleKeys, onChange }: ColumnSelectProps) {
  const toggleColumna = (key: string) => {
    const next = new Set(visibleKeys);
    next.has(key) ? next.delete(key) : next.add(key);
    onChange(next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 font-medium">
          <Columns3 className="w-3.5 h-3.5" />
          Columnas
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-1">
          Mostrar columnas
        </p>
        <div className="max-h-64 overflow-y-auto space-y-0.5">
          {columns.map((col) => {
            const active = visibleKeys.has(col.key);
            return (
              <label
                key={col.key}
                htmlFor={`col-${col.key}`}
                className={
                  `flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm ` +
                  (active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "hover:bg-muted text-foreground")
                }
              >
                <Checkbox
                  id={`col-${col.key}`}
                  checked={active}
                  onCheckedChange={() => toggleColumna(col.key)}
                  className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="flex-1">{col.label}</span>
                {/* Active badge removed - visual highlight remains */}
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
