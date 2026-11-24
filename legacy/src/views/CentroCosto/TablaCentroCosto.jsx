import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { encryptId } from "../../api/encryptDecrypt";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
const TablaCentroCosto = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const { lista, reConsultar, catalogos, esComponente = false, obtenerFilaSeleccionada, eventosComponente, propiedadesComponente } = props;
  const { empresas } = catalogos;
  const navigate = useNavigate();
  /**
   * USE STATE
   * Lista de States
   */
  // Encabezados
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const encabezados = useMemo(
    () => [
      { name: "cod_cc", label: "Código", campo: "cod_cc" },
      { name: "nombre_cc", label: "Nombre", campo: "nombre_cc" },
      { name: "cod_empresa_cc", label: "Empresa", campo: "cod_empresa_cc", formato: (v) => empresas?.find((i) => i.cod_empresa === v)?.nombre_emp },
    ],
    [empresas]
  );
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
  const eliminarFila = (fila) => api.post("/api/appweb/eliminarcentrocosto", { ...fila.content, cod_estado: 4 }).then((i) => reConsultar());
  // Ir a la vista de CentroCosto en modo vista
  const verAFila = (fila) => (esComponente ? obtenerFilaSeleccionada(fila) : fila && navigate(`${encryptId(`${fila?.id}`)}`));
  // Ir a la vista de CentroCosto en modo editar
  // const editarAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        id="cod_cc"
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
TablaCentroCosto.propTypes = {
  // LISTA DE DATOS
  lista: PropTypes.array,
  // EVENTOS
  reConsultar: PropTypes.func,
  // CATALOGOS
  catalogos: PropTypes.object,

  esComponente: PropTypes.bool,
  obtenerFilaSeleccionada: PropTypes.func,
  propiedadesComponente: PropTypes.object,
  eventosComponente: PropTypes.object,
};
export default TablaCentroCosto;
