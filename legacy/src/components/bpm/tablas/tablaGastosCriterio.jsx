import React, { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";
import TablaComponent from "@/components/Tabla/TablaComponent";
import { useListarCoordinacionGastosCriterio, useObtenerUltimaVersionCoordinacionGastos } from "@/hooks/Bpm";

const TablaGastosCriterio = ({ embarqueId, embarqueVersion, onLoadingChange = null }) => {
  const queryClient = useQueryClient();

  const { data: versionData = {}, isLoading: versionLoading, refetch: refetchVersion } = useObtenerUltimaVersionCoordinacionGastos(
    embarqueId,
    { enabled: !!embarqueId }
  );

  const resolvedVersion =
    versionData?.embarque_version ?? embarqueVersion ?? null;

  const {
    data: criterios = [],
    isLoading: isLoadingCriterios,
  } = useListarCoordinacionGastosCriterio(embarqueId, resolvedVersion, {
    enabled: !!embarqueId && !versionLoading,
  });

  const isLoading = versionLoading || isLoadingCriterios;

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  const encabezado = useMemo(
    () => [
      { name: "criterioCampo", label: "Criterio", campo: "criterioCampo" },
      { name: "valor", label: "Valor", campo: "valor" },
    ],
    []
  );

  const datos = useMemo(() => {
    if (!Array.isArray(criterios)) return [];

    return criterios.map((item) => {
      const propiedadesDeTabla = {};
      Object.keys(item).forEach((key) => {
        propiedadesDeTabla[key] = { color: undefined, bold: undefined };
      });

      return {
        ...item,
        cod_tipo_pago: item?.cod_tipo_pago ?? item?.COD_TIPO_PAGO ?? null,
        accionesDeTabla: {
          add: false,
          view: false,
          go: false,
          copy: false,
          paste: false,
          auth: false,
          edit: false,
          excel: false,
          pdf: false,
          download: false,
          delete: false,
        },
        propiedadesDeTabla,
      };
    });
  }, [criterios]);

  const totalValor = useMemo(() => {
    if (!Array.isArray(criterios)) return 0;

    return criterios.reduce((acc, item) => {
      const value = Number(item?.valor ?? item?.Valor ?? 0);
      return acc + (Number.isNaN(value) ? 0 : value);
    }, 0);
  }, [criterios]);

  const handleRefresh = async () => {
    if (!embarqueId) return;

    // 1. Invalidar y refetchear versión para obtener el valor actualizado
    await queryClient.invalidateQueries({ queryKey: ["ultima-version-coordinacion-gastos", embarqueId] });
    await refetchVersion?.();

    // 2. Ahora invalidar criterios: React Query re-fetcheará automáticamente
    //    con el nuevo resolvedVersion cuando el componente re-renderice
    await queryClient.invalidateQueries({ queryKey: ["listar-coordinacion-gastos-criterio", embarqueId] });
  };

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-start", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 2 }}>
        <Typography variant="subtitle2" color="text.primary">
          Total: {new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalValor)}
        </Typography>
      </Box>
      <TablaComponent
        titulo="Criterios de Gastos"
        id="embGastoCriterioId"
        encabezado={encabezado}
        datos={datos}
        isLoading={isLoading}
        select={false}
        eventosDeTabla={{}}
        botones={{
          refresh: {
            label: <RefreshCcw size={18} />,
            onClick: handleRefresh,
            disabled: isLoading || versionLoading,
            color: "primary",
          },
        }}
      />
    </Box>
  );
};

TablaGastosCriterio.propTypes = {
  embarqueId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  embarqueVersion: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onLoadingChange: PropTypes.func,
};

export default TablaGastosCriterio;
