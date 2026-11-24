import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Button, Grid, Icon, Typography } from "@mui/material";
import TablaComponent from "../../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { api } from "../../../api";
import { encryptId, decryptId } from "../../../api/encryptDecrypt";
import ActionAlertComponent from "../../../components/Dialog/ActionAlertComponent";
import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";
import DialogComponent from "../../../components/Dialog/DialogComponent";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import SubirArchivoComponent from "../../../components/Formulario/SubirArchivoComponent";
import LoaderComponent from "../../../components/Loader/LoaderComponent";

const TablaEntidadAsignacionPersonal = (props) => {
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                     PROPS                                    #
   * # ---------------------------------------------------------------------------- #
   * Obtener las propiedades y eventos del componente
   */
  const { lista, reConsultar, catalogos = {}, onView = () => {}, onNew = () => {}, updateData, setUpdateData } = props;
  const { estados = [] } = catalogos;
  const navigate = useNavigate();
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                   USE STATE                                  #
   * # ---------------------------------------------------------------------------- #
   * Lista de States
   */
  // Encabezados
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [open, setOpen] = useState(false);
  const [mostrarLoader, setMostrarLoader] = useState(false);
  const permisosBase = {
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
  };
  const [loading, setLoading] = useState(false);
  const [archivo, setArchivo] = useState();
  const { permisosArray, catalogoArray, catalogoObj, permisosObj } = useObtenerOpcionesAcciones();
  const encabezados = [
    // { name: "entidad_id", label: "Id", campo: "entidad_id" },
    // { name: "cod_asignacion", label: "Código", campo: "cod_asignacion" },
    // { name: "empleado", label: "Empleado", campo: "empleado" },
    { name: "nombre_cliente", label: "Cliente", campo: "nombre_cliente" },
    { name: "nom_tipo", label: "Tipo Asignacion", campo: "nom_tipo" },
    { name: "fecha_inicial", label: "Fecha Inicio", campo: "fecha_inicial", formato: (val, row) => (row.content.fecha_inicial ? new Date(row.content.fecha_inicial).toLocaleDateString() : "") },
    { name: "fecha_final", label: "Fecha Final", campo: "fecha_final", formato: (val, row) => (row.content.fecha_final ? new Date(row.content.fecha_final).toLocaleDateString() : "") },
    { name: "cod_estado", label: "Estado", campo: "cod_estado", formato: (val, row) => row.content.estado_desc },
  ];
  const obtenerAccionesSegunPermisos = () => {
    let item = permisosArray.find((i) => i.nom_opcion === "Lista");
    return {
      ...permisosBase,
      view: item.acciones.find((i) => i.cod_accion === 1) || item.acciones.find((i) => i.cod_accion === 2),
      delete: false
    };
  };
  const datos = useMemo(() => {
    return lista.map((i) => {
      // Generacion de objeto para propiedades de celdas
      let o = {};
      Object.keys(i).forEach(
        (d) =>
          (o[d] = {
            color: d === "cod_estado" ? (i.cod_estado === 1 ? "green.main" : "red.main") : undefined,
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
        accionesDeTabla: { ...obtenerAccionesSegunPermisos() },
        /**
         * ACCIONES DEL ELEMENTO
         */
        propiedadesDeTabla: o,
      };
    });
  }, [lista]);

  const verAFila = (fila) => fila && onView(fila?.content)
  const nuevoReg = (fila) => fila && onView(fila?.content)

  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* <pre>{JSON.stringify(datos, null, 2)}</pre> */}
      <TablaComponent
        id="cod_asignacion"
        encabezado={encabezados}
        datos={datos}
        onFilaSeleccionada={(seleccion) => console.log(seleccion)}
        select={false}
        // expandible
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
          // delete: (fila) => {
          //   setMostrarAlerta(true);
          //   setFilaSeleccionada(fila);
          // },
        }}
        botones={{
          nuevo: { label: "Solicitar", onClick: onNew, color: "primary" },
        }}
        multipleSelect
      />
    </Box>
  );
};
TablaEntidadAsignacionPersonal.propTypes = {
  // LISTA DE DATOS
  lista: PropTypes.array,
  // CATALOGOS
  estados: PropTypes.array,
  // EVENTOS
  reConsultar: PropTypes.func,

  codTipo: PropTypes.number,

  permiteCrear: PropTypes.bool,

  catalogos: PropTypes.object,
};
export default TablaEntidadAsignacionPersonal;
