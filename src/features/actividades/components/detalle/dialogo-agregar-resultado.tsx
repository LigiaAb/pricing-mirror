"use client";

import { format } from "date-fns";
import { useMemo, useState } from "react";
import {
  centrosCosto,
  configuracionActividades,
  type EmpleadoUsuario,
  empleadosUsuarios,
  empresas,
  tipos as tiposFetch,
} from "@/features/catalogos";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { deInputDateTimeLocal } from "@/shared/lib/date";
import type { Actividad } from "../../api/actividades";
import type { ResultadoActividad } from "../../api/resultados";

const defaultDateTime = format(new Date(), "yyyy-MM-dd'T'00:00");

export function DialogoAgregarResultado({
  actividad,
  abierto,
  onAbiertoChange,
  onGuardado,
}: Readonly<{
  actividad: Actividad;
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  onGuardado: (resultado: ResultadoActividad) => void;
}>) {
  const [tipoId, setTipoId] = useState("");
  const [fechaProgramada, setFechaProgramada] = useState(defaultDateTime);
  const [descripcion, setDescripcion] = useState("");
  const [referencia, setReferencia] = useState("");
  const [empresaId, setEmpresaId] = useState(String(actividad.cod_emp));
  const [centroCostoId, setCentroCostoId] = useState(String(actividad.cod_cc));
  const [asesorId, setAsesorId] = useState(String(actividad.cod_asesor ?? ""));
  const [reasonCode, setReasonCode] = useState(String(actividad.reason_code ?? ""));
  const { data: empresasData = [] } = empresas.useLista();
  const { data: centrosCostoData = [] } = centrosCosto.useLista();
  const { data: asesoresData = [] } = empleadosUsuarios.useLista({
    ...(empresaId ? { cod_emp: Number(empresaId) } : {}),
    ...(centroCostoId ? { cod_cc: Number(centroCostoId) } : {}),
  });
  const asesores = asesoresData.reduce<EmpleadoUsuario[]>((acc, asesor) => {
    if (acc.some((a) => a.codUsuario === asesor.codUsuario)) return acc;
    acc.push(asesor);
    return acc;
  }, []);
  const centrosCostoFiltrados = centrosCostoData.filter(
    (centroCosto) => String(centroCosto.codEmpresaCc) === empresaId,
  );
  const { data: configuraciones = [] } = configuracionActividades.useLista({
    cod_cc: Number(centroCostoId),
    cod_estado: 1,
  });
  const reasonCodes = tiposFetch.useLista({ tipo_tabla: "REASON_CODE" });
  const tipos = useMemo(() => {
    if (Number(actividad.cod_tipo) === 65) {
      return [
        {
          value: 65,
          cod_tipo_actividad: 65,
          label: "SEGUIMIENTO COTIZACION",
          nom_tipo_actividad: "SEGUIMIENTO COTIZACION",
          dias_creacion: 999,
          solo_resultado: false,
        },
        {
          value: 67,
          cod_tipo_actividad: 67,
          label: "COTIZACION CONFIRMADA",
          nom_tipo_actividad: "COTIZACION CONFIRMADA",
          dias_creacion: 999,
          solo_resultado: true,
        },
        {
          value: 68,
          cod_tipo_actividad: 68,
          label: "COTIZACION RECHAZADA",
          nom_tipo_actividad: "COTIZACION RECHAZADA",
          dias_creacion: 999,
          solo_resultado: true,
        },
        {
          value: 289,
          cod_tipo_actividad: 289,
          label: "CERRADO POR OTRA FIGURA",
          nom_tipo_actividad: "CERRADO POR OTRA FIGURA",
          dias_creacion: 999,
          solo_resultado: true,
        },
      ];
    }
    return [
      ...new Map(configuraciones.map((tipo) => [tipo.cod_tipo_actividad, tipo])).values(),
    ].filter((tipo) => tipo.cod_tipo_actividad !== Number(actividad.cod_tipo));
  }, [actividad.cod_tipo, configuraciones]);
  const tipo = tipos.find((item) => String(item.cod_tipo_actividad) === tipoId);

  const guardar = async () => {
    const fecha = deInputDateTimeLocal(fechaProgramada);
    if (!tipo || !fecha || !descripcion.trim()) return;

    const item: ResultadoActividad = {
      cod_resultado: null,
      cod_actividad: actividad.cod_actividad,
      cod_tipo_resultado: tipo.cod_tipo_actividad,
      nom_tipo_resultado: tipo.nom_tipo_actividad,
      nom_tipo: tipo.nom_tipo_actividad,
      fecha_creada: new Date().toISOString(),
      fecha_programada: fecha,
      referencia,
      actividad_padre: actividad.cod_actividad,
      asunto: [tipo.nom_tipo_actividad, fechaProgramada.slice(0, 10), actividad.nombre_cliente]
        .filter(Boolean)
        .join(" - "),
      descripcion: descripcion.trim(),
      cod_tipo: tipo.cod_tipo_actividad,
      cod_cliente: actividad.cod_cliente,
      cod_emp: Number(empresaId),
      cod_cc: Number(centroCostoId),
      cod_asesor: Number(asesorId),
      contactos: [],
      cod_estado: tipo.solo_resultado ? 24 : 23,
      cod_campana: actividad.cod_campana,
      crear_seguimiento: !tipo.solo_resultado,
      reason_code: Number(reasonCode) || null,
    };

    onGuardado(item);

    // await insertar.mutateAsync({
    //   cod_actividad: actividad.cod_actividad,
    //   actividad_padre: actividad.cod_actividad,
    //   fecha_programada: fecha,
    //   asunto: [tipo.nom_tipo_actividad, fechaProgramada.slice(0, 10), actividad.nombre_cliente].filter(Boolean).join(" - "),
    //   descripcion: descripcion.trim(),
    //   cod_tipo: tipo.cod_tipo_actividad,
    //   cod_cliente: actividad.cod_cliente,
    //   cod_emp: Number(empresaId),
    //   cod_cc: Number(centroCostoId),
    //   cod_asesor: Number(asesorId),
    //   contactos: [],
    //   cod_estado: tipo.solo_resultado ? 24 : 23,
    //   cod_campana: actividad.cod_campana,
    //   crear_seguimiento: !tipo.solo_resultado,
    //   referencia: referencia || null,
    //   reason_code: Number(reasonCode) || null,
    // });

    setTipoId("");
    setFechaProgramada("");
    setDescripcion("");
    setReferencia("");
    onAbiertoChange(false);
  };

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar resultado</DialogTitle>
          <DialogDescription>Registra el resultado y su fecha de seguimiento.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="resultado-empresa">Empresa</Label>
            <Select
              value={empresaId}
              onValueChange={(valor) => {
                setEmpresaId(valor);
                setCentroCostoId("");
                setAsesorId("");
                setTipoId("");
              }}
            >
              <SelectTrigger id="resultado-empresa">
                <SelectValue placeholder="Seleccione una empresa" />
              </SelectTrigger>
              <SelectContent className="z-[9999]">
                {empresasData.map((empresa) => (
                  <SelectItem key={empresa.cod_empresa} value={String(empresa.cod_empresa)}>
                    {empresa.nombre_emp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="resultado-centro-costo">Centro de costo</Label>
            <Select
              value={centroCostoId}
              onValueChange={(valor) => {
                setCentroCostoId(valor);
                setAsesorId("");
                setTipoId("");
              }}
              disabled={!empresaId}
            >
              <SelectTrigger id="resultado-centro-costo">
                <SelectValue placeholder="Seleccione un centro de costo" />
              </SelectTrigger>
              <SelectContent className="z-[9999]">
                {centrosCostoFiltrados.map((centroCosto) => (
                  <SelectItem key={centroCosto.codCc} value={String(centroCosto.codCc)}>
                    {centroCosto.nombreCc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="resultado-asesor">Asesor responsable</Label>
            <Select value={asesorId} onValueChange={setAsesorId} disabled={!centroCostoId}>
              <SelectTrigger id="resultado-asesor">
                <SelectValue placeholder="Seleccione un asesor" />
              </SelectTrigger>
              <SelectContent className="z-[9999]">
                {asesores.map((asesor) => (
                  <SelectItem key={asesor.codUsuario} value={String(asesor.codUsuario)}>
                    {asesor.nombreCompleto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="resultado-tipo">Tipo de resultado *</Label>
            <Select value={tipoId} onValueChange={setTipoId}>
              <SelectTrigger id="resultado-tipo">
                <SelectValue placeholder="Seleccione un tipo" />
              </SelectTrigger>
              <SelectContent className="z-[9999]">
                {tipos.map((item) => (
                  <SelectItem key={item.cod_tipo_actividad} value={String(item.cod_tipo_actividad)}>
                    {item.nom_tipo_actividad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {Number(tipoId) === 68 && (
            <div className="space-y-2">
              <Label htmlFor="reason_code">Reason Code *</Label>
              <Select value={reasonCode} onValueChange={setReasonCode}>
                <SelectTrigger id="reason_code">
                  <SelectValue placeholder="Seleccione un reason code" />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  {reasonCodes.data?.map((item) => (
                    <SelectItem key={item.value} value={String(item.value)}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {Number(tipoId) !== 68 && (
            <div className="space-y-2">
              <Label htmlFor="referencia">Referencia *</Label>
              <Input
                id="referencia"
                type="text"
                value={referencia}
                onChange={(event) => setReferencia(event.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="resultado-fecha">Fecha de seguimiento *</Label>
            <Input
              id="resultado-fecha"
              type="datetime-local"
              value={fechaProgramada}
              onChange={(event) => setFechaProgramada(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resultado-descripcion">Descripción del resultado *</Label>
            <Textarea
              id="resultado-descripcion"
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={
              !empresaId ||
              !centroCostoId ||
              !asesorId ||
              !tipo ||
              !fechaProgramada ||
              !descripcion.trim()
            }
            onClick={guardar}
          >
            Agregar resultado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
