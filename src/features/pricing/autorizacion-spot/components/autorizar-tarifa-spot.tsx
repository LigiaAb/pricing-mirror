"use client";

import {
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileText,
  SquareArrowOutUpRight,
  Upload,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useContextoOperativoStore } from "@/features/shell";
import { DataTable, DataTableColumnHeader } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui/button";
import { encodeId } from "@/shared/lib/sqids";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import { useAuthStore } from "@/shared/stores/auth-store";
import type { CotizacionCabeceraPayload } from "../../cotizacion/calculo/api/cotizacion-cabecera";
import { CotizacionForm } from "../../cotizacion/calculo/components/cotizacion-form";
import type {
  CatalogosFormularioCotizacion,
  OpcionFormularioCotizacion,
} from "../../cotizacion/calculo/hooks/use-formulario-cotizacion";
import { useCatalogosTarifas } from "../../tarifas/hooks/use-catalogos-tarifas";
import {
  obtenerCwSpot,
  recuperarArchivoPdf,
  type TarifaSpotFila,
  useActualizarTarifaSpot,
  useAutorizacionSpot,
  useAutorizarTarifaSpot,
  useCargarArchivoSpot,
} from "../api/autorizacion-spot";

type Id = string | number;
type UnknownRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;
const mismoId = (a: unknown, b: unknown) => a != null && b != null && String(a) === String(b);
const idContexto = (value: unknown, keys: string[]): Id | null => {
  if (typeof value === "string" || typeof value === "number") return value;
  if (!isRecord(value)) return null;
  for (const key of ["value", ...keys])
    if (typeof value[key] === "string" || typeof value[key] === "number") return value[key] as Id;
  return null;
};
const opciones = (value: unknown): OpcionFormularioCotizacion[] =>
  (Array.isArray(value) ? value : []).filter(isRecord).flatMap((item) => {
    const optionValue =
      item.value ??
      item.cod_tipo ??
      item.cod_pais ??
      item.cod_empresa ??
      item.cod_cc ??
      item.incoterm_id ??
      item.entidad_id ??
      item.cod_puntoenlace ??
      item.cod_ciudad;
    if (typeof optionValue !== "string" && typeof optionValue !== "number") return [];
    const text =
      item.label ??
      item.nombre_pais ??
      item.nombre_emp ??
      item.nombre_cc ??
      item.nom_tipo ??
      item.tipo_desc ??
      item.descripcion ??
      item.nombre ??
      item.entidad_nombre ??
      item.codigo ??
      optionValue;
    return [{ ...item, value: optionValue, label: String(text) } as OpcionFormularioCotizacion];
  });
const etiqueta = (items: OpcionFormularioCotizacion[], value: unknown) =>
  items.find((item) => mismoId(item.value, value))?.label ?? "";
const normalizar = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

type Fila = TarifaSpotFila & {
  cod_cotizacion_cabecera?: Id | null;
  version?: string | number | null;
  entidad_nombre?: string | null;
  tipo_transporte: string;
  tipo_servicio: string;
  tipo_carga: string;
  tipo_pago: string;
  clasificacion_carga: string;
};

function Resumen({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-md bg-muted/35 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className="mt-0.5 truncate text-sm font-semibold"
        title={typeof value === "string" ? value : undefined}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}

export function AutorizarTarifaSpot() {
  const ccRaw = useContextoOperativoStore((state) => state.currentCentroCosto);
  const empresaRaw = useContextoOperativoStore((state) => state.currentEmpresa);
  const paisRaw = useContextoOperativoStore((state) => state.currentPais);
  const usuarioRaw = useAuthStore((state) => state.user);
  const codCc = idContexto(ccRaw, ["cod_cc", "centroCostoId"]);
  const codEmpresa = idContexto(empresaRaw, ["cod_empresa", "empresaId"]);
  const codPais = idContexto(paisRaw, ["cod_pais", "paisId"]);
  const codUsuario = idContexto(usuarioRaw, ["cod_usuario"]);
  const consulta = useAutorizacionSpot();
  const actualizar = useActualizarTarifaSpot();
  const autorizar = useAutorizarTarifaSpot();
  const cargar = useCargarArchivoSpot();
  const { catalogos, isLoading: cargandoCatalogos } = useCatalogosTarifas({});
  const [mostrarAutorizados, setMostrarAutorizados] = React.useState(false);
  const [seleccionada, setSeleccionada] = React.useState<Fila | null>(null);
  const [archivo, setArchivo] = React.useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);

  const catalogosFormulario = React.useMemo<CatalogosFormularioCotizacion>(
    () => ({
      empresas: opciones(catalogos.empresas),
      centrosCosto: opciones(catalogos.centrosCosto),
      tiposTransporte: opciones(catalogos.tiposTransporte),
      tiposServicio: opciones(catalogos.tiposServicio),
      tiposCarga: opciones(catalogos.tiposCarga),
      clasificacionesCarga: opciones(catalogos.clasificacionesCarga),
      incoterms: opciones(catalogos.incoterms),
      tiposPago: opciones(catalogos.tiposPago),
      paises: opciones(catalogos.paises),
      tiposPuntoEnlace: opciones(catalogos.tiposPuntoEnlace),
      puntosEnlace: opciones(catalogos.puntosEnlace),
      ciudades: opciones(catalogos.ciudades),
      proveedores: opciones(catalogos.proveedores),
    }),
    [catalogos],
  );

  const estados = React.useMemo(() => {
    const items = opciones(catalogos.estados).filter((item) => item.nom_tipo === "GLOBAL");
    const buscar = (nombre: string) =>
      (items.find((item) => normalizar(item.estado_desc) === nombre)?.cod_estado ??
        null) as Id | null;
    return {
      activo: buscar("ACTIVO"),
      pendiente: buscar("PENDIENTE"),
      autorizado: buscar("AUTORIZADO"),
      rechazado: buscar("RECHAZADO"),
    };
  }, [catalogos.estados]);

  const data = React.useMemo<Fila[]>(() => {
    const { tarifas = [], cotizaciones = [], detalles = [] } = consulta.data ?? {};
    return tarifas
      .flatMap((tarifa) => {
        const detalle = detalles.find((item) =>
          mismoId(item.cod_cotizaciondetalle, tarifa.cod_cotizaciondetalle),
        );
        if (!detalle) return [];
        const cabecera = cotizaciones.find((item) =>
          mismoId(item.cod_cotizacion_cabecera, detalle.cod_cotizacion_cabecera),
        );
        const merged = { ...cabecera, ...detalle, ...tarifa } as TarifaSpotFila;
        if (!mismoId(merged.cod_cc, codCc)) return [];
        const visible = mostrarAutorizados
          ? mismoId(merged.cod_estado, estados.autorizado)
          : mismoId(merged.cod_estado, estados.activo) ||
            mismoId(merged.cod_estado, estados.pendiente);
        if (!visible) return [];
        return [
          {
            ...merged,
            tipo_transporte: etiqueta(
              catalogosFormulario.tiposTransporte ?? [],
              merged.cod_tipo_transporte,
            ),
            tipo_servicio: etiqueta(
              catalogosFormulario.tiposServicio ?? [],
              merged.cod_tipo_servicio,
            ),
            tipo_carga: etiqueta(catalogosFormulario.tiposCarga ?? [], merged.cod_tipo_carga),
            tipo_pago: etiqueta(catalogosFormulario.tiposPago ?? [], merged.cod_tipo_pago),
            clasificacion_carga: etiqueta(
              catalogosFormulario.clasificacionesCarga ?? [],
              merged.cod_clasificacion_carga,
            ),
          } as Fila,
        ];
      })
      .sort(
        (a, b) =>
          String(a.cod_cotizacion_cabecera ?? "").localeCompare(
            String(b.cod_cotizacion_cabecera ?? ""),
            "es",
            { numeric: true },
          ) ||
          String(a.cod_cotizaciondetalle).localeCompare(String(b.cod_cotizaciondetalle), "es", {
            numeric: true,
          }),
      );
  }, [consulta.data, codCc, mostrarAutorizados, estados, catalogosFormulario]);

  React.useEffect(
    () => () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    },
    [pdfUrl],
  );

  const abrirDocumento = React.useCallback(() => {
    if (!pdfUrl) return;

    const nuevaVentana = window.open(pdfUrl, "_blank", "noopener,noreferrer");

    if (nuevaVentana) nuevaVentana.opener = null;
  }, [pdfUrl]);

  const seleccionar = React.useCallback(
    async (row: Fila) => {
      const cw = await obtenerCwSpot(row.cod_cotizacion_cabecera as Id, row.cod_cotizaciondetalle);
      setSeleccionada({ ...row, cw });
      setArchivo(null);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      if (row.url_documento) {
        const blob = await recuperarArchivoPdf(row.url_documento);
        setPdfUrl(URL.createObjectURL(blob));
      } else setPdfUrl(null);
    },
    [pdfUrl],
  );

  const payloadEstado = (row: Fila, codEstado: Id | null) => ({
    ...row,
    cod_cotizaciondetalle: row.cod_cotizaciondetalle,
    cod_tarfaspot: row.cod_tarifa_spot,
    cod_usuario_autoriza_tarifaspot: codUsuario,
    cod_estado: codEstado,
  });

  const columns = React.useMemo<ColumnDef<Fila>[]>(
    () => [
      {
        accessorKey: "cod_tarifa_spot",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tarifa spot" />,
      },
      {
        accessorKey: "cod_cotizacion_cabecera",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cotización" />,
      },
      {
        accessorKey: "version",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Versión" />,
      },
      {
        accessorKey: "venta",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tarifa" />,
      },
      {
        accessorKey: "entidad_nombre",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
      },
      {
        accessorKey: "tipo_transporte",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Transporte" />,
      },
      {
        accessorKey: "tipo_servicio",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Servicio" />,
      },
      {
        accessorKey: "tipo_carga",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Carga" />,
      },
      {
        accessorKey: "tipo_pago",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Pago" />,
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Ver tarifa Spot"
            onClick={() => void seleccionar(row.original)}
          >
            <Eye className="size-4" />
          </Button>
        ),
      },
    ],
    [seleccionar],
  );

  if (cargandoCatalogos)
    return <p className="p-4 text-sm text-muted-foreground">Cargando catálogos…</p>;
  const mutando = actualizar.isPending || autorizar.isPending || cargar.isPending;

  return (
    <div className="space-y-4">
      <DataTable
        title="Autorización de tarifas Spot"
        columns={columns}
        data={data}
        searchKeys={["cod_cotizacion_cabecera", "entidad_nombre"]}
        isLoading={consulta.isLoading}
        isRefreshing={consulta.isFetching}
        onRefresh={() => void consulta.refetch()}
        extraActions={
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setMostrarAutorizados((value) => !value)}
          >
            {mostrarAutorizados ? "Ocultar autorizadas" : "Mostrar autorizadas"}
          </Button>
        }
      />
      {seleccionada ? (
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/25 px-5 py-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Solicitud de autorización
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                Tarifa SPOT #{seleccionada.cod_tarifa_spot}
              </h2>
            </div>
            <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs font-medium">
              <span className="size-2 rounded-full bg-amber-500" />
              Cotización {seleccionada.cod_cotizacion_cabecera} · versión {seleccionada.version}
            </div>
          </header>

          <div className="grid items-start gap-5 p-5 lg:grid-cols-3">
            <div className="col-span-2 min-w-0 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Resumen label="Usuario solicitante" value={seleccionada.cod_usuario_tarifaspot} />
                <Resumen
                  label="Usuario autorizador"
                  value={seleccionada.cod_usuario_autoriza_tarifaspot}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="mb-3 text-sm font-semibold text-primary">Nuevos valores</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Resumen label="Nueva tarifa" value={seleccionada.venta} />
                    <Resumen
                      label="Nuevo valor"
                      value={
                        seleccionada.flete ||
                        Number(seleccionada.venta ?? 0) * Number(seleccionada.cw ?? 0)
                      }
                    />
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="mb-3 text-sm font-semibold">Valores originales</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Resumen label="Tarifa original" value={seleccionada.venta_original} />
                    <Resumen
                      label="Valor original"
                      value={
                        seleccionada.venta_original == null
                          ? "—"
                          : Number(seleccionada.venta_original) * Number(seleccionada.cw ?? 0)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                <Resumen label="Reason code" value={seleccionada.reason_code} />
                <Resumen label="Justificación" value={seleccionada.jusificacion} />
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-4 text-sm font-semibold">Información de la cotización</h3>
                <CotizacionForm
                  tipoFormulario="lectura"
                  defaultValues={seleccionada as CotizacionCabeceraPayload}
                  catalogos={catalogosFormulario}
                  inputsToHide={["empresa", "centroCosto", "descripcion"]}
                  currentEmpresaId={codEmpresa}
                  currentCentroCostoId={codCc}
                  currentPaisId={codPais}
                  codUsuario={codUsuario}
                  codEstadoActivo={estados.activo ?? 1}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {seleccionada.url_documento && mismoId(seleccionada.cod_estado, estados.activo) ? (
                  <Button
                    type="button"
                    disabled={mutando}
                    onClick={() =>
                      void autorizar
                        .mutateAsync({
                          payload: payloadEstado(seleccionada, estados.autorizado),
                          codCotizacionCabecera: seleccionada.cod_cotizacion_cabecera as Id,
                          codCotizacionDetalle: seleccionada.cod_cotizaciondetalle,
                        })
                        .then(() => setSeleccionada(null))
                    }
                  >
                    <CheckCircle2 className="size-4" />
                    Autorizar
                  </Button>
                ) : null}
                {seleccionada.url_documento && mismoId(seleccionada.cod_estado, estados.activo) ? (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={mutando}
                    onClick={() =>
                      void actualizar
                        .mutateAsync(payloadEstado(seleccionada, estados.rechazado))
                        .then(() => setSeleccionada(null))
                    }
                  >
                    <XCircle className="size-4" />
                    Rechazar
                  </Button>
                ) : null}

                {seleccionada.cod_cotizacion_cabecera != null ? (
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <Link
                      href={`/tarifas/cotizacion/solicitud-cotizacion/${encodeId(Number(seleccionada.cod_cotizacion_cabecera))}`}
                      target="_blank"
                    >
                      <SquareArrowOutUpRight className="size-4" />
                      Ver cotización
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="min-w-0 space-y-4 lg:sticky lg:top-4">
              <div className="overflow-hidden rounded-lg border">
                <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
                  <FileText className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold">Documento de autorización</h3>
                </div>

                {!seleccionada.url_documento ? (
                  <div className="space-y-4 p-4">
                    <label
                      className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-muted/15 p-5 text-center transition-colors hover:bg-muted/30"
                      htmlFor="archivo-spot"
                    >
                      <Upload className="mb-2 size-7 text-muted-foreground" />
                      <span className="text-sm font-medium">Seleccionar documento</span>
                      <span className="mt-1 text-xs text-muted-foreground">
                        PDF, EML, MSG o MBOX
                      </span>
                      {archivo ? (
                        <span className="mt-3 max-w-full truncate text-xs font-medium text-primary">
                          {archivo.name}
                        </span>
                      ) : null}
                    </label>
                    <input
                      id="archivo-spot"
                      className="sr-only"
                      type="file"
                      accept="application/pdf,.pdf,.eml,.msg,.mbox"
                      onChange={(event) => setArchivo(event.target.files?.[0] ?? null)}
                    />
                    <Button
                      className="w-full"
                      type="button"
                      disabled={!archivo || mutando}
                      onClick={() =>
                        archivo &&
                        void cargar
                          .mutateAsync({ codTarifaSpot: seleccionada.cod_tarifa_spot, archivo })
                          .then(() => consulta.refetch())
                      }
                    >
                      <Upload className="size-4" />
                      Subir archivo
                    </Button>
                  </div>
                ) : null}

                {pdfUrl ? (
                  <div className="space-y-4 p-4">
                    <div className="flex min-h-48 flex-col items-center justify-center gap-4 rounded-md border bg-muted/20 p-6 text-center">
                      <FileText className="size-12 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">El documento está listo</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Ábrelo en una pestaña nueva para visualizarlo o descárgalo.
                        </p>
                      </div>
                      <Button type="button" onClick={abrirDocumento}>
                        <ExternalLink className="size-4" />
                        Abrir documento
                      </Button>
                    </div>
                    <Button className="w-full" type="button" variant="outline" asChild>
                      <a
                        href={pdfUrl}
                        download={`SPOT-${new Date().getFullYear()}-${seleccionada.cod_tarifa_spot}.pdf`}
                      >
                        <Download className="size-4" />
                        Descargar documento
                      </a>
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
