"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CircleDot,
  CircleSlash,
  Factory,
  FileText,
  Flag,
  Globe2,
  Landmark,
  MapPin,
  MessagesSquare,
  Plus,
  Tag,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { type ReactNode, useState } from "react";
import { centrosCosto, empleadosUsuarios, empresas } from "@/features/catalogos";
import { NuevoContactoEntidad, useFetchEntidades } from "@/features/entidades";
import { usePermisosCategoria } from "@/features/shell";
import { DataTable } from "@/shared/components/data-table/data-table";
import { Alert } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Loader } from "@/shared/components/ui/loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { formatearFechaHora } from "@/shared/lib/date";
import { encodeId } from "@/shared/lib/sqids";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import { cn } from "@/shared/lib/utils";
import { useAuthStore } from "@/shared/stores/auth-store";
import { type Actividad, actividades, aPayloadActividad } from "../../api/actividades";
import {
  type ContactoActividad,
  useContactosActividad,
  useInsertarContactoActividad,
} from "../../api/contactos-actividad";
import {
  type ResultadoActividad,
  useInsertarResultado,
  useResultadosActividad,
} from "../../api/resultados";
import { DialogoAgregarResultado } from "./dialogo-agregar-resultado";
import { DialogoSeguimientos } from "./dialogo-seguimientos";
import { VisitingReport } from "./visiting-report";

function CampoDetalle({
  etiqueta,
  valor,
  icono,
  className,
}: Readonly<{ etiqueta: string; valor: ReactNode; icono: ReactNode; className?: string }>) {
  return (
    <div
      className={cn(
        "flex min-h-20 gap-3 rounded-xl border bg-background/70 p-3.5 transition-colors hover:bg-muted/30 items-center",
        className,
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icono}
      </div>
      <div className="min-w-0 space-y-1">
        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {etiqueta}
        </dt>
        <dd className="wrap-anywhere text-sm font-medium leading-5">{valor}</dd>
      </div>
    </div>
  );
}

function Informacion({
  actividad,
  puedeAnular,
  anulando,
  onAnular,
}: Readonly<{
  actividad: Actividad;
  puedeAnular: boolean;
  anulando: boolean;
  onAnular: () => void;
}>) {
  const { data: empresasData = [] } = empresas.useLista();
  const { data: centrosCostoData = [] } = centrosCosto.useLista();
  const { data: empleadosData = [] } = empleadosUsuarios.useLista();
  const empresa = empresasData.find(
    (item) => String(item.cod_empresa) === String(actividad.cod_emp),
  );
  const centroCosto = centrosCostoData.find(
    (item) => String(item.codCc) === String(actividad.cod_cc),
  );
  const creador = empleadosData.find(
    (item) => String(item.codUsuario) === String(actividad.cod_creador),
  );
  const asesor = empleadosData.find(
    (item) => String(item.codUsuario) === String(actividad.cod_asesor),
  );

  return (
    <>
      <dl className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 xl:p-5">
        <CampoDetalle
          etiqueta="Empresa"
          valor={empresa?.nombre_emp || "Sin empresa"}
          icono={<Building2 className="size-4" />}
        />
        <CampoDetalle
          etiqueta="Centro de costo"
          valor={centroCosto?.nombreCc || "Sin centro de costo"}
          icono={<Landmark className="size-4" />}
        />
        <CampoDetalle
          etiqueta="Programada"
          valor={formatearFechaHora(actividad.fecha_programada) || "Sin fecha"}
          icono={<CalendarClock className="size-4" />}
        />
        <CampoDetalle
          etiqueta="Descripción"
          valor={actividad.descripcion || "Sin descripción"}
          icono={<FileText className="size-4" />}
        />
        <CampoDetalle
          etiqueta="Objetivo"
          valor={actividad.objetivo_actividad_desc || "Sin objetivo"}
          icono={<Flag className="size-4" />}
        />
        <CampoDetalle
          etiqueta="Creador"
          valor={creador?.nombreCompleto || "Sin creador"}
          icono={<UserRound className="size-4" />}
        />
        <CampoDetalle
          etiqueta="Asesor"
          valor={asesor?.nombreCompleto || "Sin asesor"}
          icono={<BriefcaseBusiness className="size-4" />}
        />
      </dl>

      {puedeAnular ? (
        <footer className="flex justify-end border-t bg-muted/10 px-4 py-3 sm:px-5">
          <Button variant="destructive" size="sm" disabled={anulando} onClick={onAnular}>
            {anulando ? "Anulando…" : "Anular actividad"}
          </Button>
        </footer>
      ) : null}
    </>
  );
}

function Cliente({ actividad }: Readonly<{ actividad: Actividad }>) {
  const cliente = useFetchEntidades(
    { entidad_id: actividad.cod_cliente, tipo_entidad: "CLIENTE" },
    { enabled: actividad.cod_cliente !== null },
  );
  const datos = cliente.data?.[0];

  if (cliente.isLoading) return <Loader />;

  if (!datos) {
    return (
      <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/10 p-6 text-center">
        <Building2 className="mb-2 size-8 text-muted-foreground/60" />
        <p className="text-sm font-medium">Sin cliente asociado</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Esta actividad no tiene información de cliente para mostrar.
        </p>
      </div>
    );
  }

  return (
    <dl className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 xl:p-5">
      <CampoDetalle
        etiqueta="País"
        valor={datos.nombre_pais || "Sin país"}
        icono={<Globe2 className="size-4" />}
      />
      <CampoDetalle
        etiqueta="Ciudad"
        valor={datos.nombre_ciudad || "Sin ciudad"}
        icono={<MapPin className="size-4" />}
      />
      <CampoDetalle
        etiqueta="Industria"
        valor={datos.nom_industria_es || "Sin industria"}
        icono={<Factory className="size-4" />}
      />
      <CampoDetalle
        etiqueta="Tipo"
        valor={datos.entidad_clasificacion || datos.tipo_descripcion || "Sin tipo"}
        icono={<Tag className="size-4" />}
      />
      <CampoDetalle
        etiqueta="Estado"
        valor={datos.estado_desc || "Sin estado"}
        icono={<CircleDot className="size-4" />}
      />
    </dl>
  );
}

type ColumnsProps = {
  actividad: Actividad;
  onAnular: (row: ResultadoActividad) => void;
};

function columnasResultados(props: ColumnsProps): ColumnDef<ResultadoActividad>[] {
  return [
    { id: "numero", header: "No.", cell: ({ row }) => row.index + 1 },
    {
      id: "tipo",
      header: "Tipo",
      accessorFn: (resultado) => resultado.nom_tipo || resultado.nom_tipo_resultado,
    },
    { accessorKey: "descripcion", header: "Descripción" },
    { accessorKey: "referencia", header: "Referencia" },
    {
      accessorKey: "fecha_programada",
      header: "Fecha programada",
      cell: ({ row }) =>
        formatearFechaHora(row.original.fecha_programada || row.original.fecha_creada),
    },
    // { id: "guardado", header: "¿Guardado?", cell: () => "Sí" },
    {
      id: "acciones",
      cell: ({ row }) => (
        <>
          {props.actividad.cod_estado !== 24 && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-destructive"
              onClick={() => props.onAnular(row.original)}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </>
      ),
    },
  ];
}

function Resultados({
  actividad,
  actualizarActividad,
}: Readonly<{
  actividad: Actividad;
  actualizarActividad: UseMutationResult<
    Record<string, unknown>,
    Error,
    Record<string, unknown>,
    unknown
  >;
}>) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const insertar = useInsertarResultado();

  const resultados = useResultadosActividad(Number(actividad.cod_actividad));
  const [resultadosLocal, setResultadosLocal] = useState(
    resultados.data || ([] as ResultadoActividad[]),
  );

  const guardarResultados = () => {
    resultadosLocal.forEach((resultado) => {
      insertar.mutate({ ...resultado, cod_actividad: Number(actividad.cod_actividad) });
    });

    actualizarActividad.mutate({ ...actividad, cod_estado: 24 });
  };

  const columns = React.useMemo(
    () =>
      columnasResultados({
        actividad,
        onAnular: (resultado) =>
          setResultadosLocal((actuales) =>
            actuales.filter((item) => item.cod_resultado !== resultado.cod_resultado),
          ),
      }),
    [actividad],
  );

  if (resultados.isLoading)
    return <p className="text-sm text-muted-foreground">Cargando resultados…</p>;
  return (
    <>
      <VisitingReport clienteId={actividad.cod_cliente} />
      <div className="mt-4" />
      <Alert variant="warning">
        Los resultados ingresados no se guardaran hasta que se de click en "Guardar".
      </Alert>
      <div className="mt-4" />
      <DataTable
        columns={columns}
        data={resultadosLocal.length ? resultadosLocal : (resultados.data ?? [])}
        searchKeys={["descripcion"]}
        searchPlaceholder="Buscar resultado…"
        extraActions={
          resultados.data?.length === 0 && (
            <Button size="sm" onClick={() => setModalAbierto(true)}>
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          )
        }
      />
      <DialogoAgregarResultado
        onGuardado={(resultado) => setResultadosLocal((actuales) => [...actuales, resultado])}
        actividad={actividad}
        abierto={modalAbierto}
        onAbiertoChange={setModalAbierto}
      />
      <div className="mt-4 flex items-center justify-center">
        {!resultados.data?.length && (
          <Button
            className="mx-auto"
            variant={resultadosLocal.length ? "default" : "destructive"}
            disabled={insertar.isPending}
            onClick={() => guardarResultados()}
          >
            {!resultadosLocal.length ? (
              <>
                <CircleSlash className="h-4 w-4" />
                Guardar sin resultados
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Guardar Resultados
              </>
            )}
          </Button>
        )}
      </div>
    </>
  );
}

function tiposContacto(contacto: ContactoActividad) {
  try {
    const tipos: unknown = JSON.parse(contacto.data_entidad_contacto_tipo);
    if (Array.isArray(tipos)) {
      return tipos
        .map((tipo) => {
          if (!tipo || typeof tipo !== "object") return "";
          const datos = tipo as Record<string, unknown>;
          return String(datos.TIPO_DESCRIPCION ?? datos.tipo_descripcion ?? "");
        })
        .filter(Boolean)
        .join(" | ");
    }
  } catch {
    return "";
  }
  return "";
}

function Contactos({ actividad }: Readonly<{ actividad: Actividad }>) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const contactos = useContactosActividad(Number(actividad.cod_actividad));
  const insertar = useInsertarContactoActividad();

  return (
    <div className="space-y-3">
      <Button disabled={actividad.cod_cliente === null} onClick={() => setModalAbierto(true)}>
        Crear contacto
      </Button>
      {contactos.isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando contactos…</p>
      ) : contactos.data?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {contactos.data.map((contacto) => {
            const tipos = tiposContacto(contacto);
            return (
              <article className="rounded-md border p-3 text-sm" key={contacto.entidadcontacto_id}>
                <h2 className="font-medium">{contacto.entidadcontacto_nombre}</h2>
                <p>Email: {contacto.entidadcontacto_email || "Sin correo"}</p>
                <p>Teléfono: {contacto.entidadcontacto_telefono || "Sin teléfono"}</p>
                {tipos && <p>Tipo: {tipos}</p>}
                <p className="text-muted-foreground">{contacto.estado_desc}</p>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No hay contactos asociados.</p>
      )}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear contacto</DialogTitle>
          </DialogHeader>
          {modalAbierto && actividad.cod_cliente !== null && (
            <NuevoContactoEntidad
              entidadId={actividad.cod_cliente}
              onSubmit={async (resultado) => {
                const datos = (resultado as { data?: Record<string, unknown> }).data;
                const contactoId = Number(datos?.entidadcontacto_id);
                if (Number.isSafeInteger(contactoId) && contactoId > 0) {
                  await insertar.mutateAsync({
                    cod_actividad: actividad.cod_actividad,
                    contactos: [contactoId],
                  });
                }
                setModalAbierto(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ActividadDetalle({
  codActividad,
  rutaBase,
}: Readonly<{ codActividad: number; rutaBase: string }>) {
  const router = useRouter();
  const [seguimientosAbiertos, setSeguimientosAbiertos] = useState(false);
  const [tabActiva, setTabActiva] = useState("informacion");
  const permisos = usePermisosCategoria("Información");
  const usuario = useAuthStore((state) => state.user);
  const consulta = actividades.useLista({ cod_actividad: codActividad });
  const actualizarActividad = actividades.useActualizar();
  const actividad = consulta.data?.find((item) => Number(item.cod_actividad) === codActividad);
  const anular = actividades.useActualizar({ meta: { successMessage: "Actividad anulada" } });
  if (consulta.isLoading) return <div>Cargando actividad...</div>;
  if (!actividad) return <div>No se encontró la actividad solicitada.</div>;
  const puedeAnular =
    permisos.puedeAnular &&
    Number(actividad.cod_estado) === 23 &&
    Number(actividad.cod_asesor) === Number(usuario?.cod_usuario);
  const documentoAsociadoId = Number(actividad.cod_documento);
  const esSeguimientoCotizacion = actividad.nom_tipo === "SEGUIMIENTO COTIZACION";
  const puedeVerDocumentoAsociado =
    (Number(actividad.cod_tipo) === 35 || esSeguimientoCotizacion) &&
    Number.isSafeInteger(documentoAsociadoId) &&
    documentoAsociadoId > 0;
  const verDocumentoAsociado = () => {
    const destino = esSeguimientoCotizacion
      ? `/tarifas/cotizacion/solicitud-cotizacion/${encodeId(documentoAsociadoId)}`
      : `/embarques/embarques/cts/${encodeId(documentoAsociadoId)}`;
    router.push(destino);
  };
  const encabezados: Record<string, { icono: ReactNode; titulo: string; descripcion: string }> = {
    informacion: {
      icono: <FileText className="size-5" />,
      titulo: "Información de la actividad",
      descripcion: "Datos generales, responsables y programación",
    },
    cliente: {
      icono: <Building2 className="size-5" />,
      titulo: "Información del cliente",
      descripcion: "Ubicación y clasificación comercial",
    },
    resultados: {
      icono: <Flag className="size-5" />,
      titulo: "Resultados de la actividad",
      descripcion: "Reportes y resultados registrados",
    },
    contactos: {
      icono: <Users className="size-5" />,
      titulo: "Contactos de la actividad",
      descripcion: "Personas de contacto asociadas",
    },
  };
  const encabezado = encabezados[tabActiva] ?? encabezados.informacion;

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="px-4 pt-3 sm:px-5">
        <Button variant="ghost" size="sm" onClick={() => router.push(rutaBase)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Regresar
        </Button>
      </div>
      <header className="flex flex-wrap items-center gap-3 border-b bg-muted/20 px-4 py-3.5 sm:px-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {encabezado?.icono}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">{actividad.asunto}</h1>
          <h2 className="text-sm font-medium">{encabezado?.titulo}</h2>
          <p className="text-xs text-muted-foreground">{encabezado?.descripcion}</p>
        </div>
        <div className="grow" />
        {puedeVerDocumentoAsociado && (
          <Button variant="outline" size="sm" onClick={verDocumentoAsociado}>
            <FileText className="mr-2 h-4 w-4" />
            Ver documento asociado
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={actividad.cod_cliente === null}
          onClick={() => setSeguimientosAbiertos(true)}
        >
          <MessagesSquare className="mr-2 h-4 w-4" />
          Seguimientos
        </Button>
      </header>
      <div className="space-y-4 p-4 sm:p-5">
        <Tabs value={tabActiva} onValueChange={setTabActiva}>
          <div className="flex flex-wrap items-center gap-3">
            <TabsList className="grow justify-start">
              <TabsTrigger value="informacion">Información</TabsTrigger>
              <TabsTrigger value="cliente">Cliente</TabsTrigger>
              <TabsTrigger value="resultados">Resultados</TabsTrigger>
              <TabsTrigger value="contactos">Contactos</TabsTrigger>
            </TabsList>
            <div className="grow" />
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Estado:</span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  Number(actividad.cod_estado) === 23
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-destructive/10 text-destructive",
                )}
              >
                {actividad.estado_desc}
              </span>
            </div>
          </div>
          <TabsContent value="informacion">
            <Informacion
              actividad={actividad}
              puedeAnular={puedeAnular}
              anulando={anular.isPending}
              onAnular={() => anular.mutate({ ...aPayloadActividad(actividad), cod_estado: 26 })}
            />
          </TabsContent>
          <TabsContent value="cliente" className="text-sm">
            <Cliente actividad={actividad} />
          </TabsContent>
          <TabsContent value="resultados">
            <Resultados actividad={actividad} actualizarActividad={actualizarActividad} />
          </TabsContent>
          <TabsContent value="contactos">
            <Contactos actividad={actividad} />
          </TabsContent>
        </Tabs>
        <DialogoSeguimientos
          abierto={seguimientosAbiertos}
          clienteId={actividad.cod_cliente}
          onAbiertoChange={setSeguimientosAbiertos}
        />
      </div>
    </section>
  );
}
