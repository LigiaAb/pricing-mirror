import React, { useState } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { Grid } from "@mui/material";
import TabComponent from "../../../components/Tabs/TabComponent";
import FormularioFacturacion from "../../../views/Facturacioin/Facturacion/FormularioFacturacion";

const VistaFacturacion = (props) => {
  const { currentCategoria } = useSelector((s) => s.menu);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(false);

  return (
    <Grid>
      <TabComponent tabSeleccionado={setOpcionSeleccionada} opciones={currentCategoria?.opciones.filter((i) => i.nivel_opcion === "I").map((i) => ({ ...i, id: i.cod_opcion, label: i.nom_opcion }))} />
      {<FormularioFacturacion />}
    </Grid>
  );
};

VistaFacturacion.propTypes = {};

export default VistaFacturacion;
