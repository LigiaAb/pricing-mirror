import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import moment from "moment/moment";
const TablaCatalogoErrores = (props) => {
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
    // { name: "corre_cod_error", label: "Código de Error", campo: "corre_cod_error" },
    { name: "cod_error", label: "Código de Error", campo: "cod_error" },
    { name: "desc_error", label: "Descripcion", campo: "desc_error" },
    { name: "cod_tip_error", label: "Tipo de Error", campo: "cod_tip_error", formato: (val, row) => row.content.desc_tip_error },
    // { name: "desc_tip_error", label: "desc_tip_error", campo: "desc_tip_error" },
    { name: "fecha_reg", label: "Fecha de Registro", campo: "fecha_reg", formato: (val, row) => moment(val).format("DD-MM-YYYY HH:mm:ss") },
  ];
  const datos = useMemo(() => {
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
        estado: estados.find((e) => i.COD_ESTADO === e.COD_ESTADO),
        /**
         * ACCIONES DE LA TABLA POR ELEMENTO
         */
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
        /**
         * ACCIONES DEL ELEMENTO
         */
        propiedadesDeTabla: o,
      };
    });
  }, [estados, lista]);
  /**
   * ACCIONES A REALIZAAR SEGUN BOTON DE LA TABLA
   */
  // Cambiar el estado de la fila a activo y pide reconsultar la informacion
  const reactivarFila = (fila) => api.post("/api/appweb/", { ...fila.content, cod_estado: 1 }).then((i) => reConsultar());
  // Cambiar el estado de la fila a anulado y pide reconsultar la informacion
  const eliminarFila = (fila) => api.post("/api/appweb/", { ...fila.content, cod_estado: 4 }).then((i) => reConsultar());
  // Ir a la vista de CatalogoErrores en modo vista
  const verAFila = (fila) => fila && navigate(`view/${fila?.id}`);
  // Ir a la vista de CatalogoErrores en modo editar
  const editarAFila = (fila) => fila && navigate(`edit/${fila?.id}`);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        id="corre_cod_error"
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
          auth: reactivarFila,
          edit: editarAFila,
          // excel: (fila) => console.log("excel", fila),
          // pdf: (fila) => console.log("pdf", fila),
          // download: (fila) => console.log("download", fila),
          delete: eliminarFila,
        }}
        multipleSelect
      />
    </Box>
  );
};
TablaCatalogoErrores.propTypes = {
  // LISTA DE DATOS
  lista: PropTypes.array,
  // CATALOGOS
  estados: PropTypes.array,
  // EVENTOS
  reConsultar: PropTypes.func,
};
export default TablaCatalogoErrores;
