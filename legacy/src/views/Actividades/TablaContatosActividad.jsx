import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Grid } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import useObtenerOpcionesAcciones from "../../hooks/useObtenerOpcionesAcciones";
import DialogComponent from "../../components/Dialog/DialogComponent";
import FormularioCompletoEntidadContactos from "../Entidad/EntidadContactos/FormularioCompletoEntidadContactos";
const TablaContactosActividad = (props) => {
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                     PROPS                                    #
   * # ---------------------------------------------------------------------------- #
   * Obtener las propiedades y eventos del componente
   */
  const { lista, reConsultar, catalogos = {}, obtenerFilaSeleccionada = () => {}, handleNuevo, cliente = null, newBtn = true } = props;
  const { empresas, estados, paises, ciudades, industrias, tipos, cencos } = catalogos;
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
    { name: "entidadcontacto_id", label: "Codigo", campo: "entidadcontacto_id" },
    { name: "entidadcontacto_nombre", label: "Nombre", campo: "entidadcontacto_nombre" },
    { name: "entidadcontacto_email", label: "Email", campo: "entidadcontacto_email" },
    { name: "entidadcontacto_telefono", label: "Telefono", campo: "entidadcontacto_telefono" },
    { name: "tipos_string", label: "Tipos", campo: "tipos_string" },
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
        accionesDeTabla: {
          ...i.accionesDeTabla,
          ...{ view: false, add: false, go: false, excel: false, pdf: false, download: false, auth: newBtn },
        },
      };
    });
  }, [estados, lista]);

  const eliminarFila = (fila) => api.post("/api/appweb/", { ...fila.content, cod_estado: 4 }).then((i) => reConsultar());

  const verAFila = (fila) => {
    setFilaSeleccionada(fila?.content);
    if (cliente) {
      setOpen(true);
    } else {
      alert("Error al cargar el cliente");
    }
  };

  const seleccionarFila = (fila) => {
    return fila && obtenerFilaSeleccionada(fila?.content);
  };

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        id="entidadcontacto_id"
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
        botones={newBtn ? { nuevo: { label: "nuevo", onClick: () => handleNuevo(), color: "primary" } } : {}}
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
          <Grid sx={{ display: "flex", flexDirection: "column", px: 3 }}>
            <p>{JSON.stringify(filaSeleccionada)}</p>
            <FormularioCompletoEntidadContactos
              dataGet={filaSeleccionada}
              id={filaSeleccionada?.entidadcontacto_id}
              tipo={5}
              cliente={cliente}
              catalogos={{ empresas, estados, paises, ciudades, industrias, tipos, cencos }}
              onCreate={null}
              onActividad
            />
          </Grid>
        }
      />
    </Box>
  );
};
TablaContactosActividad.propTypes = {
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
export default TablaContactosActividad;
