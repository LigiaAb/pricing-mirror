import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Grid, Typography } from "@mui/material";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { ListaActividades2 } from "../Actividades/ListaActividades2";
import ReporteObjetiovsActividadesPorEmpleado from "../../views/ReporteObjetivosActividadesPorEmpleados/ReporteObjetiovsActividadesPorEmpleado";
import FiltrosGraficasPersonales from "./reports/CRM/FiltrosGraficasPersonales";
import { renderizarReporteCrm, tipoReportesCrm } from "./ReportesCrm";
import { useObtenerPermisosDeMenuActual } from "../../hooks/useObtenerOpcionesAcciones";

const VistaReportes = ({ modulo }) => {
  const opciones = useObtenerPermisosDeMenuActual();

  const permisoPaisCC = useMemo(() => Object.keys(Object.values(Object.values(opciones)[0]?.opciones)[0]?.acciones).some((i) => i === "11"), [opciones]);

  const [selectedTipo, setSelectedTipo] = useState(null);

  const inputs = useMemo(
    () => [
      {
        tipo: "select",
        label: "Tipo de Reporte",
        id: "tipo",
        size: 4,
        val: { label: selectedTipo ? selectedTipo?.label : "", value: selectedTipo ? selectedTipo?.value : -1 },
        options: modulo === "CRM" ? tipoReportesCrm : [],
      },
    ],
    [selectedTipo, modulo]
  );

  return (
    <Box sx={{ p: 0, m: 0, width: "100%" }}>
      <Grid container columns={{ xs: 4, md: 8 }}>
        <Grid size="grow">
          <Typography m={0} p={0} variant="h4">
            Reportes {modulo ? ` - ${modulo}` : ""}
          </Typography>
        </Grid>

        <Grid size={12} sx={{ p: 1, mb: 0 }}>
          <FormularioComponent
            inputs={inputs}
            onInput={({ id, val }) => {
              setSelectedTipo(val);
            }}
            botones={{
              agregar: { visible: false },
            }}
          />
        </Grid>
        <Grid size={12}>{modulo === "CRM" ? renderizarReporteCrm(selectedTipo, permisoPaisCC) : <></>}</Grid>
      </Grid>
    </Box>
  );
};

VistaReportes.propTypes = {
  modulo: PropTypes.oneOf(["CRM", "Tarifas", "Embarques"]),
};

export default VistaReportes;
