"use client";

import { ChartLine } from "lucide-react";
import React from "react";
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
 * y el CC del contexto (y en el módulo, si se pasa `codModulo`) y muestra el elegido.
 * Cada reporte se configura en `definiciones/` (ver `ARQUITECTURA.md`).
 */
const VistaReportes = ({ codModulo }: Readonly<{ codModulo?: number | undefined }>) => {
  const codUsuario = useAuthStore((s) => s.user?.cod_usuario);
  const empresa = useContextoOperativoStore((s) => s.currentEmpresa?.cod_empresa);
  const centroCosto = useContextoOperativoStore((s) => s.currentCentroCosto?.cod_cc);

  const disponibles = reportesDisponibles.useLista({
    cod_usuario: codUsuario,
    cod_empresa: empresa,
    cod_cc: centroCosto,
    ...(codModulo == null ? {} : { cod_modulo: codModulo }),
  });

  const opciones = React.useMemo<ComboboxOption[]>(
    () => (disponibles.data ?? []).map((r) => ({ value: r.nomenclatura, label: r.nombre })),
    [disponibles.data],
  );

  const [elegido, setElegido] = React.useState("");
  const disponible = disponibles.data?.find((r) => r.nomenclatura === elegido);
  const definicion = REPORTES.find((r) => r.nomenclatura.toUpperCase() === elegido);

  // Si al cambiar de CC el reporte deja de estar disponible, se quita.
  React.useEffect(() => {
    if (elegido && disponibles.data && !disponible) setElegido("");
  }, [elegido, disponibles.data, disponible]);

  return (
    <section className="w-full space-y-5 bg-surface-1 p-4 md:p-6">
      <Panel>
        <EncabezadoPanel
          icono={<ChartLine />}
          titulo="Reportes disponibles"
          subtitulo="Seleccione un reporte para cargarlo"
        />
        <div className="p-4">
          <CampoSelect
            id="reporte"
            label="Reportes"
            value={elegido}
            onChange={setElegido}
            opciones={opciones}
            cargando={disponibles.isLoading}
          />
          {disponibles.isError ? (
            <p role="alert" className="mt-2 text-sm text-destructive">
              No se pudieron cargar los reportes: {disponibles.error.message}
            </p>
          ) : null}
          {disponibles.data?.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
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
