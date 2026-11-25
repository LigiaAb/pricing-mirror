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
 * Pantalla de reportes: lista los reportes que el rol del usuario puede ver en la empresa
 * y el CC del contexto, por módulo, y muestra el elegido. `codModulo` = módulo elegido al
 * abrir. Cada reporte se configura en `definiciones/` (ver `ARQUITECTURA.md`).
 */
const VistaReportes = ({ codModulo }: Readonly<{ codModulo?: number | undefined }>) => {
  const codUsuario = useAuthStore((s) => s.user?.cod_usuario);
  const empresa = useContextoOperativoStore((s) => s.currentEmpresa?.cod_empresa);
  const centroCosto = useContextoOperativoStore((s) => s.currentCentroCosto?.cod_cc);

  const disponibles = reportesDisponibles.useLista({
    cod_usuario: codUsuario,
    cod_empresa: empresa,
    cod_cc: centroCosto,
  });
  const catalogoModulos = modulos.useLista();

  const [modulo, setModulo] = React.useState(codModulo == null ? "" : String(codModulo));
  const [elegido, setElegido] = React.useState("");

  // Módulos con al menos un reporte asignado (nombre del catálogo de módulos).
  const opcionesModulo = React.useMemo<ComboboxOption[]>(() => {
    const codigos = new Set(
      (disponibles.data ?? []).flatMap((r) => (r.codModulo == null ? [] : [r.codModulo])),
    );
    return (catalogoModulos.data ?? [])
      .filter((m) => codigos.has(String(m.cod_modulo)))
      .map((m) => ({ value: String(m.cod_modulo), label: m.nom_modulo }));
  }, [disponibles.data, catalogoModulos.data]);

  // Reportes del módulo elegido (los de módulo NULL aplican en todos); sin módulo, todos.
  const delModulo = React.useMemo(() => {
    const vistos = new Set<string>();
    return (disponibles.data ?? []).filter((r) => {
      if (modulo && r.codModulo != null && r.codModulo !== modulo) return false;
      if (vistos.has(r.nomenclatura)) return false;
      vistos.add(r.nomenclatura);
      return true;
    });
  }, [disponibles.data, modulo]);
  const opciones = React.useMemo<ComboboxOption[]>(
    () => delModulo.map((r) => ({ value: r.nomenclatura, label: r.nombre })),
    [delModulo],
  );

  const disponible = delModulo.find((r) => r.nomenclatura === elegido);
  const definicion = REPORTES.find((r) => r.nomenclatura.toUpperCase() === elegido);

  // Si al cambiar de CC o de módulo el reporte deja de estar disponible, se quita.
  React.useEffect(() => {
    if (elegido && disponibles.data && !disponible) setElegido("");
  }, [elegido, disponibles.data, disponible]);

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
            cargando={disponibles.isLoading || catalogoModulos.isLoading}
            placeholder="Todos"
          />
          <CampoSelect
            id="reporte"
            label="Reporte"
            value={elegido}
            onChange={setElegido}
            opciones={opciones}
            cargando={disponibles.isLoading}
          />
          {disponibles.isError ? (
            <p role="alert" className="text-sm text-destructive md:col-span-2">
              No se pudieron cargar los reportes: {disponibles.error.message}
            </p>
          ) : null}
          {disponibles.data?.length === 0 ? (
            <p className="text-sm text-muted-foreground md:col-span-2">
              Su rol no tiene reportes asignados en este centro de costo.
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
