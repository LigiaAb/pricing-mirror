"use client";

import { RefreshCcw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { safeString } from "@/shared/lib/text";
import { cn } from "@/shared/lib/utils";

interface DetalleItem {
  tarifadetalle_id?: string | number;
  tipo_desc?: string;
  tarifadetalle_descripcion?: string | number;
  tarifadetalle_valor?: string | number;
  color?: string;
  mt?: number;
  [key: string]: unknown;
}

interface TablaDueItem {
  key: string | number;
  nombre?: string;
  nombreProveedor?: string;
  monedaSimbolo?: string;
  codMoneda?: string | number;
  costo?: number;
  valor?: number;
  detalles?: DetalleItem[];
  detallesColumns?: boolean;
  textAlign?: string;
  colorNombre?: string;
  cod_tipo_pago?: number | string;
  tipo_pago_label?: string;
  [key: string]: unknown;
}

interface TablaDueProps {
  readonly titulo?: string;
  readonly subtituloParte?: string;
  readonly subtituloTexto?: string;
  readonly entidadNombre?: string;
  readonly colorBarra?: string;
  readonly items?: TablaDueItem[];
  readonly children?: ReactNode;
  readonly renderAccionFila?: (item: TablaDueItem) => ReactNode;
  readonly renderAccionFooter?: (totalItem: Record<string, unknown>, ind: number) => ReactNode;
  readonly columnaAccionAncho?: string;
  readonly mostrarCodTipoPago?: boolean;
  readonly mostrarCosto?: boolean;
  readonly mostrarValor?: boolean;
  readonly mostrarCabecera?: boolean;
  readonly usarEtiquetasDetalleComoCabecera?: boolean;
  readonly onRefresh?: () => void;
  readonly refreshDisabled?: boolean;
  readonly accionesHeader?: ReactNode;
}

function formatCurrency(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === "") return "";
  const n = typeof val === "string" ? Number.parseFloat(val) : val;
  if (Number.isNaN(n)) return String(val);
  return n.toFixed(2).replaceAll(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function EmptyValor() {
  return (
    <div className="flex w-full items-center justify-between">
      <span className="text-sm font-semibold text-destructive">-</span>
      <span className="text-right text-sm font-semibold text-destructive">
        {(0).toFixed(2).replaceAll(/\B(?=(\d{3})+(?!\d))/g, ",")}
      </span>
    </div>
  );
}

function ValorCell({
  moneda,
  valor,
  total = false,
}: {
  readonly moneda: string;
  readonly valor: number;
  readonly total?: boolean;
}) {
  return (
    <div className="flex w-full flex-col justify-between">
      <div className="flex w-full items-center justify-between">
        <span className="mr-1 text-sm text-muted-foreground">{moneda}</span>
        <span
          className={cn(
            "text-right text-sm font-semibold tabular-nums",
            total ? "text-foreground" : "text-primary",
          )}
        >
          {formatCurrency(valor)}
        </span>
      </div>
    </div>
  );
}

export function TablaDue({
  titulo = "DUE",
  subtituloParte = "",
  subtituloTexto = "",
  entidadNombre = "",
  colorBarra = "#104f9c",
  items = [],
  children,
  renderAccionFila,
  renderAccionFooter,
  columnaAccionAncho,
  mostrarCodTipoPago = false,
  mostrarCosto = false,
  mostrarValor = true,
  mostrarCabecera = false,
  usarEtiquetasDetalleComoCabecera = false,
  onRefresh,
  refreshDisabled = false,
  accionesHeader,
}: TablaDueProps) {
  const totalPorMoneda = (() => {
    return items.reduce(
      (acc, item) => {
        const simbolo = item.monedaSimbolo;
        const codMoneda = item.codMoneda ?? simbolo;
        if (!simbolo && !codMoneda) return acc;
        const key = safeString(codMoneda ?? simbolo);
        acc[key] ??= { total: 0, monedaSimbolo: simbolo ?? "" };
        acc[key].total += Number(item.valor || 0);
        return acc;
      },
      {} as Record<string, { total: number; monedaSimbolo: string }>,
    );
  })();

  const totalCostoPorMoneda = (() => {
    return items.reduce(
      (acc, item) => {
        const simbolo = item.monedaSimbolo;
        const codMoneda = item.codMoneda ?? simbolo;
        if (!simbolo && !codMoneda) return acc;
        const key = safeString(codMoneda ?? simbolo);
        acc[key] ??= { total: 0, monedaSimbolo: simbolo ?? "" };
        acc[key].total += Number(item.costo || 0);
        return acc;
      },
      {} as Record<string, { total: number; monedaSimbolo: string }>,
    );
  })();

  const detalleCabeceras = (() => {
    if (!usarEtiquetasDetalleComoCabecera) return [];
    const primerItemConDetalles = items.find(
      (item) => item.detallesColumns && item.detalles?.length,
    );
    return primerItemConDetalles?.detalles?.map((d) => d.tipo_desc).filter(Boolean) ?? [];
  })();

  const mostrarTextoCabecera = Boolean(entidadNombre || subtituloTexto || subtituloParte);
  const mostrarAccionesCabecera = Boolean(onRefresh || accionesHeader);

  const partes = subtituloTexto.split("{parte}");

  const subtitleMsg = subtituloTexto
    .replace("{parte}", subtituloParte || "")
    .replace("{entidad}", entidadNombre || "");

  const allDetailKeys = usarEtiquetasDetalleComoCabecera ? detalleCabeceras : [];

  const colSpan =
    2 +
    (mostrarCodTipoPago ? 1 : 0) +
    (mostrarCosto ? 1 : 0) +
    (mostrarValor ? 1 : 0) +
    (allDetailKeys.length > 0 ? 1 : 0) +
    (renderAccionFila ? 1 : 0);

  const renderRow = (item: TablaDueItem) => (
    <TableRow key={item.key}>
      {renderAccionFila && (
        <TableCell style={{ width: columnaAccionAncho ?? "auto" }}>
          {renderAccionFila(item)}
        </TableCell>
      )}
      <TableCell>
        <div className="flex flex-col">
          <span className={cn("text-sm font-medium", item.colorNombre ?? "text-primary")}>
            {item.nombre ?? String(item.key)}
          </span>
          {item.nombreProveedor && (
            <span className="text-xs text-muted-foreground">{item.nombreProveedor}</span>
          )}
        </div>
      </TableCell>
      {mostrarCodTipoPago && (
        <TableCell className="w-[1%] text-center">
          <span className="px-1 text-xs text-muted-foreground">
            {item.tipo_pago_label ?? item.cod_tipo_pago ?? "-"}
          </span>
        </TableCell>
      )}
      {mostrarCosto && (
        <TableCell className="w-[1%]">
          {item.costo != null && item.costo !== 0 ? (
            <ValorCell moneda={item.monedaSimbolo || ""} valor={Number(item.costo || 0)} />
          ) : (
            <EmptyValor />
          )}
        </TableCell>
      )}
      {mostrarValor && (
        <TableCell className="w-[1%]">
          {item.valor != null && item.valor !== 0 ? (
            <ValorCell moneda={item.monedaSimbolo || ""} valor={Number(item.valor || 0)} />
          ) : (
            <EmptyValor />
          )}
        </TableCell>
      )}
      {allDetailKeys.length > 0 && (
        <TableCell>
          {item.detalles?.length ? (
            <div className="flex gap-1">
              {(item.detalles ?? []).map((det, i) => (
                <div key={det.tarifadetalle_id ?? i} className="min-w-30 flex-1 text-right">
                  {item.detallesColumns && det.tipo_desc && (
                    <span className="text-xs text-muted-foreground">{det.tipo_desc}</span>
                  )}
                  <span className="block text-xs font-medium">
                    {det.tarifadetalle_descripcion ?? det.tarifadetalle_valor ?? ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="block text-center text-xl font-semibold text-destructive">-</span>
          )}
        </TableCell>
      )}
    </TableRow>
  );

  const renderFooterRow = (
    [key, val]: [string, { total: number; monedaSimbolo: string }],
    ind: number,
  ) => (
    <TableRow key={key} className={cn(ind === 0 && "border-t-4 border-t-primary")}>
      {renderAccionFooter && (
        <TableCell style={{ width: columnaAccionAncho ?? "auto" }}>
          {renderAccionFooter(val, ind)}
        </TableCell>
      )}
      <TableCell>
        <span className="text-sm font-medium text-primary">TOTAL</span>
      </TableCell>
      {mostrarCodTipoPago && <TableCell className="w-[1%]" />}
      {mostrarCosto && (
        <TableCell className="w-[1%]">
          {totalCostoPorMoneda[key]?.total ? (
            <ValorCell
              total
              moneda={totalCostoPorMoneda[key]?.monedaSimbolo ?? ""}
              valor={totalCostoPorMoneda[key]?.total ?? 0}
            />
          ) : (
            <EmptyValor />
          )}
        </TableCell>
      )}
      {mostrarValor && (
        <TableCell className="w-[1%]">
          {val.total ? (
            <ValorCell total moneda={val.monedaSimbolo} valor={val.total} />
          ) : (
            <EmptyValor />
          )}
        </TableCell>
      )}
      {allDetailKeys.length > 0 && <TableCell />}
    </TableRow>
  );

  return (
    <div className="flex gap-2">
      <div
        className="flex flex-col items-center justify-center rounded-md py-2"
        style={{ backgroundColor: colorBarra }}
      >
        <span
          className="text-sm font-semibold tracking-widest text-white"
          style={{ writingMode: "vertical-rl", rotate: "180deg" }}
        >
          {titulo}
        </span>
        <div className="mx-0 my-2 h-px w-1 bg-white" />
      </div>

      <div className="min-w-0 flex-1 px-0">
        {(mostrarTextoCabecera || mostrarAccionesCabecera) && (
          <div className="flex items-center justify-between px-0">
            {mostrarTextoCabecera && (
              <div className="flex-1">
                <div className="mb-0.5 border-t-2 border-primary pt-0.5">
                  <span className="text-sm text-foreground">{entidadNombre}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {partes[0]}
                  {subtituloParte && (
                    <span className="font-semibold text-primary">{subtituloParte}</span>
                  )}
                  {partes[1] ?? ""}
                </span>
              </div>
            )}
            {mostrarAccionesCabecera && (
              <div className="flex items-center gap-1">
                {onRefresh && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={refreshDisabled}
                    onClick={onRefresh}
                    aria-label="Recargar datos"
                    title="Recargar datos"
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                )}
                {accionesHeader}
              </div>
            )}
          </div>
        )}

        {subtitleMsg && !mostrarTextoCabecera && (
          <p className="text-xs text-muted-foreground">{subtitleMsg}</p>
        )}
        {children}

        <div className="rounded-md border">
          <Table>
            {(mostrarCabecera || allDetailKeys.length > 0) && (
              <TableHeader>
                <TableRow>
                  {renderAccionFila && (
                    <TableHead style={{ width: columnaAccionAncho ?? "auto" }} />
                  )}
                  <TableHead>{mostrarCabecera ? "Rubro" : ""}</TableHead>
                  {mostrarCodTipoPago && <TableHead>{mostrarCabecera ? "Tipo" : ""}</TableHead>}
                  {mostrarCosto && <TableHead>{mostrarCabecera ? "Costo" : ""}</TableHead>}
                  {mostrarValor && <TableHead>{mostrarCabecera ? "Venta" : ""}</TableHead>}
                  {allDetailKeys.length > 0 && (
                    <TableHead>
                      <div className="flex gap-1">
                        {allDetailKeys.map((key) => (
                          <span
                            key={key}
                            className="min-w-30 flex-1 text-right text-xs font-semibold text-muted-foreground"
                          >
                            {key}
                          </span>
                        ))}
                      </div>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
            )}
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="text-center text-muted-foreground">
                    Sin datos
                  </TableCell>
                </TableRow>
              ) : (
                items.map(renderRow)
              )}
            </TableBody>

            {Object.keys(totalPorMoneda).length > 0 && (
              <TableFooter>
                {Object.entries(totalPorMoneda).map((entry, idx) => renderFooterRow(entry, idx))}
              </TableFooter>
            )}
          </Table>
        </div>
      </div>
    </div>
  );
}
