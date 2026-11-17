"use client";

import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  FileX,
  SquareArrowOutUpRight,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useContextoOperativoStore } from "@/features/shell";
import { Button } from "@/shared/components/ui/button";
import { encodeId } from "@/shared/lib/sqids";
import { useAuthStore } from "@/shared/stores/auth-store";
import type { CotizacionCabeceraPayload } from "../../cotizacion/calculo/api/cotizacion-cabecera";
import { CotizacionForm } from "../../cotizacion/calculo/components/cotizacion-form";
import type {
  CatalogosFormularioCotizacion,
  OpcionFormularioCotizacion,
} from "../../cotizacion/calculo/hooks/use-formulario-cotizacion";
import { filtrarPorTipoTabla, normalizarOpciones } from "../../cotizacion/calculo/lib/catalogos";
import { formatNumero } from "../../cotizacion/calculo/lib/utils";
import { useCatalogosTarifas } from "../../tarifas/hooks/use-catalogos-tarifas";
import { useReferenciaEstable } from "../../tarifas/hooks/use-referencia-estable";
import {
  obtenerCwSpot,
  obtenerOriginalSpot,
  recuperarArchivoPdf,
  type TarifaSpotFila,
  useActualizarTarifaSpot,
  useAutorizacionSpot,
  useAutorizarTarifaSpot,
} from "../api/autorizacion-spot";
import { type FilaTarifaSpot, TablaTarifasSpot } from "./tabla-tarifas-spot";

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
/** Monto con 2 decimales; "—" si no hay valor numérico. */
const monto = (value: unknown) =>
  value == null || value === "" || !Number.isFinite(Number(value))
    ? "—"
    : formatNumero(Number(value));
const etiqueta = (items: OpcionFormularioCotizacion[], value: unknown) =>
  items.find((item) => mismoId(item.value, value))?.label ?? "";
const normalizar = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

type Fila = FilaTarifaSpot;

type EstadoSpot = "pendiente" | "sin-documento" | "autorizada" | "rechazada";

const ESTADO_SPOT: Record<EstadoSpot, { texto: string; color: string }> = {
  pendiente: { texto: "Pendiente de autorización", color: "bg-amber-500" },
  "sin-documento": { texto: "Sin documento", color: "bg-muted-foreground" },
  autorizada: { texto: "Autorizada", color: "bg-emerald-500" },
  rechazada: { texto: "Rechazada", color: "bg-destructive" },
};

/** Nombre visible de cada usuario por código (el catálogo puede venir en camelCase o snake_case). */
function mapaNombresUsuarios(usuarios: unknown): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const usuario of Array.isArray(usuarios) ? usuarios : []) {
    if (!isRecord(usuario)) continue;
    const codigo = usuario.codUsuario ?? usuario.cod_usuario ?? usuario.value;
    const nombre =
      usuario.nombreCompleto ??
      usuario.nombre_completo ??
      usuario.label ??
      usuario.nombre ??
      usuario.usuario;
    if (codigo == null || nombre == null || String(nombre).trim() === "") continue;
    if (!mapa.has(String(codigo))) mapa.set(String(codigo), String(nombre).trim());
  }
  return mapa;
}

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
  const { catalogos, isLoading: cargandoCatalogos } = useCatalogosTarifas({});
  const [mostrarAutorizados, setMostrarAutorizados] = React.useState(false);
  const [seleccionada, setSeleccionada] = React.useState<Fila | null>(null);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [estadoPdf, setEstadoPdf] = React.useState<"cargando" | "error" | null>(null);
  const seleccionRef = React.useRef<Id | null>(null);

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

  const reasonCodes = React.useMemo(
    () => normalizarOpciones(filtrarPorTipoTabla(catalogos.tipos, ["REASON_CODE_SPOT"])),
    [catalogos.tipos],
  );

  const nombresUsuarios = React.useMemo(
    () => mapaNombresUsuarios(catalogos.usuarios),
    [catalogos.usuarios],
  );

  const nombreUsuario = React.useCallback(
    (codigo: unknown) =>
      codigo == null || codigo === ""
        ? ""
        : (nombresUsuarios.get(String(codigo)) ?? String(codigo)),
    [nombresUsuarios],
  );

  const estadoSpot = React.useCallback(
    (fila: Fila): EstadoSpot => {
      if (mismoId(fila.cod_estado, estados.autorizado)) return "autorizada";
      if (mismoId(fila.cod_estado, estados.rechazado)) return "rechazada";
      return fila.url_documento ? "pendiente" : "sin-documento";
    },
    [estados],
  );

  const dataCalculada = React.useMemo<Fila[]>(() => {
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
            solicitante: nombreUsuario(merged.cod_usuario_tarifaspot),
            autorizador: nombreUsuario(merged.cod_usuario_autoriza_tarifaspot),
            reason_code_nombre:
              etiqueta(reasonCodes, merged.reason_code) ||
              (merged.reason_code == null ? "" : String(merged.reason_code)),
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
  }, [
    consulta.data,
    codCc,
    mostrarAutorizados,
    estados,
    catalogosFormulario,
    nombreUsuario,
    reasonCodes,
  ]);
  // Misma referencia mientras el contenido no cambie (recargas que traen lo mismo).
  const data = useReferenciaEstable(dataCalculada);

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

  const seleccionar = React.useCallback(async (row: Fila) => {
    // Se abre de inmediato; CW y documento se completan al llegar (un error no bloquea el detalle).
    seleccionRef.current = row.cod_tarifa_spot;
    setSeleccionada(row);
    setPdfUrl(null);
    setEstadoPdf(row.url_documento ? "cargando" : null);

    const [cw, original, documento] = await Promise.allSettled([
      obtenerCwSpot(row.cod_cotizacion_cabecera as Id, row.cod_cotizaciondetalle),
      obtenerOriginalSpot(row.cod_cotizaciondetalle),
      row.url_documento ? recuperarArchivoPdf(row.url_documento) : Promise.resolve(null),
    ]);

    // Si mientras tanto se eligió otra fila, se descarta esta respuesta.
    if (seleccionRef.current !== row.cod_tarifa_spot) return;
    setSeleccionada((actual) =>
      actual
        ? {
            ...actual,
            ...(cw.status === "fulfilled" ? { cw: cw.value } : {}),
            original: original.status === "fulfilled" ? original.value : null,
          }
        : actual,
    );
    if (documento.status === "fulfilled" && documento.value) {
      const url = URL.createObjectURL(documento.value);
      setPdfUrl(url);
      setEstadoPdf(null);
    } else if (row.url_documento) setEstadoPdf("error");
  }, []);

  // Props estables para que la tabla memoizada no se vuelva a dibujar al seleccionar.
  const onSeleccionar = React.useCallback((row: Fila) => void seleccionar(row), [seleccionar]);
  const { refetch } = consulta;
  const onRefresh = React.useCallback(() => void refetch(), [refetch]);
  const onAlternarAutorizados = React.useCallback(
    () => setMostrarAutorizados((value) => !value),
    [],
  );

  const payloadEstado = (row: Fila, codEstado: Id | null) => ({
    ...row,
    cod_cotizaciondetalle: row.cod_cotizaciondetalle,
    cod_tarfaspot: row.cod_tarifa_spot,
    cod_usuario_autoriza_tarifaspot: codUsuario,
    cod_estado: codEstado,
  });

  if (cargandoCatalogos)
    return <p className="p-4 text-sm text-muted-foreground">Cargando catálogos…</p>;
  const mutando = actualizar.isPending || autorizar.isPending;
  const estadoSeleccionada = seleccionada ? estadoSpot(seleccionada) : null;
  const puedeResolver =
    seleccionada != null &&
    Boolean(seleccionada.url_documento) &&
    mismoId(seleccionada.cod_estado, estados.activo);
  // Mínimo: el original es el monto del rubro (original_venta), no tarifa × CW.
  const minimoOriginal =
    seleccionada?.original?.esMinimo && seleccionada.original.minimo != null
      ? seleccionada.original.minimo
      : null;
  const tieneOriginal = Number(seleccionada?.venta_original ?? 0) !== 0;
  const cerrar = () => {
    seleccionRef.current = null;
    setSeleccionada(null);
  };

  return (
    <div className="space-y-4">
      <TablaTarifasSpot
        data={data}
        isLoading={consulta.isLoading}
        isRefreshing={consulta.isFetching}
        onRefresh={onRefresh}
        mostrarAutorizados={mostrarAutorizados}
        onAlternarAutorizados={onAlternarAutorizados}
        onSeleccionar={onSeleccionar}
      />
      {seleccionada && estadoSeleccionada ? (
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs font-medium">
                <span className={`size-2 rounded-full ${ESTADO_SPOT[estadoSeleccionada].color}`} />
                {ESTADO_SPOT[estadoSeleccionada].texto}
              </span>
              <span className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium">
                Cotización {seleccionada.cod_cotizacion_cabecera} · versión {seleccionada.version}
              </span>
            </div>
          </header>

          <div className="grid items-start gap-5 p-5 lg:grid-cols-3">
            <div className="col-span-2 min-w-0 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Resumen label="Usuario solicitante" value={seleccionada.solicitante || "—"} />
                <Resumen label="Usuario autorizador" value={seleccionada.autorizador || "—"} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="mb-3 text-sm font-semibold text-primary">Nuevos valores</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Resumen label="Nueva tarifa" value={monto(seleccionada.venta)} />
                    <Resumen
                      label="Nuevo valor"
                      value={monto(
                        Number(seleccionada.flete) ||
                          (seleccionada.cw == null
                            ? null
                            : Number(seleccionada.venta ?? 0) * Number(seleccionada.cw)),
                      )}
                    />
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="mb-3 text-sm font-semibold">Valores originales</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {minimoOriginal != null ? (
                      <>
                        <Resumen label="Mínimo original" value={monto(minimoOriginal)} />
                        <Resumen label="Valor original" value={monto(minimoOriginal)} />
                      </>
                    ) : (
                      <>
                        {/* Igual que el legado: sin tarifa original (0 o vacía) no hay valores que comparar. */}
                        <Resumen
                          label="Tarifa original"
                          value={tieneOriginal ? monto(seleccionada.venta_original) : "—"}
                        />
                        <Resumen
                          label="Valor original"
                          value={
                            tieneOriginal && seleccionada.cw != null
                              ? monto(Number(seleccionada.venta_original) * Number(seleccionada.cw))
                              : "—"
                          }
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                <Resumen label="Reason code" value={seleccionada.reason_code_nombre || "—"} />
                <Resumen label="Justificación" value={seleccionada.jusificacion || "—"} />
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
                {puedeResolver ? (
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
                        .then(cerrar)
                    }
                  >
                    <CheckCircle2 className="size-4" />
                    Autorizar
                  </Button>
                ) : null}
                {puedeResolver ? (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={mutando}
                    onClick={() =>
                      void actualizar
                        .mutateAsync(payloadEstado(seleccionada, estados.rechazado))
                        .then(cerrar)
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
                  <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center">
                    <FileX className="size-10 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Sin documento adjunto</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        El documento se adjunta al guardar la versión en Cotizaciones, cuando la
                        tarifa SPOT no supera a la original. Sin documento no se puede autorizar ni
                        rechazar.
                      </p>
                    </div>
                  </div>
                ) : null}

                {seleccionada.url_documento && !pdfUrl ? (
                  <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center">
                    <FileText className="size-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {estadoPdf === "error"
                        ? "No se pudo cargar el documento."
                        : "Cargando documento…"}
                    </p>
                    {estadoPdf === "error" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void seleccionar(seleccionada)}
                      >
                        Reintentar
                      </Button>
                    ) : null}
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
