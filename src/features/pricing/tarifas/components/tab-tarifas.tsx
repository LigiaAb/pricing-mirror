"use client";

import { addDays, format, parseISO } from "date-fns";
import React from "react";
import { tipos } from "@/features/catalogos";
import { FichaResumen } from "@/features/pricing/shared";
import { DynamicIcon } from "@/shared/components/dynamic-icon";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { InputGroup, InputGroupInput } from "@/shared/components/ui/input-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/lib/utils";
import { useTarifaCobertura } from "../api/tarifa-cobertura";
import { useTarifaCostoPorcentajeje } from "../api/tarifa-costo-porcentaje";
import { useTarifaCostoVenta } from "../api/tarifa-costoventa";
import { useTarifaEquipo } from "../api/tarifa-equipo";
import { useTarifaPorcentaje } from "../api/tarifa-porcentaje";
import { useTarifaRangos } from "../api/tarifa-rangos";
import type { FilaServicioMetodo } from "../api/types-api";
import { formatDateForInput } from "../lib/tarifa-helpers";
import { FormularioTarifa, type TarifaSubmitPayload } from "./formulario-tarifa";
import { CommoditiesTable } from "./metodo-commodities/commodities-table";
import { DetalleTable } from "./metodo-detalle/detalle-table";
import { EntidadTable } from "./metodo-entidad/entidad-table";
import { PaisTable } from "./metodo-pais/pais-table";
import { CoberturaTable } from "./metodos/cobertura/cobertura-table";
import { CostoPorcentajeTable } from "./metodos/costo-porcentaje/porcentaje-table";
import { MetodoCostoVenta } from "./metodos/costoVenta/costo-venta";
import { EquipoTable } from "./metodos/equipo/equipo-table";
import { PorcentajeTable } from "./metodos/porcentaje/porcentaje-table";
import { RangoTable } from "./metodos/rango/rango-table";
import { ScallingTable } from "./metodos/scalling/scalling-table";

type Props = {
  defaultValues?: Partial<FilaServicioMetodo> | undefined;

  tipoFormulario: "ingreso" | "edicion" | "lectura" | "filtro";

  onGuardarTarifa?: (payload: TarifaSubmitPayload) => void | Promise<void>;

  onCopiarTarifa?: (
    item: Partial<FilaServicioMetodo>,
    fechaInicio: Date,
    fechaFinal: Date | null,
  ) => void | Promise<void>;

  guardando?: boolean;
};
const renderizarDate = ({
  id,
  label,
  className,
  onInput,
  requerido,
  value,
}: {
  id: string;
  label: string;
  className?: string;
  onInput: (val: Date | null) => void;
  requerido?: boolean;
  value: Date | null;
}) => {
  const idGenerado = id;

  return (
    <Field className={cn(className)}>
      <FieldLabel htmlFor={idGenerado}>
        {label}

        {requerido && " *"}
      </FieldLabel>

      <InputGroup>
        <InputGroupInput
          // readOnly={verificarSiEsLectura(id)}
          // disabled={verificarSiEsLectura(id)}
          onChange={(event) => onInput(event.target?.valueAsDate ?? null)}
          id={idGenerado}
          type="date"
          value={formatDateForInput(value)}
        />
      </InputGroup>
    </Field>
  );
};

export function TarifasTabs({
  defaultValues = {},
  tipoFormulario,
  onGuardarTarifa = () => {},
  onCopiarTarifa = () => {},
  guardando = false,
}: Props) {
  const [tabsValue, setTabsValue] = React.useState("tarifas");

  // Datos de copia
  const [mostrarCopiar, setMostrarCopiar] = React.useState(false);
  const [item, setItem] = React.useState<FilaServicioMetodo | null>(null);
  const [fechaInicio, setFechaInicio] = React.useState<Date | null>(null);
  const [fechaFinal, setFechaFinal] = React.useState<Date | null>(null);

  /*
   * NO usar useState(defaultValues).
   *
   * Después de insertar necesitamos que este componente
   * reciba el cod_servicio y cod_metodo recién creados.
   */
  const values: FilaServicioMetodo = defaultValues ?? {};

  /*
   * Consulta de metodos para validar la edición de la tarifa.
   */

  const codMetodo = values.cod_metodo;
  const rangosQuery = useTarifaRangos({
    codEstado: 1,
    ...(codMetodo == null ? {} : { codMetodo, cod_metodo: codMetodo }),
  });
  const costoVentaQuery = useTarifaCostoVenta({ ...(codMetodo == null ? {} : { codMetodo }) });
  const tarifaEquipo = useTarifaEquipo({
    codEstado: 1,
    ...(codMetodo == null ? {} : { codMetodo }),
  });
  const porcentajeQuery = useTarifaPorcentaje({ ...(codMetodo == null ? {} : { codMetodo }) });
  const costoPorcentajeQuery = useTarifaCostoPorcentajeje({
    ...(codMetodo == null ? {} : { codMetodo }),
  });
  const coberturaQuery = useTarifaCobertura({ ...(codMetodo == null ? {} : { codMetodo }) });
  const tiposFetch = tipos.useLista({ tipo_tabla: "METODO" });
  // const scallingQuery = useTarifaScalling({ codEstado: 1, ...(codMetodo == null ? {} : { codMetodo }) });

  const esScale = React.useMemo(() => values?.cod_rubro === 134, [values?.cod_rubro]);

  const tabs = React.useMemo(() => {
    type Item = {
      value: string;
      label: string;
      detalle?: string;
      icon?: string;
      disabled?: boolean;
    };

    const tabInicial: Item = {
      value: "informacion",
      label: "Información",
      icon: "abc",
      disabled: false,
    };

    let tabsMetodo:
      | {
          value: string;
          label: string;
          icon?: string;
          disabled?: boolean;
        }
      | undefined;

    const tipoCalculo = (tiposFetch.data ?? []).find((i) => i.codTipo === values.cod_tipo);

    switch (tipoCalculo?.nomTipo) {
      case "RANGO":
        tabsMetodo = {
          value: "metodo",
          label: "Rango",
        };
        break;

      case "COSTO/VENTA":
        tabsMetodo = {
          value: "metodo",
          label: "Costo / Venta",
        };
        break;

      case "EQUIPO":
        tabsMetodo = {
          value: "metodo",
          label: "Equipo",
        };
        break;

      case "PORCENTAJE RUBRO":
        tabsMetodo = {
          value: "metodo",
          label: "Porcentaje",
        };
        break;

      case "COSTO POR PORCENTAJE":
        tabsMetodo = {
          value: "metodo",
          label: "Costo por Porcentaje",
        };
        break;

      case "COBERTURA":
        tabsMetodo = {
          value: "metodo",
          label: "Cobertura",
        };
        break;

      case "SCALLING":
        tabsMetodo = {
          value: "metodo",
          label: "Scalling",
        };
        break;

      default:
        tabsMetodo = {
          value: "metodo",
          label: "No seleccionado",
        };
        break;
    }

    const detalleCliente = values.cod_tipo_tarifa === 97 ? "No Aplicados" : "Aplicados";

    const detalleContinente = values.todos_los_paises ? "No Aplicados" : "Aplicados";

    const detalleCommodities = values.todos_los_commodities ? "No Aplicados" : "Aplicados";

    const tabCliente: Item = {
      value: "cliente",
      label: "Cliente",
      detalle: detalleCliente,
      icon: "c-usuario",
      disabled: esScale,
    };

    const tabContinente: Item = {
      value: "continente_pais",
      label: "Continente / Países",
      detalle: detalleContinente,
      icon: "c-buscar-mapa",
      disabled: esScale,
    };

    const tabDetalle: Item = {
      value: "detalle",
      label: "Detalle",
      icon: "c-lista",
      disabled: false,
    };

    const tabCommodities: Item = {
      value: "commodites",
      label: "Commodities",
      detalle: detalleCommodities,
      icon: "c-documento",
      disabled: esScale,
    };

    const lista: Item[] = [tabInicial];

    if (values.cod_servicio) {
      lista.push({
        ...tabsMetodo,
        icon: "c-calcular",
        disabled: false,
      });

      lista.push(tabCliente);
      lista.push(tabContinente);
      lista.push(tabDetalle);
      lista.push(tabCommodities);
    }

    return lista;
  }, [
    esScale,
    values.cod_tipo,
    values.cod_servicio,
    values.cod_tipo_tarifa,
    values.todos_los_paises,
    values.todos_los_commodities,
    tiposFetch.data,
  ]);

  const metodoExiste = React.useMemo(() => {
    let elMetodoExiste = false;

    switch (values.cod_tipo) {
      case 101:
        elMetodoExiste = (rangosQuery.data ?? []).length > 0;
        break;

      case 102:
        elMetodoExiste = (costoVentaQuery.data ?? []).length > 0;
        break;

      case 103:
        elMetodoExiste = (tarifaEquipo.data ?? []).length > 0;
        break;

      case 148:
        elMetodoExiste = (porcentajeQuery.data ?? []).length > 0;
        break;

      case 363:
        elMetodoExiste = (coberturaQuery.data ?? []).length > 0;
        break;

      case 504:
        elMetodoExiste = (costoPorcentajeQuery.data ?? []).length > 0;
        break;

      case 342:
        elMetodoExiste = false; // (scallingQuery.data ?? []).length > 0;
        break;

      default:
        break;
    }

    return elMetodoExiste;
  }, [
    rangosQuery.data,
    costoVentaQuery.data,
    tarifaEquipo.data,
    porcentajeQuery.data,
    coberturaQuery.data /* scallingQuery.data */,
    values.cod_tipo,
    costoPorcentajeQuery.data,
  ]);

  const renderizarMetodoCalculo = React.useCallback(() => {
    let componente = <></>;

    const props = {
      codMetodo: values.cod_metodo ?? 0,
      codTipoTransporte: values.cod_tipo_transporte ?? null,
      readonly: metodoExiste,
    };

    switch (values.cod_tipo) {
      case 101:
        componente = <RangoTable {...props} />;
        break;

      case 102:
        componente = <MetodoCostoVenta {...props} />;
        break;

      case 103:
        componente = <EquipoTable {...props} />;
        break;

      case 148:
        componente = <PorcentajeTable {...props} />;
        break;

      case 363:
        componente = <CoberturaTable {...props} />;
        break;

      case 342:
        componente = <ScallingTable {...props} />;
        break;

      case 504:
        componente = <CostoPorcentajeTable {...props} />;
        break;

      default:
        break;
    }

    return (
      <TabsContent value="metodo" className="grow p-4">
        {componente}
      </TabsContent>
    );
  }, [values.cod_tipo, values.cod_metodo, values.cod_tipo_transporte, metodoExiste]);

  React.useEffect(() => {
    if (!tabs.find((tab) => tab.value === tabsValue)) {
      setTabsValue("informacion");
    }
  }, [tabs, tabsValue]);

  return (
    <Tabs className="flex flex-row" value={tabsValue} onValueChange={setTabsValue}>
      <TabsList className="auto flex-col h-auto justify-start col-span-1">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="gap-1 w-full"
            disabled={tab.disabled}
          >
            <div className="flex flex-nowrap">
              {tab.icon && <DynamicIcon size={25} name={tab.icon.replace("c-", "")} />}
            </div>

            <div className="flex w-full flex-wrap">
              <span className="text-left">{tab.label}</span>

              {tab.detalle ? (
                <span className="text-left w-full text-[9px]">{tab.detalle}</span>
              ) : null}
            </div>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="informacion" className="grow p-4">
        <FormularioTarifa
          defaultValues={defaultValues}
          tipoFormulario={metodoExiste ? "lectura" : tipoFormulario}
          onGuardar={onGuardarTarifa}
          guardando={guardando}
          onCopy={(item) => {
            setItem(item);
            setFechaInicio(item.fechaFin ? addDays(item.fechaFin, 1) : null);
            setMostrarCopiar(true);
          }}
        />
        <Dialog
          open={mostrarCopiar}
          onOpenChange={(o) => {
            setMostrarCopiar(o);
            if (!o) {
              setItem(null);
              setFechaInicio(null);
              setFechaFinal(null);
            }
          }}
        >
          <DialogContent className="w-full max-w-[50vw] max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Copiar tarifa</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2 ">
              <div className="p-2 shadow-md border rounded-md border-muted bg-card">
                <FichaResumen width="w-full" item={item} />
              </div>
              <div className="p-5 flex flex-col justify-around">
                <div className="p-5">
                  <p>
                    Para realizar la copia de la tarifa favor de ingresar la{" "}
                    <span className="font-semibold text-primary">fecha de inicio</span> de la nueva
                    tarifa.
                  </p>
                  <p>
                    La fecha debe ser despues de la{" "}
                    <span className="font-semibold text-primary">fecha de vencimiento</span> de la
                    tarifa actual{" "}
                    <span className="font-semibold text-primary border rounded p-1 border-primary text-sm">
                      {item &&
                        format(
                          parseISO((item.fechaFin as Date).toISOString().split("T")[0] ?? ""),
                          "dd/MM/yyyy",
                        )}
                      .
                    </span>
                  </p>
                </div>
                <div className="p-2 shadow-md border rounded-md border-muted bg-card">
                  {renderizarDate({
                    id: "fecha_inicio",
                    label: "Fecha de inicio",
                    requerido: true,
                    value: fechaInicio ?? null,
                    onInput: (val) => setFechaInicio(val),
                  })}
                  {renderizarDate({
                    id: "fecha_final",
                    label: "Fecha de finalización",
                    requerido: true,
                    value: fechaFinal ?? null,
                    onInput: (val) => setFechaFinal(val),
                  })}
                  <div className="p-2 ">
                    <Button
                      type="button"
                      variant="default"
                      disabled={guardando || !item || !fechaInicio}
                      onClick={async () => {
                        if (!item || !fechaInicio) return;

                        await onCopiarTarifa(item, fechaInicio, fechaFinal);
                        setMostrarCopiar(false);
                        setItem(null);
                        setFechaInicio(null);
                        setFechaFinal(null);
                      }}
                    >
                      <DynamicIcon name="copy" />
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </TabsContent>

      {renderizarMetodoCalculo()}

      <TabsContent value="cliente" className="grow p-4">
        <EntidadTable codMetodo={values.cod_metodo ?? 0} />
      </TabsContent>

      <TabsContent value="continente_pais" className="grow p-4">
        <PaisTable
          codMetodo={values.cod_metodo ?? 0}
          codTipoTransporte={values.cod_tipo_transporte ?? null}
        />
      </TabsContent>

      <TabsContent value="detalle" className="grow p-4">
        <DetalleTable codMetodo={values.cod_metodo ?? 0} />
      </TabsContent>

      <TabsContent value="commodites" className="grow p-4">
        <CommoditiesTable codMetodo={values.cod_metodo ?? 0} />
      </TabsContent>
    </Tabs>
  );
}
