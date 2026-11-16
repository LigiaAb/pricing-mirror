import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Icon, Switch, Typography } from "@mui/material";
import TablaComponent from "../../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { api } from "../../../api";
import { encryptId } from "../../../api/encryptDecrypt";
import ActionAlertComponent from "../../../components/Dialog/ActionAlertComponent";
const TablaMetodo = (props) => {
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                     PROPS                                    #
   * # ---------------------------------------------------------------------------- #
   * Obtener las propiedades y eventos del componente
   */
  const { lista, reConsultar, catalogos = {}, onNuevoClick = () => {}, onFilaSeleccionada = () => {} } = props;
  const { estados = [], tipos = [], tiposTarifa = [], servicio } = catalogos;
  const navigate = useNavigate();
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                   USE STATE                                  #
   * # ---------------------------------------------------------------------------- #
   * Lista de States
   */
  // Encabezados
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [listaConsultada, setListaConsultada] = useState([]);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const encabezados = [
    { name: "cod_metodo", label: "Metodo", campo: "cod_metodo" },
    { name: "servicio", label: "Servicio", campo: "servicio", formato: (val, row) => val?.nombre },
    {
      name: "todos_los_paises",
      label: "Apilca a todos los Destinos",
      campo: "todos_los_paises",
      formato: (val, row) => <Icon className={val ? "c-cheque" : "c-x1"} sx={{ fontSize: 12, width: "100%", textAlign: "center" }} />,
    },
    { name: "tipo", label: "Tipo", campo: "tipo", formato: (val, row) => val?.label },
    { name: "tipo_tarifa", label: "Tipo de Tarifa", campo: "tipo_tarifa", formato: (val, row) => val?.label },
    // {
    //   name: "estado",
    //   label: "Estado",
    //   campo: "estado",
    //   formato: (val, row) => (
    //     <Typography>
    //       <Icon className={val?.cod_estado === 1 ? "c-cheque" : "c-x1"} sx={{ fontSize: 10 }} /> {val?.estado_desc}
    //     </Typography>
    //   ),
    // },
  ];
  const datos = useMemo(() => {
    return listaConsultada.map((i) => {
      // Genera los campos de la tabla
      const data = {
        /**
         * FORMATO DE ELEMENTO
         */
        ...i,
        /**
         * MANEJO DE CATALOGOS POR ELEMENTO
         */
        // Buscar el estado
        estado: estados.find((e) => i.cod_estado === (e["value"] || e["cod_estado"])),
        tipo: tipos.find((e) => i.cod_tipo === (e["value"] || e["cod_tipo"])),
        tipo_tarifa: tiposTarifa.find((e) => i.cod_tipo_tarifa === (e["value"] || e["cod_tipo"])),
        /**
         * ACCIONES DE LA TABLA POR ELEMENTO
         */
      };

      // Generacion de objeto para propiedades de celdas
      let o = {};
      Object.keys(data).forEach((d) =>
        d === "estado"
          ? (o[d] = { color: i.cod_estado === 1 ? "primary.dark" : "error.main", bold: true })
          : d === "todos_los_paises"
          ? (o[d] = { color: i.todos_los_paises ? "primary.dark" : "error.main", bold: true })
          : (o[d] = { color: undefined, bold: undefined })
      );
      // Refactorizacion de Arreglo segun catalogos
      return {
        ...data,
        accionesDeTabla: {
          add: false,
          view: i.cod_estado === 1,
          go: false,
          copy: false,
          paste: false,
          auth: false,
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
  }, [estados, lista, tipos, tiposTarifa]);
  /**
   * ACCIONES A REALIZAAR SEGUN BOTON DE LA TABLA
   */

  const obtenerDatosBasedoEnServicio = useCallback(async () => {
    if (servicio)
      await api
        .get("api/appweb/lista-metodos", { params: { cod_estado: 1, cod_servicio: servicio ? servicio.cod_servicio : undefined } })
        .then(({ data }) => setListaConsultada(data?.data))
        .catch((e) => console.error({ e }));
    else {
      setListaConsultada([]);
      // setFilaSeleccionada(null);
    }
  }, [servicio]);

  // Cambiar el estado de la fila a activo y pide reconsultar la informacion
  // const reactivarFila = (fila) => api.post("/api/appweb/", { ...fila.content, cod_estado: 1 }).then((i) => reConsultar());
  // Cambiar el estado de la fila a anulado y pide reconsultar la informacion
  const eliminarFila = useCallback(
    (fila) => {
      // api.post("/api/appweb/", { ...fila.content, cod_estado: 4 }).then((i) => reConsultar());
      const { cod_estado } = fila;
      api.post("api/appweb/actualizar-metodos", { ...fila.content, cod_estado: 2, tipo: undefined, estado: undefined, tipo_tarifa: undefined, servicio: undefined }).then(({ data }) => {
        reConsultar();
        onFilaSeleccionada(null);
      });
    },
    [reConsultar, onFilaSeleccionada]
  );
  // Ir a la vista de Metodo en modo vista
  const verAFila = (fila) => {
    onFilaSeleccionada(fila);
    // fila && navigate(`${encryptId(`${fila?.id}`)}`);
  };
  useEffect(() => {
    obtenerDatosBasedoEnServicio();
  }, [servicio]);

  // Ir a la vista de Metodo en modo editar
  // const editarAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        id="cod_metodo"
        encabezado={encabezados}
        datos={datos}
        onFilaSeleccionada={(fila) => verAFila(fila)}
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
        botones={{ nuevo: { readonly: !servicio, label: "nuevo", onClick: () => onNuevoClick(), color: "primary" } }}
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
      {/* <pre>{JSON.stringify(datos, null, 2)}</pre> */}
    </Box>
  );
};
TablaMetodo.propTypes = {
  // LISTA DE DATOS
  lista: PropTypes.array,
  // CATALOGOS
  catalogos: PropTypes.object,
  // EVENTOS
  reConsultar: PropTypes.func,

  onNuevoClick: PropTypes.func,
  onFilaSeleccionada: PropTypes.func,
};
export default TablaMetodo;
