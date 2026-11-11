"use client";

import { Check, CircleCheck, CircleSlashed, Eye, FileDown, Plus } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";
import { useEstadosCalculo } from "../hooks/use-estados-cotizacion";
import { TIPO_PAGO } from "../lib/constantes";

import type { Id } from "../lib/tipos";
import { formatFecha } from "../lib/utils";
import type { EstadosCalculoCotizacion } from "../lib/versiones";

type Version = {
  cod_cotizaciondetalle: Id;

  version?: string | number | null;

  fecha_creacion?: string | Date | null;

  fecha_vencimiento?: string | Date | null;

  cod_estado?: Id | null;

  es_spot?: boolean | null;

  vencida?: boolean | null;

  isNew?: boolean;

  cotizaciondetalle_json?: {
    cod_estado?: Id | null;
  } | null;

  [key: string]: unknown;
};

type Props = {
  versiones: Version[];

  versionActual: Version | null;

  cotizacion: {
    cod_estado?: Id | null;
    cod_tipo_pago?: Id | null;
    entidad_id_estacion?: Id | null;
  };

  loading?: boolean;

  onView: (version: Version) => void | Promise<void>;

  onActivate: (codCotizacionDetalle: Id) => void | Promise<void>;

  onNew: () => void | Promise<void>;

  /*
   * Opcionales porque PDF
   * ya es otro flujo.
   */
  onPdf?: (version: Version) => void | Promise<void>;

  onPdfStation?: (version: Version) => void | Promise<void>;
};

// El catálogo proporciona el texto de cada código. Los permisos se deciden por separado.
function nombresEstados(catalogo: unknown) {
  const nombres = new Map<string, string>();
  if (!Array.isArray(catalogo)) return nombres;
  for (const fila of catalogo as unknown[]) {
    if (typeof fila !== "object" || fila === null) continue;
    const estado = fila as Record<string, unknown>;
    const codigo = estado.value ?? estado.cod_estado;
    const texto =
      estado.label ??
      estado.estado_desc ??
      estado.descripcion ??
      estado.nombre ??
      estado.nom_estado;
    if (
      (typeof codigo === "string" || typeof codigo === "number") &&
      typeof texto === "string" &&
      texto.trim()
    ) {
      if (!nombres.has(String(codigo))) nombres.set(String(codigo), texto.trim());
    }
  }
  return nombres;
}

function getEstadoLabel({
  codEstado,
  estados,
  nombres,
}: {
  codEstado?: Id | null;
  nombres: ReadonlyMap<string, string>;

  estados: EstadosCalculoCotizacion;
}) {
  if (estados.ACTIVO != null && String(codEstado) === String(estados.ACTIVO)) {
    return "Activa";
  }

  if (estados.INACTIVO != null && String(codEstado) === String(estados.INACTIVO)) {
    return "Inactiva";
  }

  if (estados.ANULADO != null && String(codEstado) === String(estados.ANULADO)) {
    return "Anulada";
  }

  return codEstado == null ? "—" : (nombres.get(String(codEstado)) ?? String(codEstado));
}

function configurarVersion(
  version: Version,
  cotizacion: Props["cotizacion"],
  estados: EstadosCalculoCotizacion,
  nombres: ReadonlyMap<string, string>,
) {
  const codigo = String(version.cod_estado);
  const activa = estados.ACTIVO != null && codigo === String(estados.ACTIVO);
  const inactiva = estados.INACTIVO != null && codigo === String(estados.INACTIVO);
  // La autorización Spot se lee del detalle, no del estado de la fila ni de la cabecera.
  const spotAutorizado =
    !version.es_spot ||
    (estados.AUTORIZADO != null &&
      String(version.cotizaciondetalle_json?.cod_estado) === String(estados.AUTORIZADO));
  const tipoPago = Number(cotizacion.cod_tipo_pago);
  const tieneEstacion = Boolean(cotizacion.entidad_id_estacion);
  const versionValida =
    estados.ANULADO != null && !version.isNew && codigo !== String(estados.ANULADO);

  return {
    texto: getEstadoLabel({ codEstado: version.cod_estado ?? null, estados, nombres }),
    // Por defecto, Ver aparece en versiones activas e inactivas.
    ver: activa || inactiva,
    // Activar exige cabecera activa y autorización si la versión es Spot.
    activar:
      !version.vencida &&
      spotAutorizado &&
      estados.ACTIVO != null &&
      String(cotizacion.cod_estado) === String(estados.ACTIVO) &&
      inactiva,
    // Con pago 127 y estación, se oculta el PDF general. Los pagos 127/131 permiten el general sin exigir versionValida.
    pdf:
      spotAutorizado &&
      !(tipoPago === TIPO_PAGO.COLLECT && tieneEstacion) &&
      (tipoPago === TIPO_PAGO.COLLECT || tipoPago === TIPO_PAGO.TODOS || versionValida),
    // El PDF de estación exige entidad de estación y pago 127/131. Por defecto, la versión debe existir y no estar anulada.
    pdfEstacion:
      spotAutorizado &&
      tieneEstacion &&
      ([TIPO_PAGO.COLLECT, TIPO_PAGO.TODOS] as number[]).includes(tipoPago) &&
      versionValida,

    anular: (activa || inactiva) && !version.vencida,

    activa,
  };
}

function getEstadoSpot({
  version,
  estados,
}: {
  version: Version;

  estados: EstadosCalculoCotizacion;
}) {
  if (!version.es_spot) {
    return "—";
  }

  const estado = version.cotizaciondetalle_json?.cod_estado;

  if (estados.AUTORIZADO != null && String(estado) === String(estados.AUTORIZADO)) {
    return "Autorizado";
  }

  if (estados.RECHAZADO_GLOBAL != null && String(estado) === String(estados.RECHAZADO_GLOBAL)) {
    return "Rechazado";
  }

  return "Pendiente";
}

export function VersionesTable({
  versiones,
  versionActual,
  cotizacion,

  loading = false,

  onView,
  onActivate,
  onNew,

  onPdf,
  onPdfStation,
}: Props) {
  const { estados, catalogo } = useEstadosCalculo();
  const nombres = nombresEstados(catalogo);
  // La primera versión debe estar guardada y la cabecera no puede estar confirmada ni rechazada.
  const puedeCrearNueva =
    estados?.CONFIRMADO != null &&
    estados?.RECHAZADO != null &&
    versiones.length >= 1 &&
    Boolean(versiones[0]?.fecha_creacion) &&
    ![estados.CONFIRMADO, estados.RECHAZADO].some(
      (estado) => String(estado) === String(cotizacion.cod_estado),
    );

  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h3 className="font-semibold">Versiones</h3>

          <p className="text-xs text-muted-foreground">Historial de cálculos de la cotización</p>
        </div>

        {puedeCrearNueva ? (
          <Button type="button" size="sm" disabled={loading} onClick={() => void onNew()}>
            <Plus className="size-4" />
            Nuevo cálculo
          </Button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Versión</TableHead>

              <TableHead>Fecha de Creación</TableHead>

              <TableHead>Fecha de Vencimiento</TableHead>

              <TableHead>Tarifa custom</TableHead>

              <TableHead>Tarifa custom autorizada</TableHead>

              <TableHead className="text-center" colSpan={3}>
                Estado
              </TableHead>

              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {!versiones.length ? (
              <TableRow>
                <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                  No hay versiones registradas.
                </TableCell>
              </TableRow>
            ) : (
              versiones.map((version) => {
                const estado = configurarVersion(version, cotizacion, estados, nombres);
                const selected =
                  String(version.cod_cotizaciondetalle) ===
                  String(versionActual?.cod_cotizaciondetalle);
                const vencida = version.vencida;

                return (
                  <TableRow
                    key={String(version.cod_cotizaciondetalle)}
                    className={cn(
                      selected
                        ? estado.activa
                          ? "bg-success/30"
                          : "bg-muted/80"
                        : estado.activa
                          ? "bg-success/10"
                          : "",
                      selected
                        ? estado.activa
                          ? "hover:bg-success/20"
                          : "hover:bg-muted/90"
                        : estado.activa
                          ? "hover:bg-success/5"
                          : "hover:bg-muted",
                    )}
                  >
                    <TableCell className="font-medium">{version.version ?? "—"}</TableCell>

                    <TableCell>{formatFecha(version.fecha_creacion)}</TableCell>

                    <TableCell>{formatFecha(version.fecha_vencimiento)}</TableCell>

                    <TableCell>{version.es_spot ? "Sí" : "No"}</TableCell>

                    <TableCell>
                      {getEstadoSpot({
                        version,
                        estados,
                      })}
                    </TableCell>

                    <TableCell className="p-0 m-0 text-center text-destructive">
                      {vencida && "Vencida"}
                    </TableCell>

                    <TableCell
                      className={cn(
                        "p-0 m-0 text-center font-bold",
                        estado.texto !== "Activa" ? "text-destructive" : "text-success",
                      )}
                    >
                      {estado.texto}
                    </TableCell>
                    <TableCell className="p-0 m-0">
                      {estado.texto !== "Activa" ? (
                        <CircleSlashed
                          size={10}
                          className="text-destructive p-0 m-0"
                          strokeWidth={4}
                        />
                      ) : (
                        <CircleCheck size={10} className="text-success p-0 m-0" strokeWidth={4} />
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-end gap-1 flex-nowrap p-0 m-0">
                        {estado.ver && !selected ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 p-0 m-0"
                            title="Ver versión"
                            disabled={loading}
                            onClick={() => void onView(version)}
                          >
                            <Eye className="size-4" />
                          </Button>
                        ) : null}

                        {estado.activar ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            title="Activar versión"
                            disabled={loading}
                            onClick={() => void onActivate(version.cod_cotizaciondetalle)}
                          >
                            <Check className="size-4 text-primary" />
                          </Button>
                        ) : null}

                        {estado.pdf && onPdf ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            title="Descargar PDF"
                            onClick={() => void onPdf(version)}
                          >
                            <FileDown className="size-4  text-destructive" />
                          </Button>
                        ) : null}

                        {estado.pdfEstacion && onPdfStation ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            title="Descargar PDF de estación"
                            onClick={() => void onPdfStation(version)}
                          >
                            <FileDown className="size-4 text-success" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
