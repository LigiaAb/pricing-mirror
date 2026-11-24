import { useMemo } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
} from "@mui/material";
import { useCoordinaciones, useFetchGuiasCoordinacion } from "@/hooks/Bpm";
import TablaEditableMod from "@/components/bpm/tablas/tablaEditableMod";

export default function TablaConsolidadoMawb({ onVer }) {
  const {
    data: coordinaciones = [],
    isLoading,
    isFetching,
    refetch,
  } = useCoordinaciones({ cod_empresa: 1, cod_cc: 16 });

  const { data: guias = [] } = useFetchGuiasCoordinacion(
    {},
    { enabled: !!coordinaciones.length }
  );

  const { themeMode } = useSelector((state) => state.theme);

  const consolidadasRepesadas = useMemo(() => {
    return coordinaciones.filter((c) => {
      const esConsolidado =
        Number(c.idServicio ?? c.id_servicio) === 10;
      const estadoDesc = (c.estado || "").toUpperCase();
      const esRepesado = estadoDesc === "REPESADO";
      return esConsolidado && esRepesado;
    });
  }, [coordinaciones]);

  const guiasPorEmbarque = useMemo(() => {
    const map = {};
    guias.forEach((g) => {
      const eid = g.embarqueId ?? g.embarque_id;
      if (!eid) return;
      if (!map[eid]) map[eid] = { house: "", master: "" };
      if (g.correlativoGuia) map[eid].house = g.correlativoGuia;
      if (g.correlativoGuiaMaster) map[eid].master = g.correlativoGuiaMaster;
    });
    return map;
  }, [guias]);

  const gruposPorMawb = useMemo(() => {
    const grupos = {};
    consolidadasRepesadas.forEach((c) => {
      const eid = c.embarqueId ?? c.embarque_id;
      const guiaInfo = guiasPorEmbarque[eid] || { house: "", master: "" };
      const mawb = guiaInfo.master || "Sin MAWB";
      if (!grupos[mawb]) grupos[mawb] = [];
      grupos[mawb].push({
        ...c,
        correlativoGuia: guiaInfo.house,
        correlativoGuiaMaster: guiaInfo.master || mawb,
      });
    });
    return grupos;
  }, [consolidadasRepesadas, guiasPorEmbarque]);

  const formatHouseCell = (value) => {
    const houses = value
      ? String(value)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    if (houses.length === 0) {
      return (
        <Typography component="span" color="text.secondary">
          —
        </Typography>
      );
    }

    return (
      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
        {houses.map((houseItem) => (
          <Box
            key={`house-chip-${houseItem}`}
            sx={{
              bgcolor: themeMode === "dark" ? "transparent" : "grey.100",
              borderRadius: 1,
              px: 1,
              py: 0.5,
              fontSize: "0.75rem",
              color: "text.primary",
              whiteSpace: "nowrap",
            }}
          >
            {houseItem}
          </Box>
        ))}
      </Box>
    );
  };

  const mawbs = Object.keys(gruposPorMawb);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {mawbs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
          <Typography color="text.secondary">
            Sin coordinaciones consolidadas con estado REPESADO
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ width: "100%" }}>
          <TablaEditableMod
            titulo="Consolidado"
            showRequiredFieldsInfo={false}
            encabezados={[
              { id: "mawb", label: "Master", field: "mawb", editable: false },
              {
                id: "house",
                label: "House",
                field: "house",
                editable: false,
                format: formatHouseCell,
              },
              { id: "coordinaciones", label: "Coordinaciones", field: "coordinaciones", editable: false },
              { id: "destino", label: "Destino", field: "destino", editable: false },
            ]}
            data={mawbs.map((mawb) => {
              const grupo = gruposPorMawb[mawb];
              const master = grupo[0]?.correlativoGuiaMaster || mawb;
              const houses = [...new Set(grupo.map((item) => item.correlativoGuia).filter(Boolean))];
              return {
                mawb: master,
                house: houses.length > 0 ? houses.join(", ") : "—",
                coordinaciones: `${grupo.length} ${grupo.length === 1 ? "coordinación" : "coordinaciones"}`,
                destino: grupo[0]?.paisDestino || "—",
                _consolidadoGrupo: grupo,
              };
            })}
            rowKey="mawb"
            useSeach={true}
            editarEnTabla={false}
            acciones={{ view: true, add: false, edit: false, delete: false, save: false }}
            onRowView={(_, row) => onVer(row.mawb, row._consolidadoGrupo)}
            eventosDeTabla={{
              view: (_, row) => onVer(row.mawb, row._consolidadoGrupo),
            }}
            onRefresh={refetch}
          />
        </Box>
      )}
    </Box>
  );
}

TablaConsolidadoMawb.propTypes = {
  onVer: PropTypes.func.isRequired,
};
