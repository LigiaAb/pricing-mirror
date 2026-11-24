import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { encryptId } from "../../api/encryptDecrypt";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import moment from "moment";
const TablaUsuario = (props) => {
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                     PROPS                                    #
   * # ---------------------------------------------------------------------------- #
   * Obtener las propiedades y eventos del componente
   */
  const { lista, reConsultar, estados = [], esComponente = false, obtenerFilaSeleccionada, eventosComponente, propiedadesComponente } = props;
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
    { name: "COD_USUARIO", label: "Código", campo: "cod_usuario" },
    { name: "USUARIO", label: "Usuario", campo: "usuario" },
    { name: "RUTA INICIAL", label: "RUTA INICIAL", campo: "ruta_inicial" },
    {
      name: "cod_estado",
      label: "Estado",
      campo: "cod_estado",
      formato: (val, row) => row.content.estado?.estado_desc || "",
    },
    {
      name: "ULTIMA_CONEXION",
      label: "Ultima Conexión",
      campo: "ultima_conexion",
      formato: (dato) => (moment(dato).isValid() ? moment(dato).format("DD-MM-YYYY HH:mm:ss") : ""),
    },
  ];
  const datos = useMemo(() => {
    return lista.map((i) => {
      // Generacion de objeto para propiedades de celdas
      let o = {};
      Object.keys(i).forEach((d) => {
        o[d] = {
          color: d === "cod_estado" ? (i.cod_estado === 4 || i.cod_estado === 2 ? "red.main" : "green.main") : undefined,
          bold: d === "cod_estado" ? true : undefined,
        };
      });
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
          view: esComponente ? false : true,
          go: false,
          copy: false,
          paste: false,
          auth: false,
          edit: false,
          excel: false,
          pdf: false,
          download: false,
          delete: esComponente ? false : i.cod_estado === 4 ? false : true,
        },
        /**
         * ACCIONES DEL ELEMENTO
         */
        propiedadesDeTabla: o,
      };
    });
  }, [lista, esComponente]);
  /**
   * ACCIONES A REALIZAAR SEGUN BOTON DE LA TABLA
   */
  // Cambiar el estado de la fila a activo y pide reconsultar la informacion
  // const reactivarFila = (fila) => api.post("/api/appweb/", { ...fila.content, cod_estado: 1 }).then((i) => reConsultar());
  // Cambiar el estado de la fila a anulado y pide reconsultar la informacion
  const eliminarFila = (fila) =>
    api
      .post("/api/appweb/actualizrausuario", { ...fila.content, estado: undefined, json: undefined, ultima_conexion: undefined, cod_estado: 4 })
      .then((i) => reConsultar());
  // Ir a la vista de Usuario en modo vista
  const verAFila = (fila) => (esComponente ? obtenerFilaSeleccionada(fila) : fila && navigate(`${encryptId(`${fila?.id}`)}`));
  // Ir a la vista de Usuario en modo editar
  // const editarAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        id="cod_usuario"
        encabezado={encabezados}
        datos={datos}
        onFilaSeleccionada={(fila) => {
          eventosComponente?.obtenerUsuarioSeleccionado(fila);
        }}
        select={esComponente}
        titulo={propiedadesComponente?.titulo}
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
        botones={
          esComponente
            ? {
                asingarUsuario: {
                  label: "Asignar Usuario",
                  color: "primary",
                  onClick: (ev) => {
                    ev.preventDefault();
                    eventosComponente?.asignarUsuarios();
                  },
                },
              }
            : { nuevo: { label: "nuevo", onClick: () => navigate(`${encryptId(`new`)}`), color: "primary" } }
        }
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
        tipo="alert"
        handleClose={() => {}}
        content={"¿Esta seguro que desea eliminar el registro?"}
      />
    </Box>
  );
};
TablaUsuario.propTypes = {
  // LISTA DE DATOS
  lista: PropTypes.array,
  // CATALOGOS
  estados: PropTypes.array,
  // EVENTOS
  reConsultar: PropTypes.func,

  //TIPO DE LLAMADA
  esComponente: PropTypes.bool,
  obtenerFilaSeleccionada: PropTypes.func,
  propiedadesComponente: PropTypes.object,
  eventosComponente: PropTypes.object,
};
export default TablaUsuario;
