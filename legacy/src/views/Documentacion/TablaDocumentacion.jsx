import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { encryptId } from "../../api/encryptDecrypt";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import moment from "moment";

const TablaDocumentacion = (props) => {
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
    { name: "COD_DET_TIP_DOCU", label: "Codigo", campo: "cod_det_tip_docu" },
    { name: "DESC_TIP_DOCU", label: "Tipo de Documentación", campo: "desc_tip_docu" },
    { name: "DET_DESC_DOCU", label: "NOMBRE", campo: "det_desc_docu" },
    // { name: "COD_ESTADO", label: "Estado", campo: "cod_estado" },
    { name: "REG_FECHA", label: "ESTADO DE DESCRIPCION", campo: "reg_fecha", formato: (val) => moment(val).format("DD-MM-YYYY HH:mm:ss") },
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
  const eliminarFila = (fila) =>
    api.post("/api/appweb/eliminar-det-tipo-documentacion", { cod_det_tip_docu: fila.id, cod_estado: 4 }).then((i) => reConsultar());
  // Ir a la vista de Documentacion en modo vista
  const verAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);
  // Ir a la vista de Documentacion en modo editar
  // const editarAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        id="cod_det_tip_docu"
        encabezado={encabezados}
        datos={datos}
        onFilaSeleccionada={(fila) => console.log("select", fila)}
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

TablaDocumentacion.propTypes = {
  // LISTA DE DATOS
  lista: PropTypes.array,

  // CATALOGOS
  estados: PropTypes.array,

  // EVENTOS
  reConsultar: PropTypes.func,
};

export default TablaDocumentacion;
