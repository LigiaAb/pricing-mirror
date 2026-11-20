import { useMemo } from "react";
import { useContextoOperativoQuery } from "../api/contexto-operativo";
import { useContextoOperativoStore } from "../stores/contexto-operativo-store";

/**
 * Opciones de los selectores país → empresa → centro de costo del header.
 *
 * La fuente es `getPaisEmpresaCentroCostoxUsuario`, independiente de los
 * permisos de navegación. El contexto operativo es un filtro de trabajo.
 */
export function useOpcionesContextoOperativo() {
  const { currentPais, currentEmpresa } = useContextoOperativoStore();
  const { data = [] } = useContextoOperativoQuery();

  const opcionesPais = useMemo(
    () => data.map((pais) => ({ cod_pais: pais.pais_id, nombre_pais: pais.pais_nombre })),
    [data],
  );

  const opcionesEmpresa = useMemo(() => {
    if (!currentPais) return [];
    return (
      data
        .find((pais) => pais.pais_id === currentPais.cod_pais)
        ?.empresas.map((empresa) => ({
          cod_empresa: empresa.empresa_id,
          nombre_emp: empresa.empresa_nombre,
        })) ?? []
    );
  }, [data, currentPais]);

  const opcionesCentroCosto = useMemo(() => {
    if (!currentPais || !currentEmpresa) return [];
    const empresa = data
      .find((pais) => pais.pais_id === currentPais.cod_pais)
      ?.empresas.find((item) => item.empresa_id === currentEmpresa.cod_empresa);
    return (
      empresa?.centros_costo.map((centroCosto) => ({
        cod_cc: centroCosto.cencos_id,
        nombre_cc: centroCosto.cencod_nombre,
        esDefault: centroCosto.default.toUpperCase() === "S",
      })) ?? []
    );
  }, [data, currentPais, currentEmpresa]);

  return { paises: opcionesPais, empresas: opcionesEmpresa, centrosCosto: opcionesCentroCosto };
}
