"use client";

import {
  Boxes,
  CalendarDays,
  ClipboardList,
  FileText,
  Layers,
  type LucideIcon,
  MapPin,
  MapPinned,
  Receipt,
  Route,
  SlidersHorizontal,
  SquareArrowOutUpRight,
  Target,
  Truck,
} from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import {
  CAMPOS_CABECERA,
  CatalogosCotizacionProvider,
  type CotizacionCabecera,
  formatFecha,
  formatNumero,
  getSimboloMoneda,
  unirDetallesGuardados,
  useCatalogosCotizacion,
  type VersionCotizacion,
} from "@/features/pricing/cotizacion/calculo";
import { Button } from "@/shared/components/ui/button";
import { Loader } from "@/shared/components/ui/loader";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { encodeId } from "@/shared/lib/sqids";
import { cn } from "@/shared/lib/utils";
import type { FilaKpi } from "../api/kpi-cotizaciones";
import { useFichaCotizacion } from "../hooks/use-ficha-cotizacion";

/**
 * Ficha completa de una cotización del reporte (nivel "Cotización" de la tabla dinámica),
 * en un Sheet. Lee la cabecera, las versiones y el detalle de la versión activa con las
 * mismas APIs que la pantalla de cotización (`useFichaCotizacion`) y lo muestra en cards,
 * con el mismo diseño que Información de embarques v2. Los códigos se traducen con los
 * catálogos de cotización (`CatalogosCotizacionProvider`, montado solo con la ficha abierta).
 * El botón abre la cotización en una pestaña nueva (misma ruta que Autorización Spot).
 */
export function FichaCotizacionSheet({
  fila,
  onOpenChange,
}: {
  fila: FilaKpi | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={fila != null} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l bg-card p-0 sm:max-w-4xl"
      >
        <SheetHeader className="border-b bg-muted/40 px-4 py-5 pr-12 sm:px-6 sm:py-6 sm:pr-14">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <FileText className="size-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <SheetTitle>Cotización #{fila?.cotizacion ?? ""}</SheetTitle>
                <SheetDescription>{texto(fila?.cliente) ?? "Sin cliente"}</SheetDescription>
              </div>
            </div>
            {fila ? (
              <div className="flex flex-wrap items-center gap-2">
                {texto(fila.estado) ? (
                  <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {texto(fila.estado)}
                  </span>
                ) : null}
                <Button type="button" size="sm" asChild>
                  <Link
                    href={`/tarifas/cotizacion/solicitud-cotizacion/${encodeId(Number(fila.cotizacion))}`}
                    target="_blank"
                  >
                    <SquareArrowOutUpRight className="size-4" aria-hidden="true" />
                    Ver cotización
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        </SheetHeader>

        {fila ? (
          <CatalogosCotizacionProvider>
            <ContenidoFicha fila={fila} />
          </CatalogosCotizacionProvider>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

/* ==========================================================================
 * CONTENIDO
 * ========================================================================== */

type IdCampo = keyof typeof CAMPOS_CABECERA;

/** Lo que la ficha lee de cada campo de la cabecera (`lib/cabecera.ts`). */
const DEFINICION_CAMPOS = CAMPOS_CABECERA as unknown as Record<
  IdCampo,
  { cod: string; label?: string; formulario?: { catalogo?: string } }
>;

/** Campos de la cabecera por card; el segundo valor reemplaza la etiqueta si se repite. */
const CAMPOS_GENERAL: readonly (readonly [IdCampo, string?])[] = [
  ["fecha"],
  ["empresa"],
  ["centroCosto"],
  ["cliente"],
  ["contacto"],
  ["estacion"],
  ["contacto_estacion"],
  ["descripcion"],
];
const CAMPOS_SERVICIO: readonly (readonly [IdCampo, string?])[] = [
  ["tipoTransporte"],
  ["tipoServicio"],
  ["tipoCarga"],
  ["clasificacionCarga"],
  ["incoterm"],
  ["tipoPago"],
];
const CAMPOS_ORIGEN: readonly (readonly [IdCampo, string?])[] = [
  ["paisOrigen", "País"],
  ["tipoPuntoEnlaceOrigen", "Tipo"],
  ["puntoEnlaceOrigen", "Punto de enlace"],
  ["ciudadOrigen", "Ciudad"],
  ["direccion_origen", "Dirección"],
];
const CAMPOS_DESTINO: readonly (readonly [IdCampo, string?])[] = [
  ["paisDestino", "País"],
  ["tipoPuntoEnlaceDestino", "Tipo"],
  ["puntoEnlaceDestino", "Punto de enlace"],
  ["ciudadDestino", "Ciudad"],
  ["direccion_destino", "Dirección"],
];

type Registro = Record<string, unknown>;
type Opcion = { value?: unknown; label?: unknown };

function ContenidoFicha({ fila }: { fila: FilaKpi }) {
  const ficha = useFichaCotizacion(fila);
  const { formulario, calculo, isLoading: cargandoCatalogos } = useCatalogosCotizacion();

  /** Texto de un código buscándolo en un catálogo `{ value, label }`. */
  const etiquetaDe = (catalogo: readonly Opcion[] | undefined, valor: unknown) => {
    if (valor == null || valor === "") return undefined;
    const opcion = catalogo?.find((o) => String(o.value) === String(valor));
    return opcion?.label == null ? String(valor) : String(opcion.label);
  };

  /** Valor de un campo de la cabecera, ya traducido con su catálogo. */
  const valorCampo = (cabecera: CotizacionCabecera, idCampo: IdCampo) => {
    const def = DEFINICION_CAMPOS[idCampo];
    const valor = (cabecera as Registro)[def.cod];
    if (valor == null || valor === "") return undefined;
    if (idCampo === "fecha") return formatFecha(valor as string);
    if (idCampo === "cliente")
      return texto(cabecera.entidad_nombre) ?? etiquetaDe(formulario.clientes, valor);
    const catalogo = def.formulario?.catalogo as keyof typeof formulario | undefined;
    return catalogo ? etiquetaDe(formulario[catalogo] as readonly Opcion[], valor) : String(valor);
  };

  const filasCampos = (cabecera: CotizacionCabecera, campos: typeof CAMPOS_GENERAL) =>
    campos.map(([idCampo, etiqueta]) => (
      <Fila key={idCampo} label={etiqueta ?? DEFINICION_CAMPOS[idCampo].label ?? idCampo}>
        {valorCampo(cabecera, idCampo) ?? VACIO}
      </Fila>
    ));

  const { cabecera, versionActiva, detalle } = ficha;
  const criterios = (detalle?.criteriosGuardados ?? []).map((guardado) => {
    const disponible = detalle?.criteriosDisponibles.find(
      (c) => String(c.cod_criterio) === String(guardado.cod_criterio),
    );
    return {
      cod: String(guardado.cod_criterio),
      campo: disponible?.campo,
      etiqueta: texto(disponible?.descripcion) ?? `Criterio ${guardado.cod_criterio}`,
      valor: valorCriterio(guardado.valor),
    };
  });
  const cw = criterios.find((c) => c.campo === "valor_cw" || c.cod === COD_CRITERIO_CW)?.valor;
  const rubros = (detalle?.rubros ?? []) as Registro[];

  // Espera datos y catálogos para que las cards no aparezcan a medias ni con códigos.
  if (ficha.cargando || cargandoCatalogos) {
    return <Loader texto="CARGANDO LA COTIZACIÓN" className="min-h-[50vh]" />;
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      {ficha.error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {ficha.error instanceof Error ? ficha.error.message : "No se pudo cargar la cotización."}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CardInfo titulo="General" icono={ClipboardList}>
          <Datos>
            {cabecera ? filasCampos(cabecera, CAMPOS_GENERAL) : null}
            <Fila label="Cotizó">{texto(cabecera?.usuario) ?? nombreUsuario(fila)}</Fila>
            <Fila label="Estado">
              {texto(cabecera?.estado_nombre) ?? texto(fila.estado) ?? VACIO}
            </Fila>
          </Datos>
        </CardInfo>

        <CardInfo titulo="Servicio" icono={Truck}>
          <Datos>
            {cabecera ? filasCampos(cabecera, CAMPOS_SERVICIO) : null}
            {/* Carrier = proveedor de los rubros de flete (el del reporte); si no hay, el de la cabecera. */}
            <Fila label="Carrier">
              {texto(fila.carrier) ??
                (cabecera ? valorCampo(cabecera, "carrier") : undefined) ??
                VACIO}
            </Fila>
          </Datos>
        </CardInfo>

        <CardInfo titulo="Origen" icono={MapPin} meta={lugar(fila.origen_codigo, fila.origen)}>
          <Datos>{cabecera ? filasCampos(cabecera, CAMPOS_ORIGEN) : null}</Datos>
        </CardInfo>

        <CardInfo
          titulo="Destino"
          icono={MapPinned}
          meta={lugar(fila.destino_codigo, fila.destino)}
        >
          <Datos>{cabecera ? filasCampos(cabecera, CAMPOS_DESTINO) : null}</Datos>
        </CardInfo>

        <CardInfo
          titulo="Versión activa"
          icono={Layers}
          meta={versionActiva ? `Versión ${versionActiva.version ?? VACIO}` : undefined}
        >
          <Datos>
            <Fila label="Creación">{formatFecha(fechaDe(versionActiva, "fecha_creacion"))}</Fila>
            <Fila label="Vencimiento">
              {formatFecha(fechaDe(versionActiva, "fecha_vencimiento"))}
            </Fila>
            <Fila label="Tarifa custom (Spot)">{versionActiva?.es_spot ? "Sí" : "No"}</Fila>
            <Fila label="CW">{cw ?? VACIO}</Fila>
            <Fila label="Peso">{numeroODash(cabecera?.peso)}</Fila>
            <Fila label="Volumen">{numeroODash(cabecera?.volumen)}</Fila>
            <Fila label="Total">{numeroODash(versionActiva?.total)}</Fila>
          </Datos>
        </CardInfo>

        <CardInfo titulo="Datos complementarios" icono={FileText}>
          <Datos>
            {DATOS_COMPLEMENTARIOS.map(([campo, label]) => (
              <Fila key={campo} label={label}>
                {textoLibre(versionActiva?.[campo]) ?? VACIO}
              </Fila>
            ))}
          </Datos>
        </CardInfo>

        <CardInfo titulo="En el periodo del reporte" icono={Target}>
          <Datos>
            <Fila label="Creación">{formatFecha(fila.fecha_creacion ?? null)}</Fila>
            <Fila label="Aprobación">{formatFecha(fila.fecha_aprobacion ?? null)}</Fila>
            <Fila label="Realizada">{fila.realizada === 1 ? "Sí" : "No"}</Fila>
            <Fila label="Cerrada">{fila.cerrada === 1 ? "Sí" : "No"}</Fila>
            {fila.tipo_precio ? (
              <Fila label="Realización de precio">{TIPO_PRECIO[fila.tipo_precio]}</Fila>
            ) : null}
          </Datos>
        </CardInfo>

        <CardInfo
          titulo="Criterios"
          icono={SlidersHorizontal}
          meta={cantidad(criterios.length, "criterio", "criterios")}
          className="md:col-span-full"
        >
          {criterios.length === 0 ? (
            <SinDatos texto="Sin criterios guardados." />
          ) : (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {criterios.map((c) => (
                <div key={c.cod} className="grid grid-cols-[minmax(8rem,auto)_minmax(0,1fr)] gap-3">
                  <dt className="pt-0.5 text-xs text-muted-foreground">{c.etiqueta}</dt>
                  <dd className="min-w-0 break-words">{c.valor ?? VACIO}</dd>
                </div>
              ))}
            </dl>
          )}
        </CardInfo>

        <CardInfo
          titulo="Rubros de la versión"
          icono={Receipt}
          meta={cantidad(rubros.length, "rubro", "rubros")}
          className="md:col-span-full"
        >
          {rubros.length === 0 ? (
            <SinDatos texto="Sin rubros guardados." />
          ) : (
            <Tabla
              columnas={["Grupo", "Rubro", "Servicio", "Proveedor", "Detalle", "Costo", "Venta"]}
              numericas={[5, 6]}
              filas={rubros.map((r, i) => ({
                clave: String(r.cod_detallerubro ?? `${String(r.cod_rubro)}-${i}`),
                celdas: [
                  texto(r.gruporubro_nombre as string) ?? VACIO,
                  texto(r.nombre_rubro as string) ??
                    etiquetaDe(
                      calculo.rubros.map((x) => ({
                        value: x.cod_rubro,
                        label: x.nombre_rubro ?? x.nombre,
                      })),
                      r.cod_rubro,
                    ) ??
                    VACIO,
                  texto(r.nombre_servicio as string) ??
                    texto(r.siglas_servicio as string) ??
                    etiquetaDe(
                      calculo.servicios.map((x) => ({
                        value: x.cod_servicio,
                        label: x.nombre_servicio ?? x.nombre,
                      })),
                      r.cod_servicio,
                    ) ??
                    VACIO,
                  etiquetaDe(formulario.proveedores, r.entidad_id ?? r.cod_entidad) ?? VACIO,
                  detalleRubro(r) ?? VACIO,
                  monto(
                    r.costo ?? r.costo_rubro ?? r.precio_costo,
                    getSimboloMoneda(
                      calculo.monedas,
                      (r.cod_moneda_costo ?? r.metodo_cod_moneda_costo) as number | null,
                    ),
                  ),
                  monto(
                    r.venta ?? r.venta_rubro ?? r.precio_venta,
                    getSimboloMoneda(
                      calculo.monedas,
                      (r.cod_moneda_venta ?? r.metodo_cod_moneda_venta) as number | null,
                    ),
                  ),
                ],
              }))}
            />
          )}
        </CardInfo>

        {(detalle?.legs.length ?? 0) > 0 ? (
          <CardInfo
            titulo="Tramos (legs)"
            icono={Route}
            meta={cantidad(detalle?.legs.length ?? 0, "tramo", "tramos")}
            className="md:col-span-full"
          >
            <Tabla
              columnas={["#", "Transporte", "Origen → destino", "Proveedor", "Rate", "Costo"]}
              numericas={[4, 5]}
              filas={(detalle?.legs ?? []).map((leg) => ({
                clave: `${leg.orden}-${String(leg.cod_cotizaciondetalle)}`,
                celdas: [
                  String(leg.orden),
                  etiquetaDe(formulario.tiposTransporte, leg.cod_tipo_transporte) ?? VACIO,
                  `${etiquetaDe(formulario.puntosEnlace, leg.cod_puntoenlace_origen) ?? VACIO} → ${
                    etiquetaDe(formulario.puntosEnlace, leg.cod_puntoenlace_destino) ?? VACIO
                  }`,
                  etiquetaDe(formulario.proveedores, leg.entidad_id) ?? VACIO,
                  formatNumero(leg.rate),
                  formatNumero(leg.costo),
                ],
              }))}
            />
          </CardInfo>
        ) : null}

        {(detalle?.dimensiones.length ?? 0) > 0 ? (
          <CardInfo
            titulo="Dimensiones"
            icono={Boxes}
            meta={cantidad(detalle?.dimensiones.length ?? 0, "línea", "líneas")}
            className="md:col-span-full"
          >
            <Tabla
              columnas={["Cantidad", "Largo × ancho × alto", "Peso unitario"]}
              numericas={[0, 2]}
              filas={((detalle?.dimensiones ?? []) as Registro[]).map((d, i) => ({
                clave: String(d.cod_cotdetdim ?? i),
                celdas: [
                  entero(Number(d.cotdetdim_cantidad ?? 0)),
                  `${formatNumero(d.cotdetdim_largo as number)} × ${formatNumero(d.cotdetdim_ancho as number)} × ${formatNumero(d.cotdetdim_alto as number)} ${
                    etiquetaDe(calculo.unidadesMedida, d.cotdetdim_unidad_medida) ?? ""
                  }`.trim(),
                  `${formatNumero(d.cotdetdim_peso_unitario as number)} ${
                    etiquetaDe(calculo.unidadesPeso, d.cotdetdim_unidad_peso) ?? ""
                  }`.trim(),
                ],
              }))}
            />
          </CardInfo>
        ) : null}

        <CardInfo
          titulo="Versiones"
          icono={CalendarDays}
          meta={cantidad(ficha.versiones.length, "versión", "versiones")}
          className="md:col-span-full"
        >
          {ficha.versiones.length === 0 ? (
            <SinDatos texto="Sin versiones." />
          ) : (
            <Tabla
              columnas={["Versión", "Creación", "Vencimiento", "Spot", "Total", ""]}
              numericas={[4]}
              filas={ficha.versiones.map((v) => ({
                clave: String(v.cod_cotizaciondetalle),
                celdas: [
                  String(v.version ?? VACIO),
                  formatFecha(fechaDe(v, "fecha_creacion")),
                  formatFecha(fechaDe(v, "fecha_vencimiento")),
                  v.es_spot ? "Sí" : "No",
                  numeroODash(v.total),
                  String(v.cod_cotizaciondetalle) === String(versionActiva?.cod_cotizaciondetalle)
                    ? "Activa"
                    : "",
                ],
              }))}
            />
          )}
        </CardInfo>
      </div>
    </div>
  );
}

/* ==========================================================================
 * DATOS
 * ========================================================================== */

const VACIO = "—";

/** Criterio CW (mismo código que usa Autorización Spot). */
const COD_CRITERIO_CW = "15";

/**
 * Realización de Precio (solo en ese reporte, cotizaciones cerradas): compara la venta Spot
 * con la venta original del flete en la versión activa.
 */
/** Datos complementarios de la versión (los de `DatosComplementariosCotizacion`). */
const DATOS_COMPLEMENTARIOS = [
  ["tipo_servicio", "Tipo de servicio"],
  ["tipo_transito", "Tiempo de tránsito"],
  ["salida", "Salida"],
  ["tipo_producto", "Tipo de producto"],
  ["opcionales", "Opcionales"],
] as const;

const TIPO_PRECIO: Record<NonNullable<FilaKpi["tipo_precio"]>, string> = {
  SOBRE_TARIFA: "Sobre tarifa (venta Spot mayor que la tarifa publicada)",
  SPOT: "Spot (venta Spot menor que la tarifa publicada)",
  TARIFA_PUBLICADA: "Tarifa publicada (sin Spot o igual a la tarifa)",
};

const texto = (valor: string | null | undefined) => valor?.trim() || undefined;

/** Texto de un campo libre (string o número); vacío si no hay. */
const textoLibre = (valor: unknown) =>
  typeof valor === "string" || typeof valor === "number" ? texto(String(valor)) : undefined;

/** Detalles guardados del rubro ("Tipo: descripción valor"), como los lee el cálculo. */
const detalleRubro = (rubro: Registro) =>
  unirDetallesGuardados(
    rubro.detalles,
    rubro.metodo_detalle,
    rubro.metodo_detalles,
    typeof rubro.detalle === "string" ? rubro.detalle.trim() : rubro.detalle,
  )
    .map((d) => {
      const descripcion = [d.tarifadetalle_descripcion, d.tarifadetalle_valor]
        .filter((v) => v != null && v !== "")
        .join(" ");
      return [d.tipo_desc, descripcion].filter(Boolean).join(": ");
    })
    .filter(Boolean)
    .join(", ") || undefined;

const nombreUsuario = (fila: FilaKpi) =>
  texto(`${fila.nombres ?? ""} ${fila.apellidos ?? ""}`) ?? `Usuario ${fila.usuario}`;

const cantidad = (n: number, singular: string, plural: string) =>
  `${n} ${n === 1 ? singular : plural}`;

/** "CÓDIGO - NOMBRE" (o solo el nombre). */
const lugar = (codigo: string | null | undefined, nombre: string | null | undefined) => {
  const n = texto(nombre);
  const c = texto(codigo);
  if (!n) return undefined;
  return c ? `${c} - ${n}` : n;
};

const numeroODash = (valor: unknown) =>
  valor == null || valor === "" || !Number.isFinite(Number(valor))
    ? VACIO
    : formatNumero(Number(valor));

/** Sin decimales si es entero (cantidades, contenedores); si no, con 2. */
const entero = (valor: number) =>
  Number.isInteger(valor) ? valor.toLocaleString("en-US") : formatNumero(valor);

const monto = (valor: unknown, simbolo: string) => {
  const n = numeroODash(valor);
  return n === VACIO || !simbolo ? n : `${simbolo} ${n}`;
};

/** Fecha de la versión (el schema no la declara: llega por passthrough). */
const fechaDe = (version: VersionCotizacion | null | undefined, campo: string) => {
  const valor = (version as Registro | null | undefined)?.[campo];
  return typeof valor === "string" || valor instanceof Date ? valor : null;
};

/** Valor guardado de un criterio: número, texto u opción `{ value, label }`. */
function valorCriterio(valor: unknown): string | undefined {
  if (valor == null || valor === "") return undefined;
  if (typeof valor === "object") {
    const opcion = valor as Opcion;
    return opcion.label == null ? undefined : String(opcion.label);
  }
  if (typeof valor === "number") return entero(valor);
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  return String(valor);
}

/* ==========================================================================
 * PIEZAS DE LAS CARDS (mismo diseño que Información de embarques v2)
 * ========================================================================== */

/** Card con encabezado (icono, título y dato resumen a la derecha). */
function CardInfo({
  titulo,
  icono: Icono,
  meta,
  className,
  children,
}: {
  titulo: string;
  icono: LucideIcon;
  meta?: string | undefined;
  className?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("flex flex-col overflow-hidden rounded-lg border bg-card", className)}>
      <header className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icono className="size-4" aria-hidden="true" />
        </span>
        <h4 className="flex-1 text-sm font-semibold">{titulo}</h4>
        {meta ? <span className="text-xs text-muted-foreground">{meta}</span> : null}
      </header>
      <div className="flex flex-1 flex-col gap-3 px-4 py-3">{children}</div>
    </section>
  );
}

/** Lista etiqueta / valor en dos columnas. */
function Datos({ children }: { children: React.ReactNode }) {
  return (
    <dl className="grid grid-cols-[minmax(6rem,auto)_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
      {children}
    </dl>
  );
}

function Fila({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="pt-0.5 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </>
  );
}

function SinDatos({ texto: mensaje }: { texto: string }) {
  return <p className="text-sm text-muted-foreground">{mensaje}</p>;
}

/** Tabla compacta dentro de una card; `numericas` = índices de columnas alineadas a la derecha. */
function Tabla({
  columnas,
  numericas = [],
  filas,
}: {
  columnas: readonly string[];
  numericas?: readonly number[];
  filas: readonly { clave: string; celdas: readonly string[] }[];
}) {
  const alinear = (i: number) => (numericas.includes(i) ? "text-right tabular-nums" : "text-left");
  return (
    <div className="-mx-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-xs text-muted-foreground">
            {columnas.map((c, i) => (
              <th key={c || `columna-${i}`} className={cn("px-4 py-1.5 font-medium", alinear(i))}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {filas.map((f) => (
            <tr key={f.clave}>
              {f.celdas.map((celda, i) => (
                <td
                  key={`${f.clave}-${columnas[i] ?? i}`}
                  className={cn("px-4 py-1.5", alinear(i))}
                >
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
