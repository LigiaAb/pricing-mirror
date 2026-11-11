"use client";

import { Book, CheckCircle2, Download, FileSpreadsheet, Loader2, Plane, SearchIcon, Send, Ship, Truck, XCircle } from "lucide-react";
import * as React from "react";

import { centrosCosto, ciudades, empresas, paises } from "@/features/catalogos";
import { useContextoOperativoStore } from "@/features/shell";
import { Alert } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

import { type CargaMasivaFleteExitosa, type MetodoCargaFlete, useCargarFletesMasivos } from "../api/carga-masiva-fletes";
import { descargarPlantillaFletes, descargarReporteFletes } from "../lib/plantillas-fletes";
import { Tooltip } from "@/shared/components/ui/tooltip";
import { Separator } from "@/shared/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
import { ArbolAccesos } from "@/features/accesos/components/estructura/arbol-accesos";

type Id = string | number;
type UnknownRecord = Record<string, unknown>;

type Opcion = {
  value: Id;
  label: string;
  codEmpresa?: Id | null;
};

const EXCEL_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function obtenerId(value: unknown, keys: string[]): Id | null {
  if (typeof value === "string" || typeof value === "number") return value;
  if (!isRecord(value)) return null;

  for (const key of ["value", ...keys]) {
    const candidate = value[key];
    if (typeof candidate === "string" || typeof candidate === "number") return candidate;
  }

  return null;
}

function mismoId(a: unknown, b: unknown) {
  return a != null && b != null && String(a) === String(b);
}

function opcionesEmpresa(value: unknown): Opcion[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).flatMap((item) => {
    const id = item.cod_empresa ?? item.value;
    if (typeof id !== "string" && typeof id !== "number") return [];

    return [{ value: id, label: String(item.nombre_emp ?? item.label ?? id) }];
  });
}

function opcionesCentroCosto(value: unknown): Opcion[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).flatMap((item) => {
    const id = item.codCc ?? item.cod_cc ?? item.value;
    if (typeof id !== "string" && typeof id !== "number") return [];

    const codEmpresa = item.codEmpresaCc ?? item.cod_empresa ?? item.cod_emp ?? null;

    return [
      {
        value: id,
        label: String(item.nombreCc ?? item.nombre_cc ?? item.label ?? id),
        codEmpresa: typeof codEmpresa === "string" || typeof codEmpresa === "number" ? codEmpresa : null,
      },
    ];
  });
}

function mensajeCompletado(item: CargaMasivaFleteExitosa) {
  return {
    fila: item.FILA,
    mensaje: `Servicio ${item.SERVICIO} ${item.ACTUALIZADO ? "actualizado" : "insertado"} correctamente.`,
  };
}

function ArchivoExcel({
  id,
  label,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: File | null;
  disabled: boolean;
  onChange: (file: File | null) => void;
}) {
  return (
    <label htmlFor={id} className="block space-y-2 rounded-lg border bg-background p-4">
      <span className="flex items-center gap-2 text-sm font-medium">
        <FileSpreadsheet className="size-4 text-emerald-600" aria-hidden="true" />
        {label} <span className="text-destructive">*</span>
      </span>
      <Input id={id} type="file" accept={`${EXCEL_MIME},.xlsx`} disabled={disabled} onChange={(event) => onChange(event.target.files?.[0] ?? null)} />
      <span className="block truncate text-xs text-muted-foreground">{value?.name ?? "Seleccione un archivo .xlsx"}</span>
    </label>
  );
}

function ResultadosCarga({ completados, errores }: { completados: CargaMasivaFleteExitosa[]; errores: string[] }) {
  const fechaReporte = React.useMemo(() => Math.floor(Date.now() / 1000), []);
  const mensajesCompletados = React.useMemo(() => completados.map(mensajeCompletado), [completados]);

  return (
    <section className="space-y-4">
      {errores.length > 0 ? (
        <Alert variant="destructive" className="flex items-center gap-2">
          <XCircle className="size-4" aria-hidden="true" />
          <span>Han ocurrido errores durante la carga masiva.</span>
        </Alert>
      ) : (
        <Alert className="flex items-center gap-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          <span>Carga masiva de flete completada exitosamente sin errores.</span>
        </Alert>
      )}

      {completados.length > 0 ? (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <h3 className="font-semibold">Modificaciones</h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                void descargarReporteFletes({
                  encabezado: "Modificaciones",
                  filas: mensajesCompletados.map((item) => `Fila ${item.fila}: ${item.mensaje}`),
                  nombre: `reporte_carga_fletes_${fechaReporte}`,
                })
              }
            >
              <Download className="size-4" aria-hidden="true" />
              Descargar
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fila</TableHead>
                <TableHead>Modificaciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mensajesCompletados.map((mensaje) => {
                // formato de mensaje: "Fila x: Mensaje"
                const fila = mensaje.fila;
                const msg = mensaje.mensaje;

                return (
                  <TableRow key={fila}>
                    <TableCell>{fila}</TableCell>
                    <TableCell>{msg}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}

      {errores.length > 0 ? (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <h3 className="font-semibold">Errores de carga</h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                void descargarReporteFletes({
                  encabezado: "Errores de Carga",
                  filas: errores,
                  nombre: `reporte_errores_carga_fletes_${fechaReporte}`,
                })
              }
            >
              <Download className="size-4" aria-hidden="true" />
              Descargar
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fila</TableHead>
                <TableHead>Errores de carga</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errores.map((error) => {
                // formato de mensaje: "Final x: Mensaje"
                const fila = error.match(/Fila (\d+)/)?.[1] ?? "Desconocida";
                const mensaje = error.match(/: (.+)/)?.[1] ?? "Desconocido";

                return (
                  <TableRow key={error}>
                    <TableCell>{fila}</TableCell>
                    <TableCell>{mensaje}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </section>
  );
}

export function CargaMasivaFletes() {
  const empresaContexto = useContextoOperativoStore((state) => state.currentEmpresa);
  const centroCostoContexto = useContextoOperativoStore((state) => state.currentCentroCosto);
  const empresasQuery = empresas.useLista({ cod_estado: 1 });
  const centrosCostoQuery = centrosCosto.useLista({ cod_estado: 1 });
  const cargarMutation = useCargarFletesMasivos();

  const empresaInicial = obtenerId(empresaContexto, ["cod_empresa", "empresaId"]);
  const centroCostoInicial = obtenerId(centroCostoContexto, ["cod_cc", "centroCostoId"]);

  const { data: listaPaises } = paises.useLista({ cod_estado: 1 });
  const { data: listaCiudades } = ciudades.useLista({ cod_estado: 1 });
  const [terminoBusqueda, setTerminoBusqueda] = React.useState<string | null>(null);
  const [mostrarCatalogos, setMostrarCatalogos] = React.useState(false);
  const [expandidas, setExpandidas] = React.useState<Set<string>>(new Set());
  const [seleccionada, setSeleccionada] = React.useState<string | null>(null);

  const [metodo, setMetodo] = React.useState<MetodoCargaFlete>("AIRFREIGTH");
  const [codEmpresa, setCodEmpresa] = React.useState<Id | null>(empresaInicial);
  const [codCentroCosto, setCodCentroCosto] = React.useState<Id | null>(centroCostoInicial);
  const [archivoCosto, setArchivoCosto] = React.useState<File | null>(null);
  const [archivoVenta, setArchivoVenta] = React.useState<File | null>(null);
  const [resultado, setResultado] = React.useState<{
    completados: CargaMasivaFleteExitosa[];
    errores: string[];
  } | null>(null);
  const [errorGeneral, setErrorGeneral] = React.useState<string | null>(null);

  const opcionesEmpresas = React.useMemo(() => opcionesEmpresa(empresasQuery.data), [empresasQuery.data]);
  const opcionesCentrosCosto = React.useMemo(
    () => opcionesCentroCosto(centrosCostoQuery.data).filter((item) => item.codEmpresa == null || codEmpresa == null || mismoId(item.codEmpresa, codEmpresa)),
    [centrosCostoQuery.data, codEmpresa],
  );
  React.useEffect(() => {
    setCodEmpresa(empresaInicial);
    setCodCentroCosto(centroCostoInicial);
  }, [empresaInicial, centroCostoInicial]);

  const limpiarResultados = React.useCallback(() => {
    setResultado(null);
    setErrorGeneral(null);
  }, []);

  const puedeEnviar = codEmpresa != null && codCentroCosto != null && archivoVenta != null && (metodo === "LANDFREIGTH" || archivoCosto != null);

  const handleSubmit = React.useCallback(async () => {
    if (!puedeEnviar || codEmpresa == null || codCentroCosto == null || !archivoVenta) return;

    limpiarResultados();

    try {
      const response = await cargarMutation.mutateAsync({
        codEmpresa,
        codCentroCosto,
        metodo,
        costo: metodo === "AIRFREIGTH" ? archivoCosto : null,
        venta: archivoVenta,
      });

      console.log("handleSubmit response", { response });

      const errores = response.errores ?? ["La carga masiva no pudo completarse."];

      setResultado({
        completados: response.completados,
        errores,
      });
    } catch (error) {
      setErrorGeneral(error instanceof Error ? error.message : "No fue posible realizar la carga masiva.");
    }
  }, [puedeEnviar, codEmpresa, codCentroCosto, archivoVenta, cargarMutation, metodo, archivoCosto, limpiarResultados]);

  const isLoadingCatalogos = empresasQuery.isLoading || centrosCostoQuery.isLoading;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Carga masiva de fletes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Descargue la plantilla correspondiente, complétela y cargue los archivos de tarifas.</p>
      </div>

      <Tabs
        value={metodo}
        onValueChange={(value) => {
          setMetodo(value as MetodoCargaFlete);
          limpiarResultados();
        }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="AIRFREIGTH">
              <Plane className="size-4" aria-hidden="true" />
              Aéreo
            </TabsTrigger>
            <TabsTrigger value="LANDFREIGTH">
              <Truck className="size-4" aria-hidden="true" />
              Terrestre
            </TabsTrigger>
            <Tooltip>
              <TabsTrigger value="MARITIMO" disabled>
                <Ship className="size-4" aria-hidden="true" />
                Marítimo
              </TabsTrigger>
            </Tooltip>
          </TabsList>
          <Button onClick={() => setMostrarCatalogos(true)} variant="outline" size="sm">
            <Book className="size-5" aria-hidden="true" />
            <span>Catalogo de Código</span>
          </Button>
        </div>

        {(["AIRFREIGTH", "LANDFREIGTH"] as const).map((tabMetodo) => (
          <TabsContent key={tabMetodo} value={tabMetodo} className="space-y-4">
            <section className="space-y-5 rounded-lg border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Fletes {tabMetodo === "AIRFREIGTH" ? "aéreos" : "terrestres"}</h2>
                  <p className="text-sm text-muted-foreground">Los archivos admitidos deben tener formato Excel `.xlsx`.</p>
                </div>
                <Button type="button" variant="outline" onClick={() => void descargarPlantillaFletes(tabMetodo)}>
                  <Download className="size-4" aria-hidden="true" />
                  Descargar plantilla
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  <span>
                    Empresa <span className="text-destructive">*</span>
                  </span>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                    value={codEmpresa == null ? "" : String(codEmpresa)}
                    disabled={isLoadingCatalogos || cargarMutation.isPending}
                    onChange={(event) => {
                      const nextEmpresa = event.target.value || null;
                      setCodEmpresa(nextEmpresa);
                      setCodCentroCosto(null);
                      limpiarResultados();
                    }}
                  >
                    <option value="">Seleccione una empresa</option>
                    {opcionesEmpresas.map((item) => (
                      <option key={String(item.value)} value={String(item.value)}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm font-medium">
                  <span>
                    Centro de costo <span className="text-destructive">*</span>
                  </span>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                    value={codCentroCosto == null ? "" : String(codCentroCosto)}
                    disabled={codEmpresa == null || isLoadingCatalogos || cargarMutation.isPending}
                    onChange={(event) => {
                      setCodCentroCosto(event.target.value || null);
                      limpiarResultados();
                    }}
                  >
                    <option value="">Seleccione un centro de costo</option>
                    {opcionesCentrosCosto.map((item) => (
                      <option key={String(item.value)} value={String(item.value)}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className={`grid gap-4 ${tabMetodo === "AIRFREIGTH" ? "md:grid-cols-2" : ""}`}>
                {tabMetodo === "AIRFREIGTH" ? (
                  <ArchivoExcel
                    id="archivo-costo-aereo"
                    label="Tarifas costo"
                    value={archivoCosto}
                    disabled={cargarMutation.isPending}
                    onChange={(file) => {
                      setArchivoCosto(file);
                      limpiarResultados();
                    }}
                  />
                ) : null}
                <ArchivoExcel
                  id={`archivo-venta-${tabMetodo}`}
                  label="Tarifas venta"
                  value={archivoVenta}
                  disabled={cargarMutation.isPending}
                  onChange={(file) => {
                    setArchivoVenta(file);
                    limpiarResultados();
                  }}
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                {resultado || errorGeneral ? (
                  <Button type="button" variant="outline" onClick={limpiarResultados}>
                    Limpiar resultado
                  </Button>
                ) : null}
                <Button type="button" disabled={!puedeEnviar || cargarMutation.isPending} onClick={() => void handleSubmit()}>
                  {cargarMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
                  Enviar
                </Button>
              </div>
            </section>
          </TabsContent>
        ))}
      </Tabs>

      <Separator />

      <Sheet open={mostrarCatalogos} onOpenChange={setMostrarCatalogos}>
        <SheetContent side="right" className="modal-solicitud-hero w-full overflow-y-auto border-l bg-card p-0 sm:max-w-2xl rounded-l-3xl">
          <SheetHeader className="border-b bg-muted px-4 py-5 pr-12 sm:px-6 sm:py-6 sm:pr-14 sticky top-0 z-10">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Book className="size-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <SheetTitle>Catalogos</SheetTitle>
                <SheetDescription>En esta sección se muestran los catalogos disponibles.</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          {/* <div className="space-y-5 p-4 sm:space-y-6 sm:p-6 overflow-auto">
            <div className="flex items-center gap-2">
              <span className="font-medium w-20">Países:</span>
              <Input type="text" value={terminoBusqueda ?? ""} className="w-full" onChange={(e) => setTerminoBusqueda(e.target.value)} />
            </div>
          </div>
          <Arbol
            raices={(listaPaises ?? [])
              .filter((pais) => `${pais.nombre_pais ?? ""}`.toLowerCase().includes(terminoBusqueda?.toLowerCase() ?? ""))
              .map((pais) => ({
                ...pais,
                clave: `pais:${pais.cod_pais}`,
                nombre: `${pais.ref_pais_2}: ${pais.nombre_pais ?? ""}`,
                hijos: (listaCiudades ?? [])
                  .filter((ciudad) => String(ciudad.cod_pais) === String(pais.cod_pais))
                  .map((ciudad) => ({
                    ...ciudad,
                    clave: `pais:${pais.cod_pais}/ciudad:${ciudad.cod_ciudad}`,
                    nombre: `${ciudad.siglas_ciudad}: ${ciudad.nombre_ciudad ?? ""}`,
                    hijos: [],
                  })),
              }))}
            expandidas={expandidas}
            seleccionada={seleccionada}
            onAlternar={(clave) => {
              setExpandidas((actuales) => {
                const nuevas = new Set(actuales);

                if (nuevas.has(clave)) {
                  nuevas.delete(clave);
                } else {
                  nuevas.add(clave);
                }

                return nuevas;
              });
            }}
            onSeleccionar={setSeleccionada}
          />
          <pre>
            {JSON.stringify(
              listaPaises?.filter((i) => `${i.nombre_pais ?? ""}`.toLowerCase().includes(terminoBusqueda?.toLowerCase() ?? "")),
              null,
              2,
            )}
          </pre>
          <pre>{JSON.stringify(listaCiudades, null, 2)}</pre> */}
        </SheetContent>
      </Sheet>

      {cargarMutation.isPending ? (
        <Alert className="flex items-start gap-3">
          <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" aria-hidden="true" />
          <div>
            <p className="font-medium">Cargando</p>
            <p className="text-sm text-muted-foreground">Esto puede demorar unos minutos. Por favor, no cierre la pestaña.</p>
          </div>
        </Alert>
      ) : null}

      {errorGeneral ? <Alert variant="destructive">{errorGeneral}</Alert> : null}

      {resultado ? <ResultadosCarga completados={resultado.completados} errores={resultado.errores} /> : null}
    </div>
  );
}

export default CargaMasivaFletes;
