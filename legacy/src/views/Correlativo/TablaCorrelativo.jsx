import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { encryptId } from "../../api/encryptDecrypt";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import moment from "moment";

const TablaCorrelativo = (props) => {
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                     PROPS                                    #
   * # ---------------------------------------------------------------------------- #
   * Obtener las propiedades y eventos del componente
   */
  const { lista, reConsultar, estados = [] } = props;
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
  const encabezados = [
    { name: "correlativo_id", label: "Correlativo", campo: "correlativo_id" },
    { name: "tabla_correlativo", label: "Tabla", campo: "tabla_correlativo" },
    { name: "correlativo_codigo", label: "Codigo", campo: "correlativo_codigo" },
    { name: "correlativo_actual", label: "Actual", campo: "correlativo_actual" },
    { name: "correlativo_inicial", label: "Inicial", campo: "correlativo_inicial" },
    { name: "correlativo_final", label: "Final", campo: "correlativo_final" },
    { name: "correlativo_serie", label: "Serie", campo: "correlativo_serie" },
    { name: "nombre_cc", label: "Centro de Costo", campo: "nombre_cc" },
    { name: "nombre_emp", label: "Empresa", campo: "nombre_emp" },
    { name: "nom_tipo", label: "Tipo", campo: "nom_tipo" },
    {
      name: "correlativo_fecha_vencimiento",
      label: "Fecha Vencimiento",
      campo: "correlativo_fecha_vencimiento",
      formato: (v) => (v ? moment(v).format("DD-MM-YYYY HH:mm:ss") : ""),
      soert: (a, b) => (!a || !b ? 0 : moment(a).isBefore(moment(b)) ? -1 : 1),
    },
    { name: "estado_desc", label: "Estado", campo: "estado_desc" },
    {
      name: "correlativo_fecha",
      label: "Fecha",
      campo: "correlativo_fecha",
      formato: (v) => (v ? moment(v).format("DD-MM-YYYY HH:mm:ss") : ""),
      soert: (a, b) => (!a || !b ? 0 : moment(a).isBefore(moment(b)) ? -1 : 1),
    },
    // { name: "cod_cc", label: "Centro de Costo", campo: "cod_cc" },
    // { name: "cod_empresa", label: "Empresa", campo: "cod_empresa" },
    // { name: "cod_tipo", label: "Tipo", campo: "cod_tipo" },
    // { name: "cod_estado", label: "Estado", campo: "cod_estado" }, 
    // cod_cc, cod_empresa, cod_tipo, cod_estado
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
        // estado: estados.find((e) => i.COD_ESTADO === e.COD_ESTADO),
        /**
         * ACCIONES DE LA TABLA POR ELEMENTO
         */
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
const eliminarFila = (fila) => {
  const{
  correlativo_id,
  tabla_correlativo,
  correlativo_codigo,
  correlativo_actual,
  correlativo_inicial,
  correlativo_final,
  correlativo_serie,
  cod_cc,
  cod_empresa,
  cod_estado,
  cod_tipo,
  correlativo_fecha,
  correlativo_fecha_vencimiento,
  } = fila.content;

  const datosEnviar = {
    correlativo_id,
    correlativo_tabla: tabla_correlativo,
    correlativo_codigo,
    correlativo_actual,
    correlativo_inicial,
    correlativo_final,
    correlativo_fecha,
    correlativo_fecha_vencimiento,
    correlativo_serie,
    cod_empresa,
    cod_cc,
    cod_tipo,
    cod_estado: 4, 
  };
  api.post("/api/appweb/actualizar-correlativos", datosEnviar).then((i) => reConsultar());
};

//   const eliminarFila = (fila) => {

//   const datosEnviar = {
//     ...fila.content,
//     correlativo_tabla: fila.content.tabla_correlativo,
//     cod_estado: 4, 
//   };
//   api.post("/api/appweb/actualizar-correlativos", datosEnviar).then((i) => reConsultar());
// };

  // const eliminarFila = (fila) => api.post("/api/appweb/actualizar-correlativos", { ...fila.content, cod_estado: 4  }).then((i) => reConsultar());

  // Ir a la vista de Correlativo en modo vista
  const verAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);
  // Ir a la vista de Correlativo en modo editar
  // const editarAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        id="correlativo_id"
        encabezado={encabezados}
        datos={datos}
        onFilaSeleccionada={(fila) => {
          // console.log("select", fila);
        }}
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
          delete: (fila) => {
            // console.log("Datos enviados", datosEnviar);
            setMostrarAlerta(true);
            setFilaSeleccionada(fila);
          },
        }}
        botones={{ nuevo: { label: "nuevo", onClick: () => navigate(`${encryptId(`new`)}`), color: "primary" } }}
        multipleSelect
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
        tipo="error"
        handleClose={() => {}}
        content={"¿Esta seguro que desea eliminar el registro?"}
      />
    </Box>
  );
};
TablaCorrelativo.propTypes = {
  // LISTA DE DATOS
  lista: PropTypes.array,
  // CATALOGOS
  estados: PropTypes.array,
  // EVENTOS
  reConsultar: PropTypes.func,
};
export default TablaCorrelativo;
