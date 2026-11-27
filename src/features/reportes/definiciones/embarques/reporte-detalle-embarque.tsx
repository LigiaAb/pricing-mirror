import { format } from "date-fns";
import { z } from "zod";
import { consultarApi } from "../../api/consultar-api";
import { MensajeVacio } from "../../components/panel";
import {
  type ColumnaReporte,
  type ContenidoReporteProps,
  definirReporte,
  type ValorCelda,
} from "../../lib/definir-reporte";

/**
 * EMB-DE-03 Detalle de embarque.
 * Endpoint con el SQL fijo en Oracle (`reportes_embarques_transito.js` del back), sin cambios:
 * solo recibe los filtros de texto `coord_codigo`, `booking` y `contenedor` (al menos uno; lo
 * valida el back). Pueden coincidir varias coordinaciones: un árbol por cada una. El SQL une coordinación,
 * seguimientos, transbordos, contenedores y subcoordinaciones en una sola lista, así que cada
 * dato se repite en varias filas: la vista (`DetalleEmbarque`) las separa en un árbol (ficha
 * de la coordinación y una rama por sección, sin repetidos) y el Excel lleva todas las filas
 * tal cual en una hoja. Las fechas llegan como texto local `YYYY-MM-DDTHH:mm:ss` y las claves
 * en minúsculas (el cliente HTTP las normaliza).
 */
const valor = z.union([z.string(), z.number()]).transform(String).nullable().catch(null);
/** Schema con `valor` (texto o null) en cada clave. */
const campos = <const K extends string>(claves: readonly K[]) =>
  Object.fromEntries(claves.map((clave) => [clave, valor])) as Record<K, typeof valor>;

/** Claves de la respuesta (columnas del SQL en minúsculas), en su orden. */
const CAMPOS = [
  // Coordinación
  "coord_codigo",
  "consignatario",
  "house_bl",
  "master_bl",
  "booking",
  "orden_compra",
  "carrier",
  "master_buque",
  "pais_coordinacion",
  "ciudad_origen",
  "puerto_origen",
  "pais_destino",
  "ciudad_destino",
  "puerto_destino",
  "etd",
  "atd",
  "eta",
  "ata",
  // Seguimientos
  "seguimiento_correlativo",
  "seguimiento_comentario",
  "seguimiento_fecha",
  "seguimiento_usuario",
  "seguimiento_tipo",
  // Transbordos
  "transbordo_correlativo",
  "transbordo_fecha",
  "transbordo_vessel",
  "transbordo_ciudad_salida",
  "transbordo_viaje",
  "transbordo_eta",
  "transbordo_ata",
  "transbordo_etd",
  "transbordo_atd",
  "coord_eta",
  "transbordo_itinerario",
  // Contenedores
  "numero_contenedor",
  // Subcoordinaciones. ORDEN_COMPRA, ETD, ATD, ETA y ATA se repiten en el SQL (también son de
  // la coordinación); si el driver de Oracle numera las repetidas, llegan como `*_1`.
  "coordinacion",
  "doc_embarque",
  "proveedor_origen",
  "orden_compra_1",
  "etd_1",
  "atd_1",
  "eta_1",
  "ata_1",
  "coord_rel_codigo",
] as const;
type Campo = (typeof CAMPOS)[number];
const filaSchema = z.looseObject(campos(CAMPOS));
type Fila = z.infer<typeof filaSchema>;

/** Texto `YYYY-MM-DDTHH:mm:ss` (hora local) → `patron`; vacío o inválido → null. */
const conFormato =
  (patron: string) =>
  (texto: string | null): string | null => {
    const dia = texto ? new Date(texto) : null;
    return dia && !Number.isNaN(dia.getTime()) ? format(dia, patron) : null;
  };
const fecha = conFormato("dd/MM/yyyy");
const fechaHora = conFormato("dd/MM/yyyy HH:mm");

/** Columna del Excel: el campo tal cual o con formato (fechas). */
const columna = (
  id: Campo,
  label: string,
  formato?: (texto: string | null) => ValorCelda,
): ColumnaReporte<Fila> => ({
  id,
  label,
  valor: (f) => (formato ? formato(f[id]) : f[id]),
});

// Todas las columnas del SQL, en su orden (Excel en una hoja).
const columnas: readonly ColumnaReporte<Fila>[] = [
  columna("coord_codigo", "Coordinación"),
  columna("consignatario", "Consignatario"),
  columna("house_bl", "House BL"),
  columna("master_bl", "Master BL"),
  columna("booking", "Booking"),
  columna("orden_compra", "Orden de compra"),
  columna("carrier", "Carrier"),
  columna("master_buque", "Buque"),
  columna("pais_coordinacion", "País origen"),
  columna("ciudad_origen", "Ciudad origen"),
  columna("puerto_origen", "Puerto origen"),
  columna("pais_destino", "País destino"),
  columna("ciudad_destino", "Ciudad destino"),
  columna("puerto_destino", "Puerto destino"),
  columna("etd", "ETD", fecha),
  columna("atd", "ATD", fecha),
  columna("eta", "ETA", fecha),
  columna("ata", "ATA", fecha),
  columna("seguimiento_correlativo", "Seguimiento"),
  columna("seguimiento_comentario", "Comentario seguimiento"),
  columna("seguimiento_fecha", "Fecha seguimiento", fechaHora),
  columna("seguimiento_usuario", "Usuario seguimiento"),
  columna("seguimiento_tipo", "Tipo seguimiento"),
  columna("transbordo_correlativo", "Transbordo"),
  columna("transbordo_fecha", "Fecha transbordo", fechaHora),
  columna("transbordo_vessel", "Vessel transbordo"),
  columna("transbordo_ciudad_salida", "Ciudad salida transbordo"),
  columna("transbordo_viaje", "Viaje transbordo"),
  columna("transbordo_eta", "ETA transbordo", fecha),
  columna("transbordo_ata", "ATA transbordo", fecha),
  columna("transbordo_etd", "ETD transbordo", fecha),
  columna("transbordo_atd", "ATD transbordo", fecha),
  columna("coord_eta", "Nueva ETA", fecha),
  columna("transbordo_itinerario", "Itinerario / transbordo"),
  columna("numero_contenedor", "No. contenedor"),
  columna("coordinacion", "Subcoordinación"),
  columna("doc_embarque", "Doc. embarque"),
  columna("proveedor_origen", "Proveedor origen"),
  columna("orden_compra_1", "Orden de compra subcoordinación"),
  columna("etd_1", "ETD subcoordinación", fecha),
  columna("atd_1", "ATD subcoordinación", fecha),
  columna("eta_1", "ETA subcoordinación", fecha),
  columna("ata_1", "ATA subcoordinación", fecha),
  columna("coord_rel_codigo", "Coordinación relacionada"),
];

/** Una fila por cada `clave` distinta (la primera en que aparece); sin clave, se omite. */
function unicos(filas: readonly Fila[], clave: (f: Fila) => string | null): [string, Fila][] {
  const vistos = new Map<string, Fila>();
  for (const fila of filas) {
    const valorClave = clave(fila);
    if (valorClave && !vistos.has(valorClave)) vistos.set(valorClave, fila);
  }
  return [...vistos];
}

/** Etiquetas y valores en rejilla ("—" si está vacío). */
function Datos({ items }: Readonly<{ items: readonly [string, string | null][] }>) {
  return (
    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(([label, dato]) => (
        <div key={label}>
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="font-medium">{dato || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Rama del árbol: se abre y se cierra; muestra cuántos registros tiene. */
function Rama({
  titulo,
  cantidad,
  children,
}: Readonly<{ titulo: string; cantidad: number; children: React.ReactNode }>) {
  return (
    <details open className="overflow-hidden rounded-lg border">
      <summary className="cursor-pointer select-none bg-muted/50 px-4 py-2 font-medium">
        {titulo} ({cantidad})
      </summary>
      <div className="p-4">
        {cantidad ? children : <p className="text-muted-foreground">Sin registros.</p>}
      </div>
    </details>
  );
}

/** Vista de árbol: un árbol por coordinación (booking o contenedor pueden traer varias). */
function DetalleEmbarque({ filas }: Readonly<ContenidoReporteProps<Fila>>) {
  if (!filas.length) return <MensajeVacio>No se encontró la coordinación.</MensajeVacio>;
  const porCoordinacion = new Map<string, Fila[]>();
  for (const fila of filas) {
    const clave = fila.coord_codigo ?? "";
    porCoordinacion.set(clave, [...(porCoordinacion.get(clave) ?? []), fila]);
  }
  return (
    <div className="space-y-8">
      {[...porCoordinacion].map(([coordinacion, filasCoordinacion]) => (
        <ArbolCoordinacion key={coordinacion} filas={filasCoordinacion} />
      ))}
    </div>
  );
}

/** Árbol de una coordinación: su ficha y una rama por sección, sin repetidos. */
function ArbolCoordinacion({ filas }: Readonly<{ filas: readonly Fila[] }>) {
  const co = filas[0];
  if (!co) return null;
  const transbordos = unicos(filas, (f) => f.transbordo_correlativo).sort(
    ([a], [b]) => Number(a) - Number(b),
  );
  const seguimientos = unicos(filas, (f) => f.seguimiento_correlativo);
  const contenedores = unicos(filas, (f) => f.numero_contenedor);
  const subcoordinaciones = unicos(filas, (f) =>
    f.coordinacion ? `${f.coordinacion}|${f.doc_embarque ?? ""}` : null,
  );
  const lugar = (...partes: (string | null)[]) => partes.filter(Boolean).join(" / ") || null;

  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-4 rounded-lg border p-4">
        <p className="text-lg font-semibold">Coordinación {co.coord_codigo}</p>
        <Datos
          items={[
            ["Consignatario", co.consignatario],
            ["House BL", co.house_bl],
            ["Master BL", co.master_bl],
            ["Booking", co.booking],
            ["Orden de compra", co.orden_compra],
            ["Carrier", co.carrier],
            ["Buque", co.master_buque],
            [
              "Origen (país / ciudad / puerto)",
              lugar(co.pais_coordinacion, co.ciudad_origen, co.puerto_origen),
            ],
            [
              "Destino (país / ciudad / puerto)",
              lugar(co.pais_destino, co.ciudad_destino, co.puerto_destino),
            ],
            ["ETD", fecha(co.etd)],
            ["ATD", fecha(co.atd)],
            ["ETA", fecha(co.eta)],
            ["ATA", fecha(co.ata)],
          ]}
        />
      </div>

      <Rama titulo="Itinerario / transbordos" cantidad={transbordos.length}>
        <ol className="space-y-4">
          {transbordos.map(([clave, t]) => (
            <li key={clave} className="space-y-2 border-l-2 border-primary pl-3">
              <p className="font-medium">
                {clave}. {t.transbordo_itinerario ?? "—"} · {fechaHora(t.transbordo_fecha) ?? "—"}
              </p>
              <Datos
                items={[
                  ["Vessel", t.transbordo_vessel],
                  ["Viaje", t.transbordo_viaje],
                  ["Ciudad de salida", t.transbordo_ciudad_salida],
                  ["Nueva ETA", fecha(t.coord_eta)],
                  ["ETA", fecha(t.transbordo_eta)],
                  ["ATA", fecha(t.transbordo_ata)],
                  ["ETD", fecha(t.transbordo_etd)],
                  ["ATD", fecha(t.transbordo_atd)],
                ]}
              />
            </li>
          ))}
        </ol>
      </Rama>

      <Rama titulo="Seguimientos" cantidad={seguimientos.length}>
        <ol className="space-y-3">
          {seguimientos.map(([clave, s]) => (
            <li key={clave} className="border-l-2 border-primary pl-3">
              <p className="text-xs text-muted-foreground">
                {fechaHora(s.seguimiento_fecha) ?? "—"} · {s.seguimiento_usuario ?? "—"} ·{" "}
                {s.seguimiento_tipo ?? "—"}
              </p>
              <p className="whitespace-pre-wrap">{s.seguimiento_comentario || "—"}</p>
            </li>
          ))}
        </ol>
      </Rama>

      <Rama titulo="Contenedores" cantidad={contenedores.length}>
        <ul className="flex flex-wrap gap-2">
          {contenedores.map(([clave]) => (
            <li key={clave} className="rounded-md border px-2 py-1 font-medium">
              {clave}
            </li>
          ))}
        </ul>
      </Rama>

      <Rama titulo="Subcoordinaciones" cantidad={subcoordinaciones.length}>
        <ul className="space-y-4">
          {subcoordinaciones.map(([clave, s]) => (
            <li key={clave} className="space-y-2 border-l-2 border-primary pl-3">
              <p className="font-medium">Coordinación {s.coordinacion}</p>
              <Datos
                items={[
                  ["Doc. embarque", s.doc_embarque],
                  ["Proveedor origen", s.proveedor_origen],
                  ["Orden de compra", s.orden_compra_1],
                  ["Coordinación relacionada", s.coord_rel_codigo],
                  ["ETD", fecha(s.etd_1)],
                  ["ATD", fecha(s.atd_1)],
                  ["ETA", fecha(s.eta_1)],
                  ["ATA", fecha(s.ata_1)],
                ]}
              />
            </li>
          ))}
        </ul>
      </Rama>
    </div>
  );
}

export const reporteDetalleEmbarque = definirReporte<Fila>({
  nomenclatura: "EMB-DE-03",
  descripcion: "Detalle de la coordinación: itinerario, seguimientos, contenedores y más",
  fechas: "ninguna",
  filtros: [
    { id: "coord_codigo", label: "Coordinación", texto: true },
    { id: "booking", label: "Booking", texto: true },
    { id: "contenedor", label: "Contenedor", texto: true },
  ],
  empresaCentroCosto: false,
  agrupado: false,
  consultar: consultarApi("/api/appweb/reporte-emb-detalle-embarque", filaSchema),
  columnas,
  descargas: { excel: true },
  Contenido: DetalleEmbarque,
});
