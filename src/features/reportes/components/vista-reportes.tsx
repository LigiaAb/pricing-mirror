"use client";

import { ChartLine } from "lucide-react";
import React from "react";
import { modulos } from "@/features/catalogos";
import { useContextoOperativoStore } from "@/features/shell";
import type { ComboboxOption } from "@/shared/components/ui/combobox";
import { useAuthStore } from "@/shared/stores/auth-store";
import { reportesDisponibles } from "../api/reportes-disponibles";
import { REPORTES } from "../definiciones";
import { CampoSelect } from "./campos";
import { EncabezadoPanel, MensajeVacio, Panel } from "./panel";
import { PantallaReporte } from "./pantalla-reporte";

/**
 * Pantalla de reportes: primero el módulo (catálogo de módulos) y luego los reportes que el
 * rol del usuario puede ver en ese módulo, en la empresa y el CC del contexto. `codModulo` =
 * módulo elegido al abrir. Cada reporte se configura en `definiciones/` (ver `ARQUITECTURA.md`).
 */
const VistaReportes = ({ codModulo }: Readonly<{ codModulo?: number | undefined }>) => {
  const codUsuario = useAuthStore((s) => s.user?.cod_usuario);
  const empresa = useContextoOperativoStore((s) => s.currentEmpresa?.cod_empresa);
  const centroCosto = useContextoOperativoStore((s) => s.currentCentroCosto?.cod_cc);

  const catalogoModulos = modulos.useLista();
  const [modulo, setModulo] = React.useState(codModulo == null ? "" : String(codModulo));
  const [elegido, setElegido] = React.useState("");

  // Sin módulo no se consultan los reportes.
  const disponibles = reportesDisponibles.useLista({
    cod_usuario: codUsuario,
    cod_empresa: empresa,
    cod_cc: centroCosto,
    cod_modulo: modulo,
  });

  const opcionesModulo = React.useMemo<ComboboxOption[]>(
    () =>
      (catalogoModulos.data ?? []).map((m) => ({
        value: String(m.cod_modulo),
        label: m.nom_modulo,
      })),
    [catalogoModulos.data],
  );
  const reportesModulo = React.useMemo(
    () => (modulo ? (disponibles.data ?? []) : []),
    [modulo, disponibles.data],
  );
  const opciones = React.useMemo<ComboboxOption[]>(
    () => reportesModulo.map((r) => ({ value: r.nomenclatura, label: r.nombre })),
    [reportesModulo],
  );

  const disponible = reportesModulo.find((r) => r.nomenclatura === elegido);
  const definicion = REPORTES.find((r) => r.nomenclatura.toUpperCase() === elegido);

  // Si al cambiar de CC o de módulo el reporte deja de estar disponible, se quita.
  React.useEffect(() => {
    if (elegido && (!modulo || (disponibles.data && !disponible))) setElegido("");
  }, [elegido, modulo, disponibles.data, disponible]);

  return (
    <section className="grid w-full grid-cols-[minmax(0,1fr)] gap-5 bg-surface-1 p-4 md:p-6">
      <Panel>
        <EncabezadoPanel
          icono={<ChartLine />}
          titulo="Reportes disponibles"
          subtitulo="Seleccione un reporte para cargarlo"
        />
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <CampoSelect
            id="modulo"
            label="Módulo"
            value={modulo}
            onChange={setModulo}
            opciones={opcionesModulo}
            cargando={catalogoModulos.isLoading}
            placeholder="Seleccione un módulo"
          />
          <CampoSelect
            id="reporte"
            label="Reporte"
            value={elegido}
            onChange={setElegido}
            opciones={opciones}
            cargando={Boolean(modulo) && disponibles.isLoading}
            placeholder={modulo ? "Seleccione una opción" : "Seleccione primero el módulo"}
          />
          {disponibles.isError ? (
            <p role="alert" className="text-sm text-destructive md:col-span-2">
              No se pudieron cargar los reportes: {disponibles.error.message}
            </p>
          ) : null}
          {modulo && disponibles.data?.length === 0 ? (
            <p className="text-sm text-muted-foreground md:col-span-2">
              Su rol no tiene reportes asignados en este módulo y centro de costo.
            </p>
          ) : null}
        </div>
      </Panel>

      {disponible && definicion ? (
        <PantallaReporte
          key={definicion.nomenclatura}
          definicion={definicion}
          titulo={disponible.nombre}
        />
      ) : null}
      {disponible && !definicion ? (
        <Panel>
          <MensajeVacio>
            El reporte «{disponible.nombre}» ({disponible.nomenclatura}) todavía no está configurado
            en esta pantalla.
          </MensajeVacio>
        </Panel>
      ) : null}
    </section>
  );
};

export default VistaReportes;
