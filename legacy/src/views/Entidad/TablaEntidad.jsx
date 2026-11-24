import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Grid } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { encryptId } from "../../api/encryptDecrypt";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import useObtenerOpcionesAcciones from "../../hooks/useObtenerOpcionesAcciones";
import TabComponent from "../../components/Tabs/TabComponent";
import TablaEditableComponent from "../../components/Tabla/TablaEditableComponent";
import LoaderComponent from "../../components/Loader/LoaderComponent";
const TablaEntidad = (props) => {
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                     PROPS                                    #
   * # ---------------------------------------------------------------------------- #
   * Obtener las propiedades y eventos del componente
   */
  const { lista, reConsultar, catalogos = {}, codTipo, permiteCrear = false, loading = false } = props;
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
  const { permisosArray, catalogoArray, catalogoObj, permisosObj } = useObtenerOpcionesAcciones();
  const encabezados = [
    // { name: "entidad_id", label: "Id", campo: "entidad_id" },
    {
      name: "codigo_entidad",
      label: "Código",
      campo: "codigo_entidad",
      sort: (a, b, ra, rb) => {
        // console.log(a, b, ra, rb, a.replace(/[a-zA-Z]/g, ""), b.replace(/[a-zA-Z]/g, ""));
        return Number(a.replace(/[a-zA-Z]/g, "")) - Number(b.replace(/[a-zA-Z]/g, ""));
      },
    },
    { name: "entidad_nombre", label: "Nombre", campo: "entidad_nombre" },
    // { name: "entidad_clasificacion", label: "Clasificación", campo: "entidad_clasificacion" },
    // { name: "cod_tipo", label: "Tipo", campo: "cod_tipo", formato: (val, row) => row.tipo_descripcion },
    { name: "cod_pais", label: "Pais", campo: "cod_pais", formato: (val, row) => row.nombre_pais },
    // { name: "cod_ciudad", label: "Ciudad", campo: "cod_ciudad", formato: (val, row) => row.nombre_ciudad },
    { name: "cod_estado", label: "Estado", campo: "cod_estado", formato: (val, row) => row.estado_desc },
  ];
  const obtenerAccionesSegunPermisos = () => {
    let item = permisosArray.find((i) => i.nom_opcion === "Lista");
    return {
      ...permisosBase,
      view: true, // item?.acciones.find((i) => i.cod_accion === 1) || item?.acciones.find((i) => i.cod_accion === 2),
      delete: item?.acciones.find((i) => i.cod_accion === 5),
    };
  };

  // Verificar si tiene permiso de agregar
  const tienePermisoAgregar = useMemo(() => {
    let item = permisosArray.find((i) => i.nom_opcion === "Lista");
    return item?.acciones?.some((i) => i.cod_accion === 3) || false;
  }, [permisosArray]);
  const convertKeysToLowerCase = (obj) => {
    if (obj === null || obj === undefined) {
      return obj;
    } else if (Array.isArray(obj)) {
      return obj.map((v) => convertKeysToLowerCase(v));
    } else if (obj !== null && obj.constructor === Object) {
      return Object.keys(obj).reduce((acc, key) => {
        acc[key.toLowerCase()] = convertKeysToLowerCase(obj[key]);
        return acc;
      }, {});
    }
    return obj;
  };
  const datos = useMemo(() => {
    return lista.map((item) => {
      const i = convertKeysToLowerCase(item);
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
  /**
   * ACCIONES A REALIZAAR SEGUN BOTON DE LA TABLA
   */
  // Cambiar el estado de la fila a activo y pide reconsultar la informacion
  // const reactivarFila = (fila) => api.post("/api/appweb/", { ...fila.content, cod_estado: 1 }).then((i) => reConsultar());
  // Cambiar el estado de la fila a anulado y pide reconsultar la informacion
  const eliminarFila = (fila) => api.post("/api/appweb/actualizar-entidad", { ...fila, cod_estado: 4, estado: undefined }).then((i) => reConsultar());
  // Ir a la vista de Cliente en modo vista
  const verAFila = (fila) => fila && navigate(`${encryptId(`${fila}`)}`);
  // Ir a la vista de Cliente en modo editar
  // const editarAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);
  return loading ? (
    <LoaderComponent sx={{ position: "block" }} />
  ) : (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaEditableComponent
        // rowKey="entidad_id"
        rowKey="entidad_id"
        encabezados={encabezados}
        data={datos}
        onFilaSeleccionada={(fila) => {}}
        isLoading={loading}
        acciones={obtenerAccionesSegunPermisos()}
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
          delete: (id, fila) => {
            setMostrarAlerta(true);
            setFilaSeleccionada(fila);
          },
        }}
        botones={tienePermisoAgregar && permiteCrear ? { nuevo: { label: "nuevo", onClick: () => navigate(`${encryptId(`new`)}`), color: "primary" } } : {}}
        multipleSelect
        // onClickFila={(data, fila) => console.log(data, fila)}
      />
      <ActionAlertComponent
        aceptar={() => {
          eliminarFila(filaSeleccionada);
          setMostrarAlerta(false);
        }}
        cancelar={() => {
          setMostrarAlerta(false);
        }}
        openDialog={mostrarAlerta}
        tipo="warning"
        handleClose={() => {}}
        content={"¿Esta seguro que desea eliminar el registro?"}
      />
    </Box>
  );
};
TablaEntidad.propTypes = {
  // LISTA DE DATOS
  lista: PropTypes.array,
  // CATALOGOS
  estados: PropTypes.array,
  // EVENTOS
  reConsultar: PropTypes.func,

  codTipo: PropTypes.number,

  permiteCrear: PropTypes.bool,

  loading: PropTypes.bool,

  catalogos: PropTypes.object,
};
export default TablaEntidad;
