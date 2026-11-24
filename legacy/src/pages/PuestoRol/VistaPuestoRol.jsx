import React, { useCallback, useEffect, useState } from "react";
import FormularioCompletoPuestoRol from "../../views/PuestoRol/FormularioCompletoPuestoRol";
import TabComponent from "../../components/Tabs/TabComponent";
import { Box, Button, Grid, Icon, Typography } from "@mui/material";
// import ModalPuestoRol from "./ModalPuestoRol";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
const VistaPuestoRol = () => {
  /**
   * PARAMETROS DE URL
   * Obtener la lista de paramentros de la url (id)
   */
  let { id } = useParams();
  /**
   * USE NAVIGATE
   * Navegacion para regresar a la lista anterior y cualquier ruta necesaria en el futuro
   */
  const navigate = useNavigate();
  /**
   * USE STATE
   * Lista de States
   */
  const [item, setItem] = useState({});
  /**
   * CONSULTA DE DATOS
   * Consulta a base de datos de la lista
   */
  // Obtener los datos del crud
  const obtenerDatos = useCallback(async () => {
    await api
      .get("api/appweb/")
      .then(({ data }) => setItem(data.data))
      .catch((e) => console.error(e));
  }, []);
  // Realizar la consulta
  useEffect(() => {
    Promise.all([obtenerDatos()]);
  }, [obtenerDatos]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* Boton para regresar a la lista */}
      <Button color="primary" onClick={() => navigate(-1)}>
        <Icon className="c-derecha-arriba-izquierda" />
        Regresar a la lista
      </Button>
      {/* Nombre del elemento */}
      <Typography variant="h2">PuestoRol {id}</Typography>
      {/* Tabs para la pantalla */}
      <TabComponent
        opciones={[
          // Tab principal con el formulario completo relacionado al CRUD
          {
            id: 1,
            label: "Informacion",
            content: (
              <Box sx={{ p: 1, m: 0 }}>
                <FormularioCompletoPuestoRol PuestoRol={item} />
              </Box>
            ),
          },
          // // [ TEMPORAL ] Tab que contiene el modal para maquetacion
          // {
          //   id: 2,
          //   label: "Vista de formulario Modal",
          //   content: (
          //     <Box sx={{ p: 1, m: 0 }}>
          //       <ModalPuestoRol />
          //     </Box>
          //   ),
          // },
          // Opcion adicional referente a alguna información de apoyo
          { id: 3, label: "Informacion de opcion", content: <Box sx={{ p: 1, m: 0 }}></Box> },
        ]}
      />
    </Box>
  );
};
export default VistaPuestoRol;
