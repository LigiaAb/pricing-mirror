"use client";

import { useMemo, useState } from "react";
import { commodities, industrias, paises, periodicidad, tipos } from "@/features/catalogos";
import {
  useEntidad,
  useFetchEntidadContacto,
  useFetchEntidadesDireccion,
} from "@/features/entidades";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { MultiSelect, type MultiSelectOption } from "@/shared/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { useActualizarPreferenciasEntidad } from "../../api/preferencias-entidad";

type Transporte = "maritimo" | "aereo" | "terrestre";
type TransporteForm = Record<
  Transporte,
  { activo: boolean; paises: string[]; tipos: string[]; clasificaciones: string[] }
>;

const TRANSPORTES: Array<{ key: Transporte; label: string; id: number }> = [
  { key: "maritimo", label: "Marítimo", id: 50 },
  { key: "aereo", label: "Aéreo", id: 49 },
  { key: "terrestre", label: "Terrestre", id: 51 },
];

const transporteVacio = (): TransporteForm => ({
  maritimo: { activo: false, paises: [], tipos: [], clasificaciones: [] },
  aereo: { activo: false, paises: [], tipos: [], clasificaciones: [] },
  terrestre: { activo: false, paises: [], tipos: [], clasificaciones: [] },
});

interface Formulario {
  contacto: string;
  direccion: string;
  industria: string;
  commodity: string;
  periodicidad: string;
  instrucciones: string;
  transportes: TransporteForm;
}

const formularioVacio = (): Formulario => ({
  contacto: "",
  direccion: "",
  industria: "",
  commodity: "",
  periodicidad: "",
  instrucciones: "",
  transportes: transporteVacio(),
});

function opcion(value: string | number, label: string): MultiSelectOption {
  return { value: String(value), label };
}

export function VisitingReport({ clienteId }: Readonly<{ clienteId: string | number | null }>) {
  const actualizar = useActualizarPreferenciasEntidad();
  const entidad = useEntidad(clienteId ?? 0, "CLIENTE", { enabled: clienteId !== null });
  const contactos = useFetchEntidadContacto(
    { cod_tipo: Number(entidad.data?.cod_tipo ?? 0), entidad_id: Number(clienteId) },
    { enabled: entidad.data?.cod_tipo != null && clienteId !== null },
  );
  const direcciones = useFetchEntidadesDireccion(
    {
      cod_tipo: Number(entidad.data?.cod_tipo ?? 0),
      entidad_id: clienteId ?? 0,
    },
    { enabled: entidad.data?.cod_tipo != null && clienteId !== null },
  );
  const { data: industriasData = [] } = industrias.useLista();
  const { data: commoditiesData = [] } = commodities.useLista();
  const { data: periodicidadesData = [] } = periodicidad.useLista();
  const { data: paisesData = [] } = paises.useLista();
  const { data: tiposData = [] } = tipos.useLista();
  const [formulario, setFormulario] = useState<Formulario>(formularioVacio);

  const paisesOpciones = useMemo(
    () => paisesData.map((item) => opcion(item.cod_pais, item.nombre_pais)),
    [paisesData],
  );
  const tiposCarga = useMemo(
    () =>
      tiposData
        .filter((item) => item.tipoTabla === "TIPO_CARGA")
        .map((item) => opcion(item.codTipo, item.nomTipo)),
    [tiposData],
  );
  const clasificaciones = useMemo(
    () =>
      tiposData
        .filter((item) => item.tipoTabla === "CLASIFICACION_CARGA")
        .map((item) => opcion(item.codTipo, item.nomTipo)),
    [tiposData],
  );
  const contactoSeleccionado = contactos.data?.data.find(
    (item) => String(item.entidadcontacto_id) === formulario.contacto,
  );

  if (clienteId === null) return null;

  const cambiarTransporte = (key: Transporte, cambio: Partial<TransporteForm[Transporte]>) =>
    setFormulario((actual) => ({
      ...actual,
      transportes: { ...actual.transportes, [key]: { ...actual.transportes[key], ...cambio } },
    }));

  return (
    <Accordion type="single" collapsible className="rounded-md border px-4">
      <AccordionItem value="visiting-report" className="border-0">
        <AccordionTrigger className="text-base hover:no-underline">
          Visiting Report
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <CampoSelect
                etiqueta="Contacto"
                valor={formulario.contacto}
                alCambiar={(contacto) => setFormulario((actual) => ({ ...actual, contacto }))}
                opciones={
                  contactos.data?.data.map((item) =>
                    opcion(item.entidadcontacto_id, item.entidadcontacto_nombre),
                  ) ?? []
                }
              />
              <CampoTexto
                etiqueta="Teléfono"
                valor={contactoSeleccionado?.entidadcontacto_telefono ?? ""}
              />
              <CampoTexto
                etiqueta="Correo"
                valor={contactoSeleccionado?.entidadcontacto_email ?? ""}
              />
              <CampoSelect
                etiqueta="Dirección"
                valor={formulario.direccion}
                alCambiar={(direccion) => setFormulario((actual) => ({ ...actual, direccion }))}
                opciones={
                  direcciones.data?.map((item) =>
                    opcion(item.entidaddireccion_id, item.direccion),
                  ) ?? []
                }
              />
              <CampoSelect
                etiqueta="Industria"
                valor={formulario.industria}
                alCambiar={(industria) => setFormulario((actual) => ({ ...actual, industria }))}
                opciones={industriasData.map((item) =>
                  opcion(item.cod_industria, item.nom_industria_es),
                )}
              />
              <CampoSelect
                etiqueta="Commodity"
                valor={formulario.commodity}
                alCambiar={(commodity) => setFormulario((actual) => ({ ...actual, commodity }))}
                opciones={commoditiesData.map((item) => opcion(item.cod_commodity, item.nombre))}
              />
              <CampoSelect
                etiqueta="Frecuencia de contacto"
                valor={formulario.periodicidad}
                alCambiar={(periodicidad) =>
                  setFormulario((actual) => ({ ...actual, periodicidad }))
                }
                opciones={periodicidadesData.map((item) =>
                  opcion(item.cod_periodicidad, item.descripcion),
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visiting-instrucciones">Instrucciones</Label>
              <Textarea
                id="visiting-instrucciones"
                value={formulario.instrucciones}
                onChange={(event) =>
                  setFormulario((actual) => ({ ...actual, instrucciones: event.target.value }))
                }
              />
            </div>
            <fieldset className="space-y-4 rounded-md border p-4">
              <legend className="px-1 font-medium">Tipos de carga</legend>
              {TRANSPORTES.map((transporte) => {
                const valores = formulario.transportes[transporte.key];
                return (
                  <div
                    className="grid gap-3 xl:grid-cols-[180px_repeat(3,minmax(0,1fr))]"
                    key={transporte.key}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`visiting-${transporte.key}`}
                        checked={valores.activo}
                        onCheckedChange={(activo) =>
                          cambiarTransporte(transporte.key, { activo: activo === true })
                        }
                      />
                      <Label htmlFor={`visiting-${transporte.key}`}>{transporte.label}</Label>
                    </div>
                    {valores.activo && (
                      <>
                        <CampoMultiple
                          etiqueta="Países"
                          valor={valores.paises}
                          alCambiar={(paises) => cambiarTransporte(transporte.key, { paises })}
                          opciones={paisesOpciones}
                        />
                        <CampoMultiple
                          etiqueta="Tipo de carga"
                          valor={valores.tipos}
                          alCambiar={(tipos) => cambiarTransporte(transporte.key, { tipos })}
                          opciones={tiposCarga}
                        />
                        <CampoMultiple
                          etiqueta="Clasificación de carga"
                          valor={valores.clasificaciones}
                          alCambiar={(clasificaciones) =>
                            cambiarTransporte(transporte.key, { clasificaciones })
                          }
                          opciones={clasificaciones}
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </fieldset>
            <Button
              disabled={actualizar.isPending}
              onClick={() =>
                actualizar.mutate({
                  entidad_id: clienteId,
                  entidadcontacto_id: formulario.contacto || null,
                  entidaddireccion_id: formulario.direccion || null,
                  industria_id: formulario.industria || null,
                  commodity_id: formulario.commodity || null,
                  periodicidad_id: formulario.periodicidad || null,
                  instruccion: formulario.instrucciones,
                  estado_id: 1,
                  transportes: TRANSPORTES.filter(
                    (item) => formulario.transportes[item.key].activo,
                  ).map((item) => ({
                    tipo_transporte_id: item.id,
                    paises: formulario.transportes[item.key].paises,
                    tipo_carga: formulario.transportes[item.key].tipos,
                    clasificacion: formulario.transportes[item.key].clasificaciones,
                  })),
                })
              }
            >
              {actualizar.isPending ? "Actualizando…" : "Actualizar preferencias"}
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function CampoSelect({
  etiqueta,
  valor,
  alCambiar,
  opciones,
}: Readonly<{
  etiqueta: string;
  valor: string;
  alCambiar: (valor: string) => void;
  opciones: MultiSelectOption[];
}>) {
  const id = `visiting-${etiqueta.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{etiqueta}</Label>
      <Select
        value={valor || "ninguno"}
        onValueChange={(valorSeleccionado) =>
          alCambiar(valorSeleccionado === "ninguno" ? "" : valorSeleccionado)
        }
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder="Seleccionar…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ninguno">Sin seleccionar</SelectItem>
          {opciones.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function CampoMultiple({
  etiqueta,
  valor,
  alCambiar,
  opciones,
}: Readonly<{
  etiqueta: string;
  valor: string[];
  alCambiar: (valor: string[]) => void;
  opciones: MultiSelectOption[];
}>) {
  return (
    <div className="space-y-2">
      <Label>{etiqueta}</Label>
      <MultiSelect
        value={valor}
        onChange={alCambiar}
        options={opciones}
        placeholder="Seleccionar…"
      />
    </div>
  );
}

function CampoTexto({ etiqueta, valor }: Readonly<{ etiqueta: string; valor: string }>) {
  const id = `visiting-${etiqueta.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{etiqueta}</Label>
      <Input id={id} value={valor} readOnly />
    </div>
  );
}
