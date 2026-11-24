import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { encryptId } from "../../api/encryptDecrypt";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import TablaEditableComponent from "../../components/Tabla/TablaEditableComponent";
const TablaTipo = (props) => {
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
    { name: "cod_tipo", editable: false, label: "Codigo", campo: "cod_tipo" },
    { name: "nom_tipo", tipo: "text", label: "Nombre", campo: "nom_tipo" },
    { name: "tipo_tabla", tipo: "text", label: "Tabla", campo: "tipo_tabla" },
    { name: "cod_estado", editable: false, default: 1, label: "Estado", campo: "cod_estado", formato: (val, row) => row.estado_desc },
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
          }),
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
          add: true,
          view: true,
          go: false,
          copy: false,
          paste: false,
          auth: false,
          edit: true,
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
  const eliminarFila = (id, fila) => api.post("/api/appweb/actualizar-tipo", { ...fila, cod_estado: 4 }).then((i) => reConsultar());
  const editarFila = (id, fila) => api.post("/api/appweb/actualizar-tipo", { ...fila, cod_estado: 1 }).then((i) => reConsultar());
  const insertarFila = (id, fila) => api.post("/api/appweb/insertar-tipo", { ...fila, cod_estado: 1 }).then((i) => reConsultar());
  // Ir a la vista de Tipo en modo vista
  const verAFila = (id, fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);
  // Ir a la vista de Tipo en modo editar
  // const editarAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaEditableComponent
        rowKey="cod_tipo"
        encabezados={encabezados}
        data={datos}
        onRowAdded={insertarFila}
        onRowUpdated={editarFila}
        onRowDeleted={eliminarFila}
        onRowView={verAFila}
        acciones={{ view: true, delete: true, edit: true, add: true }}
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
TablaTipo.propTypes = {
  // LISTA DE DATOS
  lista: PropTypes.array,
  // CATALOGOS
  estados: PropTypes.array,
  // EVENTOS
  reConsultar: PropTypes.func,
};
export default TablaTipo;
