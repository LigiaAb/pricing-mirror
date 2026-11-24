import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Grid, Icon, Typography } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { encryptId } from "../../api/encryptDecrypt";
const TablaModulo = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const { lista, reConsultar, estados = [] } = props;
  const navigate = useNavigate();
  /**
   * USE STATE
   * Lista de States
   */
  // Encabezados
  const encabezados = [
    { name: "cod_modulo", label: "Código", campo: "cod_modulo" },
    { name: "nom_modulo", label: "Nombre", campo: "nom_modulo" },
    {
      name: "ico_modulo",
      label: "Ícono",
      campo: "ico_modulo",
      formato: (val) => (
        <Grid container>
          <Grid mx={1}>
            <Typography className={val} component="span" fontSize="small" />
          </Grid>
          <Grid>{val}</Grid>
        </Grid>
      ),
    },
    { name: "modulo_ruta", label: "Ruta", campo: "modulo_ruta" },
    { name: "cod_estado", label: "Estado", campo: "cod_estado", formato: (val, row) => row.content.estado_desc },
    // { name: "estado_desc", label: "estado_desc", campo: "estado_desc" },
  ];
  const datos = useMemo(() => {
    const baseUrl = `${window.location.pathname}`;
    return lista.map((i) => {
      // Generacion de objeto para propiedades de celdas
      let o = {};
      Object.keys(i).forEach(
        (d) =>
          (o[d] = {
            color: undefined,
            bold: undefined,
          })
      );
      // Refactorizacion de Arreglo segun catalogos
      return {
        /**
         * FORMATO DE ELEMENTO
         */
        ...i,
        /**
         * MANEJO DE CATALOGOS POR ELEMENTO
         */
        // Buscar el estado
        // estado: estados.find((e) => i.COD_ESTADO === e.COD_ESTADO),
        /**
         * ACCIONES DE LA TABLA POR ELEMENTO
         */
        url: `${baseUrl}/${encryptId(i.cod_modulo)}`,
        accionesDeTabla: {
          add: false,
          view: true,
          go: false,
          copy: false,
          paste: false,
          auth: false,
          edit: false,
          excel: false,
          pdf: false,
          download: false,
          delete: i.cod_estado === 1,
        },
        /**
         * ACCIONES DEL ELEMENTO
         */
        propiedadesDeTabla: o,
      };
    });
  }, [lista]);
  /**
   * ACCIONES A REALIZAAR SEGUN BOTON DE LA TABLA
   */
  // Cambiar el estado de la fila a activo y pide reconsultar la informacion
  const reactivarFila = (fila) => api.post("/api/appweb/", { ...fila.content, cod_estado: 1 }).then((i) => reConsultar());
  // Cambiar el estado de la fila a anulado y pide reconsultar la informacion
  const eliminarFila = (fila) => api.post("/api/appweb/eliminarmodulo", { ...fila.content }).then((i) => reConsultar());
  // Ir a la vista de Modulo en modo vista
  const verAFila = (fila) => fila && navigate(`${encryptId(`${fila.id}`)}`);
  // Ir a la vista de Modulo en modo editar
  // const editarAFila = (fila) => fila && navigate(`edit/${fila?.id}`);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        id="cod_modulo"
        encabezado={encabezados}
        datos={datos}
        // onFilaSeleccionada={(fila) => console.log("select", fila)}
        select={false}
        eventosDeTabla={{
          // add: (fila) => console.log("add", fila),
          // go: (fila) => console.log("view", fila),
          view: verAFila,
          // copy: (fila) => console.log("copy", fila),
          // paste: (fila) => console.log("paste", fila),
          // auth: reactivarFila,
          // edit: editarAFila,
          // excel: (fila) => console.log("excel", fila),
          // pdf: (fila) => console.log("pdf", fila),
          // download: (fila) => console.log("download", fila),
          delete: eliminarFila,
        }}
        botones={{ nuevo: { label: "nuevo", onClick: () => navigate(`${encryptId(`new`)}`), color: "primary" } }}
        multipleSelect
      />
    </Box>
  );
};
TablaModulo.propTypes = {
  // LISTA DE DATOS
  lista: PropTypes.array,
  // CATALOGOS
  estados: PropTypes.array,
  // EVENTOS
  reConsultar: PropTypes.func,
};
export default TablaModulo;
