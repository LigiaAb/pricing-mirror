"use client";

import { Eye, ListRestart, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { useContextoOperativoStore } from "@/features/shell";
import { DataTable, DataTableColumnHeader } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
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
  type PlantillaCliente,
  useActualizarPlantillaCliente,
  useEliminarPlantillaCliente,
  useInsertarPlantillaCliente,
  usePlantillasCliente,
} from "../api/plantillas-clientes";
import { RubrosPlantilla } from "./rubros-plantilla";

type Id = string | number;
type RecordUnknown = Record<string, unknown>;
const isRecord = (value: unknown): value is RecordUnknown =>
  typeof value === "object" && value !== null;
const idContexto = (value: unknown, keys: string[]): Id | null => {
  if (typeof value === "string" || typeof value === "number") return value;
  if (!isRecord(value)) return null;
  for (const key of ["value", ...keys])
    if (typeof value[key] === "string" || typeof value[key] === "number") return value[key] as Id;
  return null;
};
const lista = (value: unknown): RecordUnknown[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];
const opciones = (value: unknown): OpcionFormularioCotizacion[] =>
  lista(value).flatMap((item) => {
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
    const label =
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
    return [{ ...item, value: optionValue, label: String(label) } as OpcionFormularioCotizacion];
  });
const label = (items: OpcionFormularioCotizacion[], value: unknown) =>
  items.find((item) => String(item.value) === String(value))?.label ?? "";

type Fila = PlantillaCliente & {
  cliente: string;
  transporte: string;
  servicio: string;
  pago: string;
};

export function GestionPlantillasClientes() {
  const empresaRaw = useContextoOperativoStore((state) => state.currentEmpresa);
  const ccRaw = useContextoOperativoStore((state) => state.currentCentroCosto);
  const paisRaw = useContextoOperativoStore((state) => state.currentPais);
  const usuarioRaw = useAuthStore((state) => state.user);
  const codEmpresa = idContexto(empresaRaw, ["cod_empresa", "empresaId"]);
  const codCc = idContexto(ccRaw, ["cod_cc", "centroCostoId"]);
  const codPais = idContexto(paisRaw, ["cod_pais", "paisId"]);
  const codUsuario = idContexto(usuarioRaw, ["cod_usuario"]);
  const { catalogos, isLoading: cargandoCatalogos } = useCatalogosTarifas({});

  const tiposPuntoEnlace = React.useMemo(
    () => opciones(catalogos.tiposPuntoEnlace),
    [catalogos.tiposPuntoEnlace],
  );
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
      tiposPuntoEnlace,
      puntosEnlace: opciones(catalogos.puntosEnlace),
      ciudades: opciones(catalogos.ciudades),
      proveedores: opciones(catalogos.proveedores),
    }),
    [catalogos, tiposPuntoEnlace],
  );

  const [filtros, setFiltros] = React.useState<Record<string, unknown>>({
    cod_empresa: codEmpresa,
    cod_cc: codCc,
  });
  const consulta = usePlantillasCliente(filtros);
  const insertar = useInsertarPlantillaCliente();
  const actualizar = useActualizarPlantillaCliente();
  const eliminar = useEliminarPlantillaCliente();
  const [seleccionada, setSeleccionada] = React.useState<PlantillaCliente | null>(null);
  const [nueva, setNueva] = React.useState(false);

  const data = React.useMemo<Fila[]>(
    () =>
      (consulta.data ?? [])
        .filter((item) => Number(item.cod_estado ?? 1) !== 2)
        .map((item) => ({
          ...item,
          cliente: String(item.entidad_nombre ?? item.entidad_id ?? ""),
          transporte: label(catalogosFormulario.tiposTransporte ?? [], item.cod_tipo_transporte),
          servicio: label(catalogosFormulario.tiposServicio ?? [], item.cod_tipo_servicio),
          pago: label(catalogosFormulario.tiposPago ?? [], item.cod_tipo_pago),
        })),
    [consulta.data, catalogosFormulario],
  );

  const handleGuardar = async (payload: CotizacionCabeceraPayload) => {
    if (nueva) {
      const id = await insertar.mutateAsync({ ...payload, cod_estado: payload.cod_estado ?? 1 });
      setSeleccionada({ ...payload, cod_tarifaplantilla: id } as PlantillaCliente);
      setNueva(false);
    } else if (seleccionada) {
      await actualizar.mutateAsync({
        ...payload,
        cod_tarifaplantilla: seleccionada.cod_tarifaplantilla,
      });
      setSeleccionada({
        ...seleccionada,
        ...payload,
        cod_tarifaplantilla: seleccionada.cod_tarifaplantilla,
      });
    }
  };

  const columns = React.useMemo<ColumnDef<Fila>[]>(
    () => [
      {
        accessorKey: "cod_tarifaplantilla",
        header: ({ column }) => <DataTableColumnHeader column={column} title="#" />,
      },
      {
        accessorKey: "descripcion",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Descripción" />,
      },
      {
        accessorKey: "cliente",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
      },
      {
        accessorKey: "transporte",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Transporte" />,
      },
      {
        accessorKey: "servicio",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Servicio" />,
      },
      {
        accessorKey: "pago",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Pago" />,
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Ver plantilla"
              onClick={() => {
                setSeleccionada(row.original);
                setNueva(false);
              }}
            >
              <Eye className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Eliminar plantilla"
              onClick={() =>
                void eliminar
                  .mutateAsync({ ...row.original, cod_estado: 2 })
                  .then(() => setSeleccionada(null))
              }
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [eliminar],
  );

  if (cargandoCatalogos)
    return <p className="p-4 text-sm text-muted-foreground">Cargando catálogos…</p>;

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-4 text-lg font-semibold">Filtros de plantillas de clientes</h2>
        <CotizacionForm
          tipoFormulario="filtro"
          catalogos={catalogosFormulario}
          resetKey="filtro-plantillas"
          groupsToHide={["carga"]}
          inputsToHide={[
            "fecha",
            "descripcion",
            "contacto",
            "tipoCarga",
            "clasificacionCarga",
            "tipoPuntoEnlaceOrigen",
            "tipoPuntoEnlaceDestino",
            "carrier",
          ]}
          currentEmpresaId={codEmpresa}
          currentCentroCostoId={codCc}
          currentPaisId={codPais}
          codUsuario={codUsuario}
          codEstadoActivo={1}
          onSubmit={(payload) =>
            setFiltros(
              Object.fromEntries(
                [
                  "cod_empresa",
                  "cod_cc",
                  "entidad_id",
                  "cod_pais_origen",
                  "cod_puntoenlace_origen",
                  "cod_pais_destino",
                  "cod_puntoenlace_destino",
                  "cod_tipo_pago",
                ]
                  .map((key) => [key, payload[key]])
                  .filter(([, value]) => value != null),
              ),
            )
          }
        />
      </section>
      <DataTable
        title="Plantillas de clientes"
        columns={columns}
        data={data}
        searchKeys={["descripcion", "cliente"]}
        onRefresh={() => void consulta.refetch()}
        isRefreshing={consulta.isFetching}
        isLoading={consulta.isLoading}
        extraActions={
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setSeleccionada(null);
                setNueva(false);
              }}
            >
              <ListRestart className="size-4" />
              Limpiar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setNueva(true);
                setSeleccionada({
                  cod_tarifaplantilla: 0,
                  cod_empresa: codEmpresa,
                  cod_cc: codCc,
                  cod_estado: 1,
                } as PlantillaCliente);
              }}
            >
              <Plus className="size-4" />
              Nueva
            </Button>
          </>
        }
      />
      {seleccionada ? (
        <Tabs defaultValue="informacion" className="rounded-lg border bg-card p-4">
          <TabsList>
            <TabsTrigger value="informacion">Información</TabsTrigger>
            <TabsTrigger value="rubros" disabled={nueva}>
              Rubros Due Agent
            </TabsTrigger>
          </TabsList>
          <TabsContent value="informacion">
            <CotizacionForm
              tipoFormulario={nueva ? "ingreso" : "edicion"}
              defaultValues={seleccionada as CotizacionCabeceraPayload}
              catalogos={catalogosFormulario}
              resetKey={`${nueva ? "nueva" : seleccionada.cod_tarifaplantilla}`}
              inputsToHide={["fecha", "empresa", "centroCosto", "estacion", "contacto_estacion"]}
              currentEmpresaId={codEmpresa}
              currentCentroCostoId={codCc}
              currentPaisId={codPais}
              codUsuario={codUsuario}
              codEstadoActivo={1}
              isSubmitting={insertar.isPending || actualizar.isPending}
              onSubmit={handleGuardar}
            />
          </TabsContent>
          <TabsContent value="rubros">
            {!nueva && (
              <RubrosPlantilla
                codTarifaPlantilla={seleccionada.cod_tarifaplantilla}
                servicios={catalogos.servicios}
                rubros={catalogos.rubros}
              />
            )}
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}
