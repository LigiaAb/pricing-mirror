import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
const TablaPuestoRol = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const { lista, reConsultar, estados = [], subTabla, retornarDatos } = props;
  const navigate = useNavigate();
  /**
   * USE STATE
   * Lista de States
   */
  // Encabezados
  const encabezados = [
    { name: "cod_puesto", label: "Código", campo: "cod_puesto" },
    { name: "nom_puesto", label: "Puesto", campo: "nom_puesto" },
    { name: "cod_rol", label: "Rol", campo: "cod_rol", formato: (id, row) => row.content.rol_desc },
    { name: "cod_estado", label: "Estado", campo: "cod_estado", formato: (id, row) => row.content.estado_desc },
    { name: "fecha_reg", label: "Fehca de Generación", campo: "fecha_reg" },
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
          view: !!subTabla,
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
  }, [estados, lista, subTabla]);
  /**
   * ACCIONES A REALIZAAR SEGUN BOTON DE LA TABLA
   */
  // Cambiar el estado de la fila a activo y pide reconsultar la informacion
  const reactivarFila = (fila) => api.post("/api/appweb/", { ...fila.content, cod_estado: 1 }).then((i) => reConsultar());
  // Cambiar el estado de la fila a anulado y pide reconsultar la informacion
  const eliminarFila = (fila) => api.post("/api/appweb/", { ...fila.content, cod_estado: 4 }).then((i) => reConsultar());
  // Ir a la vista de PuestoRol en modo vista
  const verAFila = (fila) => (subTabla ? retornarDatos(fila.content) : fila && navigate(`view/${fila?.id}`));
  // Ir a la vista de PuestoRol en modo editar
  const editarAFila = (fila) => fila && navigate(`edit/${fila?.id}`);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        id="test"
        encabezado={encabezados}
        datos={datos}
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
TablaPuestoRol.propTypes = {
  // LISTA DE DATOS
  lista: PropTypes.array,
  // CATALOGOS
  estados: PropTypes.array,
  // EVENTOS
  reConsultar: PropTypes.func,
  // MANEJO DE ACCIONES
  subTabla: PropTypes.bool,
  retornarDatos: PropTypes.func,
};
export default TablaPuestoRol;
