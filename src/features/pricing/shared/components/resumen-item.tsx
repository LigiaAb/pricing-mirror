import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type TextAlign = "left" | "center" | "right";

type GridSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

type Props = {
  label?: ReactNode;

  valor?: ReactNode;

  prefijo?: ReactNode;

  sufijo?: ReactNode;

  highlight?: boolean;

  textAlign?: TextAlign;

  /**
   * Equivalente al `size` del Grid de MUI.
   *
   * El contenedor padre debe usar grid-cols-12.
   */
  size?: GridSize;

  decimales?: number;

  className?: string;

  labelClassName?: string;

  valueClassName?: string;

  style?: CSSProperties;
};

const COLUMN_SPAN: Record<GridSize, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
  11: "col-span-11",
  12: "col-span-12",
};

const TEXT_ALIGN: Record<TextAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

function formatearValor(valor: ReactNode, decimales: number): ReactNode {
  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }

  if (typeof valor === "number") {
    if (!Number.isFinite(valor)) {
      return "-";
    }

    return valor.toFixed(decimales);
  }

  return valor;
}

export function ResumenItem({
  label,
  valor,
  prefijo,
  sufijo,

  highlight = false,

  textAlign = "right",

  size = 4,

  decimales = 0,

  className,
  labelClassName,
  valueClassName,

  style,
}: Props) {
  const valorProcesado = formatearValor(valor, decimales);

  return (
    <div
      className={cn(
        COLUMN_SPAN[size],
        TEXT_ALIGN[textAlign],
        "min-w-0 p-0.5 flex flex-col",
        className,
      )}
      style={style}
    >
      <div className={cn("w-full h-full text-xs text-muted-foreground", labelClassName)}>
        {label}
      </div>

      <div
        className={cn(
          "w-full border-b border-primary font-mono font-medium whitespace-normal break-all",

          highlight && "font-bold text-emerald-600",

          valueClassName,
        )}
      >
        {prefijo != null ? <>{prefijo} </> : null}

        {valorProcesado}

        {sufijo != null ? <> {sufijo}</> : null}
      </div>
    </div>
  );
}
