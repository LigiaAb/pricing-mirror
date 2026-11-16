"use client";

/* ==========================================================================
 * CATÁLOGO DE CÓDIGOS (sheet lateral de Carga masiva de fletes)
 *
 * Los códigos del sistema no son los oficiales (ISO / IATA). Aquí el usuario
 * consulta y copia el código que debe escribir en la plantilla de Excel.
 *
 * - "Países y ciudades": al elegir un país se listan sus ciudades.
 * - "Puntos de enlace": aeropuertos y puertos (tipo de punto = catálogo
 *   `tipos` con tipo_tabla PUNTO_ENLACE).
 *
 * Qué campo se copia como "código" está definido en un solo lugar
 * (`aFilaPais`, `aFilaCiudad`, `aFilaPuntoEnlace`).
 * ========================================================================== */

import { Check, Copy, SearchIcon } from "lucide-react";
import * as React from "react";

import { ciudades, paises, puntosEnlace, tipos } from "@/features/catalogos";
import { Input } from "@/shared/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

import type { MetodoCargaFlete } from "../api/carga-masiva-fletes";

type UnknownRecord = Record<string, unknown>;

/** Fila normalizada de cualquier catálogo del sheet. */
type FilaCatalogo = {
  /** Código del sistema: lo que se escribe en la plantilla. */
  codigo: string;
  /** Código oficial / de referencia (ISO, siglas), solo para orientar la búsqueda. */
  referencia: string;
  nombre: string;
};

type FilaPais = FilaCatalogo & { codPais: string };
type FilaCiudad = FilaCatalogo & { codPais: string };

/** Máximo de filas visibles por tabla; con búsqueda se llega al resto. */
const MAX_FILAS = 200;

type GrupoPuntoEnlace = {
  /** nom_tipo del tipo de punto de enlace (tipo_tabla PUNTO_ENLACE). */
  tipoPunto: string;
  titulo: string;
  /** Columnas de la plantilla que usan este catálogo (vacío = aún sin plantilla). */
  columnas: Partial<Record<MetodoCargaFlete, string>>;
};

const GRUPOS_PUNTO_ENLACE: readonly GrupoPuntoEnlace[] = [
  { tipoPunto: "AEROPUERTO", titulo: "Aeropuertos", columnas: { AIRFREIGTH: "ORIGEN CODIGO IATA / DESTINO CODIGO IATA" } },
  { tipoPunto: "PUERTO", titulo: "Puertos", columnas: {} },
];

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function texto(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function registros(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function aFilaPais(item: UnknownRecord): FilaPais | null {
  const codigo = texto(item.cod_pais ?? item.codPais);
  if (!codigo) return null;

  return {
    codigo,
    codPais: codigo,
    referencia: texto(item.ref_pais_2 ?? item.refPais2 ?? item.ref_pais ?? item.refPais),
    nombre: texto(item.nombre_pais ?? item.nombrePais),
  };
}

function aFilaCiudad(item: UnknownRecord): FilaCiudad | null {
  const codigo = texto(item.cod_ciudad ?? item.codCiudad);
  if (!codigo) return null;

  return {
    codigo,
    codPais: texto(item.cod_pais ?? item.codPais),
    referencia: texto(item.siglas_ciudad ?? item.siglasCiudad),
    nombre: texto(item.nombre_ciudad ?? item.nombreCiudad),
  };
}

function aFilaPuntoEnlace(item: UnknownRecord): (FilaCatalogo & { codTipo: string }) | null {
  const codigo = texto(item.cod_puntoenlace ?? item.codPuntoenlace ?? item.value);
  if (!codigo) return null;

  return {
    codigo,
    codTipo: texto(item.cod_tipo ?? item.codTipo ?? item.cod_tipo_puntoenlace),
    referencia: "",
    nombre: texto(item.nombre ?? item.label),
  };
}

function normalizarBusqueda(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function filtrar<T extends FilaCatalogo>(filas: readonly T[], busqueda: string): T[] {
  const termino = normalizarBusqueda(busqueda);
  if (!termino) return [...filas];

  return filas.filter((fila) => normalizarBusqueda(`${fila.codigo} ${fila.referencia} ${fila.nombre}`).includes(termino));
}

function ordenarPorNombre<T extends FilaCatalogo>(filas: T[]): T[] {
  return filas.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

function useCopiar() {
  const [copiado, setCopiado] = React.useState<string | null>(null);
  const timeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    [],
  );

  const copiar = React.useCallback(async (clave: string, valor: string) => {
    try {
      await navigator.clipboard.writeText(valor);
    } catch {
      return;
    }

    setCopiado(clave);
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setCopiado(null), 1500);
  }, []);

  return { copiado, copiar };
}

function BotonCopiar({ copiado, onCopiar, codigo }: { copiado: boolean; onCopiar: () => void; codigo: string }) {
  return (
    <button
      type="button"
      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      title={copiado ? "Copiado" : `Copiar código ${codigo}`}
      aria-label={copiado ? "Copiado" : `Copiar código ${codigo}`}
      onClick={(event) => {
        event.stopPropagation();
        onCopiar();
      }}
    >
      {copiado ? <Check className="size-4 text-emerald-600" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
    </button>
  );
}

function Buscador({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input type="search" value={value} placeholder={placeholder} className="pl-9" onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value)} />
    </div>
  );
}

function TablaCodigos<T extends FilaCatalogo>({
  filas,
  total,
  prefijoClave,
  columnaNombre,
  columnaReferencia,
  isLoading,
  vacio,
  copiado,
  onCopiar,
  seleccionado,
  onSeleccionar,
}: {
  filas: readonly T[];
  total: number;
  prefijoClave: string;
  columnaNombre: string;
  columnaReferencia?: string | undefined;
  isLoading: boolean;
  vacio: string;
  copiado: string | null;
  onCopiar: (clave: string, codigo: string) => void;
  seleccionado?: string | null | undefined;
  onSeleccionar?: ((fila: T) => void) | undefined;
}) {
  const visibles = filas.slice(0, MAX_FILAS);
  const columnas = columnaReferencia ? 4 : 3;

  return (
    <div className="space-y-2">
      <div className="max-h-80 overflow-auto rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-[1] bg-muted">
            <TableRow>
              <TableHead className="w-12" />
              <TableHead className="w-28">Código</TableHead>
              {columnaReferencia ? <TableHead className="w-28">{columnaReferencia}</TableHead> : null}
              <TableHead>{columnaNombre}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columnas} className="py-6 text-center text-sm text-muted-foreground">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : visibles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnas} className="py-6 text-center text-sm text-muted-foreground">
                  {vacio}
                </TableCell>
              </TableRow>
            ) : (
              visibles.map((fila) => {
                const clave = `${prefijoClave}:${fila.codigo}`;
                const activa = seleccionado != null && seleccionado === fila.codigo;

                return (
                  <TableRow
                    key={clave}
                    data-state={activa ? "selected" : undefined}
                    className={onSeleccionar ? `cursor-pointer ${activa ? "bg-primary/10 hover:bg-primary/15" : ""}` : undefined}
                    onClick={onSeleccionar ? () => onSeleccionar(fila) : undefined}
                  >
                    <TableCell className="py-1.5">
                      <BotonCopiar codigo={fila.codigo} copiado={copiado === clave} onCopiar={() => onCopiar(clave, fila.codigo)} />
                    </TableCell>
                    <TableCell className="font-mono font-semibold">{fila.codigo}</TableCell>
                    {columnaReferencia ? <TableCell className="text-muted-foreground">{fila.referencia || "—"}</TableCell> : null}
                    <TableCell>{fila.nombre || "—"}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {!isLoading && filas.length > MAX_FILAS ? (
        <p className="text-xs text-muted-foreground">
          Mostrando {MAX_FILAS} de {filas.length}. Use la búsqueda para encontrar el resto.
        </p>
      ) : !isLoading && total > 0 ? (
        <p className="text-xs text-muted-foreground">
          {filas.length} de {total} registros.
        </p>
      ) : null}
    </div>
  );
}

function PaisesYCiudades({ copiado, onCopiar }: { copiado: string | null; onCopiar: (clave: string, codigo: string) => void }) {
  const paisesQuery = paises.useLista({ cod_estado: 1 });
  const ciudadesQuery = ciudades.useLista({ cod_estado: 1 });

  const [busquedaPais, setBusquedaPais] = React.useState("");
  const [busquedaCiudad, setBusquedaCiudad] = React.useState("");
  const [codPais, setCodPais] = React.useState<string | null>(null);

  const listaPaises = React.useMemo(
    () => ordenarPorNombre(registros(paisesQuery.data).flatMap((item) => aFilaPais(item) ?? [])),
    [paisesQuery.data],
  );
  const listaCiudades = React.useMemo(
    () => ordenarPorNombre(registros(ciudadesQuery.data).flatMap((item) => aFilaCiudad(item) ?? [])),
    [ciudadesQuery.data],
  );

  const paisSeleccionado = React.useMemo(() => listaPaises.find((pais) => pais.codPais === codPais) ?? null, [listaPaises, codPais]);
  const ciudadesPais = React.useMemo(
    () => (codPais == null ? [] : listaCiudades.filter((ciudad) => ciudad.codPais === codPais)),
    [listaCiudades, codPais],
  );

  const paisesFiltrados = React.useMemo(() => filtrar(listaPaises, busquedaPais), [listaPaises, busquedaPais]);
  const ciudadesFiltradas = React.useMemo(() => filtrar(ciudadesPais, busquedaCiudad), [ciudadesPais, busquedaCiudad]);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold">Países</h3>
          <p className="text-xs text-muted-foreground">Seleccione un país para ver sus ciudades. Columna de la plantilla: CODIGO PAIS.</p>
        </div>
        <Buscador value={busquedaPais} onChange={setBusquedaPais} placeholder="Buscar por código o nombre..." />
        <TablaCodigos
          filas={paisesFiltrados}
          total={listaPaises.length}
          prefijoClave="pais"
          columnaNombre="País"
          columnaReferencia="Ref. oficial"
          isLoading={paisesQuery.isLoading}
          vacio="No se encontraron países."
          copiado={copiado}
          onCopiar={onCopiar}
          seleccionado={codPais}
          onSeleccionar={(pais) => {
            setCodPais(pais.codPais);
            setBusquedaCiudad("");
          }}
        />
      </section>

      <section className="space-y-3 border-t pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold">{paisSeleccionado ? `Ciudades de ${paisSeleccionado.nombre}` : "Ciudades"}</h3>
            <p className="text-xs text-muted-foreground">Columna de la plantilla: CODIGO CIUDAD.</p>
          </div>
          {paisSeleccionado ? (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {paisSeleccionado.codigo} · {paisSeleccionado.nombre}
            </span>
          ) : null}
        </div>

        {paisSeleccionado ? (
          <>
            <Buscador value={busquedaCiudad} onChange={setBusquedaCiudad} placeholder="Buscar ciudad..." />
            <TablaCodigos
              filas={ciudadesFiltradas}
              total={ciudadesPais.length}
              prefijoClave="ciudad"
              columnaNombre="Ciudad"
              columnaReferencia="Siglas"
              isLoading={ciudadesQuery.isLoading}
              vacio="No se encontraron ciudades para este país."
              copiado={copiado}
              onCopiar={onCopiar}
            />
          </>
        ) : (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Seleccione un país en la tabla de arriba para ver sus ciudades.
          </p>
        )}
      </section>
    </div>
  );
}

function SeccionPuntoEnlace({
  grupo,
  metodo,
  filas,
  isLoading,
  copiado,
  onCopiar,
}: {
  grupo: GrupoPuntoEnlace;
  metodo: MetodoCargaFlete;
  filas: readonly FilaCatalogo[];
  isLoading: boolean;
  copiado: string | null;
  onCopiar: (clave: string, codigo: string) => void;
}) {
  const [busqueda, setBusqueda] = React.useState("");
  const filtradas = React.useMemo(() => filtrar(filas, busqueda), [filas, busqueda]);
  const columna = grupo.columnas[metodo];

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">{grupo.titulo}</h3>
        {columna ? <p className="text-xs text-muted-foreground">Columna de la plantilla: {columna}.</p> : null}
      </div>
      <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar por código o nombre..." />
      <TablaCodigos
        filas={filtradas}
        total={filas.length}
        prefijoClave={grupo.tipoPunto}
        columnaNombre="Nombre"
        isLoading={isLoading}
        vacio={`No se encontraron ${grupo.titulo.toLowerCase()}.`}
        copiado={copiado}
        onCopiar={onCopiar}
      />
    </section>
  );
}

function PuntosEnlace({
  metodo,
  copiado,
  onCopiar,
}: {
  metodo: MetodoCargaFlete;
  copiado: string | null;
  onCopiar: (clave: string, codigo: string) => void;
}) {
  const puntosQuery = puntosEnlace.useLista();
  // Misma consulta que useCatalogosPricing: React Query comparte la caché.
  const tiposQuery = tipos.useLista();

  /** nom_tipo (AEROPUERTO / PUERTO) -> cod_tipo */
  const codTipoPorNombre = React.useMemo(() => {
    const mapa = new Map<string, string>();

    for (const item of registros(tiposQuery.data)) {
      if (texto(item.tipo_tabla ?? item.tipoTabla) !== "PUNTO_ENLACE") continue;
      mapa.set(texto(item.nom_tipo ?? item.nomTipo).toUpperCase(), texto(item.cod_tipo ?? item.codTipo));
    }

    return mapa;
  }, [tiposQuery.data]);

  const listaPuntos = React.useMemo(
    () => ordenarPorNombre(registros(puntosQuery.data).flatMap((item) => aFilaPuntoEnlace(item) ?? [])),
    [puntosQuery.data],
  );

  // En aéreo los aeropuertos van primero; en los demás, los puertos.
  const grupos = metodo === "AIRFREIGTH" ? GRUPOS_PUNTO_ENLACE : [...GRUPOS_PUNTO_ENLACE].reverse();
  const isLoading = puntosQuery.isLoading || tiposQuery.isLoading;

  return (
    <div className="space-y-6">
      {grupos.map((grupo, index) => {
        const codTipo = codTipoPorNombre.get(grupo.tipoPunto);
        const filas = codTipo == null ? [] : listaPuntos.filter((punto) => punto.codTipo === codTipo);

        return (
          <div key={grupo.tipoPunto} className={index > 0 ? "border-t pt-5" : undefined}>
            <SeccionPuntoEnlace grupo={grupo} metodo={metodo} filas={filas} isLoading={isLoading} copiado={copiado} onCopiar={onCopiar} />
          </div>
        );
      })}
    </div>
  );
}

/** Contenido del sheet "Catálogo de códigos". Montarlo solo con el sheet abierto: así no consulta de más. */
export function CatalogoCodigos({ metodo }: { metodo: MetodoCargaFlete }) {
  const { copiado, copiar } = useCopiar();
  const onCopiar = React.useCallback((clave: string, codigo: string) => void copiar(clave, codigo), [copiar]);

  return (
    <Tabs defaultValue="paises" className="space-y-5 p-4 sm:p-6">
      <TabsList>
        <TabsTrigger value="paises">Países y ciudades</TabsTrigger>
        <TabsTrigger value="puntos">Aeropuertos y puertos</TabsTrigger>
      </TabsList>
      <TabsContent value="paises">
        <PaisesYCiudades copiado={copiado} onCopiar={onCopiar} />
      </TabsContent>
      <TabsContent value="puntos">
        <PuntosEnlace metodo={metodo} copiado={copiado} onCopiar={onCopiar} />
      </TabsContent>
    </Tabs>
  );
}
