import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import moment from "moment/moment";
import { encryptId } from "../../api/encryptDecrypt";

const TablaPuesto = (props) => {
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
    { name: "cod_puesto", campo: "cod_puesto", label: "Código" },
    { name: "puesto_desc", campo: "puesto_desc", label: "Descripción" },
    { name: "cod_emp", campo: "cod_emp", label: "Empresa", formato: (val, row) => row.content.nombre_emp },
    { name: "cod_cc", campo: "cod_cc", label: "Centro de Costo", formato: (val, row) => row.content.nombre_cc },
    // { name: "nombre_emp", campo: "nombre_emp", label: "nombre_emp" },
    // { name: "nombre_cc", campo: "nombre_cc", label: "nombre_cc" },
    { name: "cod_estado", campo: "cod_estado", label: "Estado", formato: (val, row) => row.content.estado_desc },
    // { name: "estado_desc", campo: "estado_desc", label: "estado_desc" },
    { name: "fecha_reg", campo: "fecha_reg", label: "Fecha de registro", formato: (val) => (val ? moment(val).format("DD-MM-YYYY HH:mm:ss") : "") },
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
        // estado: estados.find((e) => i.cod_estado === e.cod_estado),
        /**
         * ACCIONES DE LA TABLA POR ELEMENTO
         */
        accionesDeTabla: {
          add: false,
          view: true,
          go: false,
          copy: false,
          paste: false,
          auth: false, // i.cod_estado === 4,
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
  // const reactivarFila = (fila) => api.post("/api/appweb/", { ...fila.content, cod_estado: 1 }).then((i) => reConsultar());
  // Cambiar el estado de la fila a anulado y pide reconsultar la informacion
  const eliminarFila = (fila) => api.post("/api/appweb/eliminar-puesto", { ...fila.content, cod_estado: 4 }).then((i) => reConsultar());
  // Ir a la vista de Puesto en modo vista
  const verAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        id="cod_puesto"
        encabezado={encabezados}
        datos={datos}
        // // onFilaSeleccionada={(fila) => console.log("select", fila)}
        select={false}
        eventosDeTabla={{
          // add: (fila) => console.log("add", fila),
          // go: (fila) => console.log("view", fila),
          view: verAFila,
          // copy: (fila) => console.log("copy", fila),
          // paste: (fila) => console.log("paste", fila),
          // auth: reactivarFila,
          // edit: (fila) => console.log("edit", fila),
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
TablaPuesto.propTypes = {
  // LISTA DE DATOS
  lista: PropTypes.array,
  // CATALOGOS
  estados: PropTypes.array,
  // EVENTOS
  reConsultar: PropTypes.func,
};
export default TablaPuesto;
