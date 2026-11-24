import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import moment from "moment";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import { encryptId } from "../../api/encryptDecrypt";
const TablaEmpresa = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const { lista, reConsultar, catalogos } = props;
  const { estados = [], paises = [] } = catalogos;
  const navigate = useNavigate();
  /**
   * USE STATE
   * Lista de States
   */
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  // Encabezados
  const encabezados = [
    { name: "cod_empresa", label: "Codigo", campo: "cod_empresa" },
    { name: "nombre_emp", label: "Nombre", campo: "nombre_emp" },
    { name: "pais_emp", label: "Pais", campo: "pais_emp", formato: (val) => paises.find((p) => p.cod_pais === val)?.nombre_pais },
    { name: "nit_emp", label: "Nit", campo: "nit_emp" },
    { name: "direccion_emp", label: "Dirección", campo: "direccion_emp" },
    { name: "logo_emp", label: "Logo de empresa", campo: "logo_emp" },
    { name: "fecha_ingreso", label: "Fecha de Ingreso", campo: "fecha_ingreso", formato: (val) => moment(val).format("DD-MM-YYYY") },
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
  const reactivarFila = (fila) => api.post("/api/appweb/", { ...fila.content, cod_estado: 1 }).then((i) => reConsultar());
  // Cambiar el estado de la fila a anulado y pide reconsultar la informacion
  const eliminarFila = (fila) => api.post("/api/appweb/eliminarempresas", { cod_empresa: fila.id }).then((i) => reConsultar());
  // Ir a la vista de Empresa en modo vista
  const verAFila = (fila) => {
    console.log(fila);
    fila && navigate(encryptId(`${fila?.id}`));
  };
  // Ir a la vista de Empresa en modo editar
  const editarAFila = (fila) => fila && navigate(encryptId(`${fila?.id}`));
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        id="cod_empresa"
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
          delete: (fila) => {
            setMostrarAlerta(true);
            setFilaSeleccionada(fila);
          },
        }}
        multipleSelect
        /**
         * BOTONES
         */
        botones={{
          nuevo: { label: "nuevo", onClick: () => navigate(encryptId("new")), color: "primary" },
        }}
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
TablaEmpresa.propTypes = {
  // LISTA DE DATOS
  lista: PropTypes.array,
  // CATALOGOS
  estados: PropTypes.array,
  catalogos: PropTypes.object,
  // EVENTOS
  reConsultar: PropTypes.func,
};
export default TablaEmpresa;
