import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Grid, Icon, Typography } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { encryptId } from "../../api/encryptDecrypt";
const TablaMenu = (props) => {
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
    { name: "cod_menu", label: "Código", campo: "cod_menu" },
    { name: "nom_menu", label: "Nombre", campo: "nom_menu" },
    {
      name: "ico_menu",
      label: "Ícono",
      campo: "ico_menu",
      formato: (val) => (
        <Grid container>
          <Grid mx={1}>
            <Typography className={val} component="span" fontSize="small" />
          </Grid>
          <Grid>{val}</Grid>
        </Grid>
      ),
    },
    { name: "menu_ruta", label: "Ruta", campo: "menu_ruta" },
    { name: "cod_emp", label: "Empresa", campo: "cod_emp", formato: (val, row) => row.content.nombre_emp },
    { name: "cod_cc", label: "Centro de Costo", campo: "cod_cc", formato: (val, row) => row.content.nombre_cc },
    { name: "cod_modulo", label: "Módulo", campo: "cod_modulo", formato: (val, row) => row.content.nom_modulo || "" },
    // { name: "nombre_emp", label: "nombre_emp", campo: "nombre_emp", formato: (val, row) => row.content.estado_desc },
    // { name: "nombre_cc", label: "nombre_cc", campo: "nombre_cc", formato: (val, row) => row.content.estado_desc },
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
        url: `${baseUrl}/${encryptId(`${i.cod_menu}`)}`,
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
          delete: true,
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
  const eliminarFila = (fila) => api.post("/api/appweb/eliminar-menu", { ...fila.content }).then((i) => reConsultar());
  // Ir a la vista de Menu en modo vista
  const verAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);
  // Ir a la vista de Menu en modo editar
  // const editarAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        id="cod_menu"
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
TablaMenu.propTypes = {
  // LISTA DE DATOS
  lista: PropTypes.array,
  // CATALOGOS
  estados: PropTypes.array,
  // EVENTOS
  reConsultar: PropTypes.func,
};
export default TablaMenu;
