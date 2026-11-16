import { Box } from "@mui/material";
import TabComponent from "../../components/Tabs/TabComponent";
import useObtenerOpcionesAcciones from "../../hooks/useObtenerOpcionesAcciones";
import CreacionTarifa from "./CreacionTarifa/CreacionTarifa";
import React from "react";

const VistaTarifas = () => {
  // const { catalogoArray: opcionesTarifas } = useObtenerOpcionesAcciones();

  // const opcionesConFormato = React.useMemo(
  //   () =>
  //     opcionesTarifas.map((o) => {
  //       let opcionConFormato = {
  //         id: o.cod_opcion,
  //         label: o.nom_opcion,
  //         icono: o.ico_opcion,
  //         disabled: false,
  //       };

  //       switch (o.nom_opcion) {
  //         case "Servicios":
  //           opcionConFormato.content = <CreacionTarifa />;
  //           break;
  //       }

  //       return opcionConFormato;
  //     }),
  //   [opcionesTarifas],
  // );

  // const codigoOpcionInicial = opcionesTarifas.find((o) => o.nivel_opcion === "E")?.cod_opcion || null;

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, display: "flex", flexDirection: "column", gap: 1 }}>
      <CreacionTarifa />
      {/* <TabComponent tabInicial={codigoOpcionInicial} opciones={opcionesConFormato} /> */}
    </Box>
  );
};

export default VistaTarifas;
