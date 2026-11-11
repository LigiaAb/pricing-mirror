import React from "react";

import {
  type CriterioDisponible,
  cargarVersion,
  type DimensionVersion,
  type LegVersion,
  type PlantillaVersion,
  type RubroVersion,
  useActivarVersion,
  useVersiones,
  type VersionCotizacion,
} from "../api/versiones";

import {
  type CotizacionParaVersion,
  construirCriteriosVersion,
  type EstadosVersion,
  extraerEntidadVersion,
} from "../lib/versiones";

import type { Id } from "../lib/tipos";
import { useCatalogosCotizacion } from "./use-catalogos-cotizacion";

type Props = {
  codCotizacionCabecera?: Id | null;

  codUsuario?: Id | null;

  cotizacion: CotizacionParaVersion;

  filtros: Record<string, unknown>;

  estados: EstadosVersion;

};

type DatosVersion = {
  rubrosGuardados: RubroVersion[];
  dimensiones: DimensionVersion[];
  legs: LegVersion[];
  criteriosDisponibles: CriterioDisponible[];
  criteriosIniciales: Record<string, unknown>;
  plantilla: PlantillaVersion | null;
  entidadIdGuardada: Id | null;
};

function crearDetalleVacio(): DatosVersion {
  return {
    rubrosGuardados: [],
    dimensiones: [],
    legs: [],
    criteriosDisponibles: [],
    criteriosIniciales: {},
    plantilla: null,
    entidadIdGuardada: null,
  };
}

export function useVersionCotizacion({
  codCotizacionCabecera,
  codUsuario,
  cotizacion,
  filtros,
  estados,
}: Props) {
  const { codigosFletes } = useCatalogosCotizacion();

  const versionesQuery = useVersiones(codCotizacionCabecera);

  const activarMutation = useActivarVersion();

  const [versionActual, setVersionActual] = React.useState<VersionCotizacion | null>(null);

  const [detalleVersion, setDetalleVersion] = React.useState(crearDetalleVacio);
  const setLegs = React.useCallback((legs: React.SetStateAction<LegVersion[]>) => {
    setDetalleVersion((prev) => ({ ...prev, legs: typeof legs === "function" ? legs(prev.legs) : legs }));
  }, []);

  const [cargandoDetalle, setCargandoDetalle] = React.useState(false);

  const [versionPendienteActivar, setVersionPendienteActivar] = React.useState<Id | null>(null);

  // Marca cuál fila está activa en la lista; versionActual es la fila abierta en pantalla.
  const versiones = React.useMemo(
    () => (versionesQuery.data ?? []).map((version) => ({
      ...version,
      isActive: estados.ACTIVO != null && String(version.cod_estado) === String(estados.ACTIVO),
    })),
    [versionesQuery.data, estados.ACTIVO],
  );

  const limpiarDetalleVersion = React.useCallback(() => {
    setDetalleVersion(crearDetalleVacio());
  }, []);

  const abrirVersion = React.useCallback(
    async (version: VersionCotizacion) => {
      if (codCotizacionCabecera == null) {
        return;
      }

      setCargandoDetalle(true);

      try {
        setVersionActual(version);

        /*
         * Reset únicamente del estado
         * que pertenece a versión.
         */
        limpiarDetalleVersion();

        const detalle = await cargarVersion({
          codCotizacionCabecera,

          // Una versión nueva aún no tiene detalle guardado; se carga el cálculo base de la cabecera.
          codCotizacionDetalle: version.isNew ? null : version.cod_cotizaciondetalle,

          filtros,
        });

        setDetalleVersion((prev) => ({
          ...prev,
          rubrosGuardados: detalle.rubros,
          dimensiones: detalle.dimensiones,
          legs: detalle.legs,
          plantilla: detalle.plantilla,
          criteriosDisponibles: detalle.criteriosDisponibles,
        }));
        const criteriosIniciales = construirCriteriosVersion({
          criteriosDisponibles: detalle.criteriosDisponibles,
          criteriosGuardados: detalle.criteriosGuardados,
          cotizacion,
        });
        setDetalleVersion((prev) => ({ ...prev, criteriosIniciales }));
        const entidad = extraerEntidadVersion({ rubros: detalle.rubros, codigosFletes });
        setDetalleVersion((prev) => ({
          ...prev,
          entidadIdGuardada: entidad ?? cotizacion.entidad_id ?? null,
        }));
      } finally {
        setCargandoDetalle(false);
      }
    },
    [codCotizacionCabecera, filtros, cotizacion, codigosFletes, limpiarDetalleVersion],
  );

  // Prepara una versión local. El registro se crea después, al guardar.
  const nuevaVersion = React.useCallback(
    async ({ primera = false }: { primera?: boolean } = {}) => {
      if (codCotizacionCabecera == null) {
        return;
      }

      const version: VersionCotizacion & {
        isNew: true;
        isActive: true;
        accionesDeTabla: {
          view: true;
          pdf: false;
          delete: false;
        };
      } = {
        cod_cotizaciondetalle: 0,

        cod_cotizacion_cabecera: codCotizacionCabecera,

        version: primera ? 1 : versiones.length + 1,

        total: 0,

        // El borrador puede abrirse sin este código; Guardar lo valida antes de insertar.
        cod_estado: estados.ACTIVO ?? null,

        cod_usuario: codUsuario ?? null,

        tipo_transito: null,

        salida: null,

        opcionales: null,

        cotizaciondetalle_json: null,

        isNew: true,

        isActive: true,

        accionesDeTabla: {
          view: true,
          pdf: false,
          delete: false,
        },
      };

      await abrirVersion(version);

      return version;
    },
    [codCotizacionCabecera, codUsuario, estados.ACTIVO, versiones.length, abrirVersion],
  );

  /*
   * La inicialización pertenece a la cabecera actual.
   *
   * Un booleano permanente deja el hook bloqueado si el
   * mismo componente recibe otra cotización sin desmontarse.
   */
  const cabeceraInicializadaRef = React.useRef<Id | null>(null);

  React.useEffect(() => {
    // La cabecera identifica el ciclo de inicialización que debe reiniciarse.
    void codCotizacionCabecera;

    cabeceraInicializadaRef.current = null;

    setVersionActual(null);
    setVersionPendienteActivar(null);
    limpiarDetalleVersion();
  }, [codCotizacionCabecera, limpiarDetalleVersion]);

  React.useEffect(() => {
    if (codCotizacionCabecera == null) {
      return;
    }

    if (versionesQuery.isLoading) {
      return;
    }

    if (versionesQuery.isError) {
      return;
    }

    if (String(cabeceraInicializadaRef.current ?? "") === String(codCotizacionCabecera)) {
      return;
    }

    // Solo se elige una versión inicial por cabecera: la activa, la primera o una nueva si no hay historial.
    cabeceraInicializadaRef.current = codCotizacionCabecera;

    if (!versiones.length) {
      void nuevaVersion({
        primera: true,
      });

      return;
    }

    const versionDefault =
      versiones.find((version) => estados.ACTIVO != null && String(version.cod_estado) === String(estados.ACTIVO)) ??
      versiones[0];

    if (versionDefault) {
      void abrirVersion(versionDefault);
    }
  }, [
    codCotizacionCabecera,
    versiones,
    versionesQuery.isLoading,
    versionesQuery.isError,
    estados.ACTIVO,
    abrirVersion,
    nuevaVersion,
  ]);

  const activarVersion = React.useCallback(
    async (codCotizacionDetalle: Id) => {
      if (codCotizacionCabecera == null || estados.ACTIVO == null) {
        return;
      }

      await activarMutation.mutateAsync({
        codCotizacionCabecera,

        codCotizacionDetalle,
      });

      /*
       * useActivarVersion invalida/refresca la query.
       * Cuando la lista actualizada llegue, el efecto de abajo
       * abrirá la versión que efectivamente quedó activa.
       */
      setVersionPendienteActivar(codCotizacionDetalle);
    },
    [codCotizacionCabecera, activarMutation, estados.ACTIVO],
  );

  React.useEffect(() => {
    if (versionPendienteActivar == null || estados.ACTIVO == null) {
      return;
    }

    const versionActivada = versiones.find(
      (version) =>
        String(version.cod_cotizaciondetalle) === String(versionPendienteActivar) &&
        String(version.cod_estado) === String(estados.ACTIVO),
    );

    if (!versionActivada) {
      return;
    }

    setVersionPendienteActivar(null);

    void abrirVersion(versionActivada);
  }, [versionPendienteActivar, versiones, estados.ACTIVO, abrirVersion]);

  const actualizarVersionActual = React.useCallback((campo: string, valor: unknown) => {
    setVersionActual((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,

        [campo]: valor,
      };
    });
  }, []);

  const abrirVersionGuardada = React.useCallback(async (codCotizacionDetalle: Id) => {
    const { data } = await versionesQuery.refetch();
    const guardada = data?.find((version) => String(version.cod_cotizaciondetalle) === String(codCotizacionDetalle));
    if (guardada) await abrirVersion(guardada);
  }, [versionesQuery.refetch, abrirVersion]);

  return {
    versiones,
    versionActual,
    abrirVersion,
    nuevaVersion,
    activarVersion,
    abrirVersionGuardada,
    actualizarVersionActual,
    ...detalleVersion,
    setLegs,
    cargandoVersiones: versionesQuery.isLoading,
    cargandoDetalle,
    activandoVersion: activarMutation.isPending,
    isLoading: versionesQuery.isLoading || cargandoDetalle || activarMutation.isPending,
  };
}
