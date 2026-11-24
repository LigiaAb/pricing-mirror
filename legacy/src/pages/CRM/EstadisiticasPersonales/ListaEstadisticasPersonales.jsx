import React from "react";
import PropTypes from "prop-types";
import { Box, Grid } from "@mui/material";
import TabComponent from "../../../components/Tabs/TabComponent";
import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";
import GraficasEstadisticasPersonales from "../../../views/CRM/EstadisiticasPersonales/GraficasEstadisticasPersonales";

const ListaEstadisticasPersonales = () => {
  const { permisosArray, catalogoArray } = useObtenerOpcionesAcciones();

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TabComponent
        tabInicial={catalogoArray.filter((o) => o.nivel_opcion === "E")[0]?.cod_opcion}
        opciones={catalogoArray
          .filter((i) => i.nivel_opcion === "E")
          .map((o) => ({
            ...o,
            id: o.cod_opcion,
            label: o.nom_opcion,
            icono: o.ico_opcion,
            disable: !permisosArray.find((pa) => pa.cod_opcion === o.cod_opcion),
            content: o.nom_opcion === "Estadisticas" ? <GraficasEstadisticasPersonales /> : <></>,
          }))}
      />
    </Box>
  );
};

ListaEstadisticasPersonales.propTypes = {};

export default ListaEstadisticasPersonales;
