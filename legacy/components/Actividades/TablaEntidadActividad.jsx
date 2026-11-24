import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { encryptId } from "../../api/encryptDecrypt";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import useObtenerOpcionesAcciones from "../../hooks/useObtenerOpcionesAcciones";
import DialogComponent from "../../components/Dialog/DialogComponent";
import VistaCliente from "../../pages/Entidad/VistaEntidad";
const TablaEntidadActividad = (props) => {
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                     PROPS                                    #
   * # ---------------------------------------------------------------------------- #
   * Obtener las propiedades y eventos del componente
   */
  const { lista, reConsultar, catalogos = {}, obtenerFilaSeleccionada = () => {}, handleNuevo} = props;
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

  const [open, setOpen] = useState(false);

  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const permisosBase = {
    add: false,
    view: true,
    go: true,
    copy: false,
    paste: false,
    auth: true,
    edit: false,
    excel: false,
    pdf: false,
    download: false,
    delete: false,
  };

  const { permisosArray } = useObtenerOpcionesAcciones();
  const encabezados = [
    { name: "UNIQUE_ID", label: "No.", campo: "UNIQUE_ID" },
    { name: "CODIGO_ENTIDAD", label: "Código", campo: "CODIGO_ENTIDAD" },
    { name: "ENTIDADNOMBRE_NOMBRE", label: "Nombre", campo: "ENTIDADNOMBRE_NOMBRE" },
    { name: "TIPO_DESCRIPCION", label: "Tipo", campo: "TIPO_DESCRIPCION" },
    // { name: "estado_id", label: "Estado", campo: "estado_id", formato: (val, row) => row.content.estado_desc },
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

      return {
        ...i,
        estado: estados.find((e) => i.estado_id === e.cod_estado),
        propiedadesDeTabla: o,
      };
    });
  }, [estados, lista]);

  const eliminarFila = (fila) => api.post("/api/appweb/", { ...fila.content, cod_estado: 4 }).then((i) => reConsultar());

  const verAFila = (fila) => {
    setFilaSeleccionada(fila?.content)
    setOpen(true)
    // console.log(fila?.content)
    // return fila && obtenerFilaSeleccionada(fila?.content);
  };

  const seleccionarFila = (fila) => {
    return fila && obtenerFilaSeleccionada(fila?.content);
  };

  // Ir a la vista de EntidadNombres en modo editar
  // const editarAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        id="UNIQUE_ID"
        encabezado={encabezados}
        datos={datos}
        onFilaSeleccionada={(fila) => console.log("select", fila)}
        eventosDeTabla={{
          // add: (fila) => console.log("add", fila),
          // go: (fila) => console.log("go", fila),
          view: (fila) => verAFila(fila),
          // copy: (fila) => console.log("copy", fila),
          // paste: (fila) => console.log("paste", fila),
          auth: (fila) => seleccionarFila(fila),
          // edit: editarAFila,
          // excel: (fila) => console.log("excel", fila),
          // pdf: (fila) => console.log("pdf", fila),
          // download: (fila) => console.log("download", fila),
          // delete: (fila) => console.log("download", fila),
        }}
        botones={{ nuevo: { label: "nuevo", onClick: () => handleNuevo(), color: "primary" } }}
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
      

      <DialogComponent 
        openDialog={open}
        handleClose={() => setOpen(false)}
        titulo=""
        width="80vw"
        children={
          <VistaCliente
            id_prop={filaSeleccionada ? filaSeleccionada["ENTIDAD_ID"] : 0}
            tipo_prop={filaSeleccionada ? filaSeleccionada["COD_TIPO"] : 0}
            tipoStr={filaSeleccionada ? filaSeleccionada["TIPO_DESCRIPCION"] : "CLIENTE"}
          />
          // <p>{JSON.stringify(filaSeleccionada)}</p>
        }
      />

    </Box>
  );
};
TablaEntidadActividad.propTypes = {
  // LISTA DE DATOS
  lista: PropTypes.array,
  // CATALOGOS
  estados: PropTypes.array,
  // EVENTOS
  reConsultar: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,

  obtenerFilaSeleccionada: PropTypes.func,
};
export default TablaEntidadActividad;
