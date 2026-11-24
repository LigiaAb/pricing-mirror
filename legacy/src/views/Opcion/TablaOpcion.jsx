import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Button, Grid, Typography } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { encryptId } from "../../api/encryptDecrypt";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import moment from "moment";
import DialogComponent from "../../components/Dialog/DialogComponent";
import TablaDetallesComponent from "../../components/Tabla/TablaDetallesComponent";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
const TablaOpcion = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const { lista, reConsultar, estados = [], catalogos = {} } = props;
  const { categorias = [] } = catalogos;
  const navigate = useNavigate();
  /**
   * USE STATE
   * Lista de States
   */
  // Encabezados
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [filasSeleccionada, setFilasSeleccionada] = useState([]);
  const [acciones, setAcciones] = useState([]);
  const [mostrarInfoACopiar, setMostrarInfoACopiar] = useState(false);
  const [valoresCopia, setValoresCopia] = useState({ categoriaDestino: null });
  const encabezados = [
    { name: "cod_opcion", label: "Código", campo: "cod_opcion" },
    { name: "nom_opcion", label: "Nombre", campo: "nom_opcion" },
    { name: "ruta_opcion", label: "Ruta", campo: "ruta_opcion" },
    {
      name: "ico_opcion",
      label: "Ícono",
      campo: "ico_opcion",
      formato: (val, row) => (
        <Grid container>
          <Grid mx={1}>
            <Typography className={val} component="span" fontSize="small" />
          </Grid>
          <Grid>{val}</Grid>
        </Grid>
      ),
    },
    { name: "nivel_opcion", label: "Nivel", campo: "nivel_opcion", formato: (val) => (val === "I" ? "Interno" : "Externo") },
    { name: "nom_cat", label: "Categoía", campo: "nom_cat" },
    { name: "fecha_reg", label: "Fecha de Generación", campo: "fecha_reg", formato: (val) => moment(val).format("DD-MM-YYYY") },
    { name: "estado_desc", label: "Estado", campo: "estado_desc" },
  ];
  const datos = useMemo(() => {
    const baseUrl = `${window.location.pathname}`;
    return lista.map((i) => {
      // Generacion de objeto para propiedades de celdas
      let o = {};
      Object.keys(i).forEach((d) => (o[d] = { color: undefined, bold: undefined }));
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
        url: `${baseUrl}/${encryptId(`${i.cod_opcion}`)}`,
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
  const inputsCopia = useMemo(() => {
    return [
      {
        tipo: "select",
        id: "categoriaDestino",
        label: "categoria destino",
        val: valoresCopia["categoriaDestino"],
        options: categorias,
        valueOption: "cod_categoria",
        labelOption: "nom_cat",
        size: 12,
      },
    ];
  }, [valoresCopia, categorias]);
  /**
   * ACCIONES A REALIZAAR SEGUN BOTON DE LA TABLA
   */
  const consultarTodosAccionesPorOpcion = useCallback(async () => {
    await api.get("/api/appweb/lista-opcion-accion").then(({ data }) => setAcciones(data.data));
  }, []);

  // Cambiar el estado de la fila a activo y pide reconsultar la informacion
  // const reactivarFila = (fila) => api.post("/api/appweb/", { ...fila.content, cod_estado: 1 }).then((i) => reConsultar());
  // Cambiar el estado de la fila a anulado y pide reconsultar la informacion
  const eliminarFila = (fila) => api.post("/api/appweb/eliminar-opcion", { ...fila.content, cod_estado: 4 }).then((i) => reConsultar());
  // Ir a la vista de Opcion en modo vista
  const verAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);
  // Ir a la vista de Opcion en modo editar
  // const editarAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);

  const efectuarCopiaDeOpcionesYAcciones = useCallback(async () => {
    if (valoresCopia?.categoriaDestino)
      await Promise.all(
        filasSeleccionada.map(async (i) => {
          const obj = {
            ...i,
            cod_categoria: valoresCopia?.categoriaDestino?.cod_categoria,
            cod_estado: 1,
            fecha_reg: undefined,
            estado: undefined,
            url: undefined,
          };

          await api.post("api/appweb/insertar-opcion", obj).then(({ data }) => {
            Promise.all(
              acciones
                .filter((a) => a.cod_opcion === i.cod_opcion)
                .map(async (a) => {
                  const obj = {
                    cod_accion: a.cod_accion,
                    cod_categoria: valoresCopia?.categoriaDestino?.cod_categoria,
                    cod_estado: 1,
                    cod_opcion: data.data.cod_opcion,
                  };
                  await api.post("api/appweb/insertar-opcion-accion", obj);
                }),
            );
          });
        }),
      );
  }, [filasSeleccionada, valoresCopia, acciones]);

  useEffect(() => {
    consultarTodosAccionesPorOpcion();
  }, [consultarTodosAccionesPorOpcion]);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        id="cod_opcion"
        encabezado={encabezados}
        datos={datos}
        onFilaSeleccionada={(fila) => setFilasSeleccionada(fila || [])}
        select
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
        botones={{
          nuevo: { label: "nuevo", onClick: () => navigate(`${encryptId(`new`)}`), color: "primary" },
          copiar: filasSeleccionada?.length > 0 ? { label: "copiar", onClick: () => setMostrarInfoACopiar(true), color: "secondary" } : undefined,
        }}
        multipleSelect
      />
      {/* <pre>{JSON.stringify({ mostrarInfoACopiar }, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify({ valoresCopia }, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify({ filasSeleccionada }, null, 2)}</pre> */}
      <DialogComponent
        openDialog={mostrarInfoACopiar}
        handleClose={() => {
          setMostrarInfoACopiar(false);
          setValoresCopia({ categoriaDestino: null, copiarAcciones: "true" });
        }}
        titulo="Copiando Opciones"
        content={
          <Box>
            <FormularioComponent botones={{ agregar: { visible: false } }} inputs={inputsCopia} onInput={({ val, id }) => setValoresCopia((v) => ({ ...v, [id]: val }))} />
            <Typography>Opciones a Copiar</Typography>
            <TablaDetallesComponent
              columnas={[
                { id: "nom_opcion", column: "nom_opcion", label: "NOMBRE", align: "left" },
                { id: "nom_cat", column: "nom_cat", label: "CATEGORIA ORIGEN", align: "right" },
              ]}
              data={filasSeleccionada}
              id="cod_opcion"
            />
            <Grid container sx={{ mt: 1 }}>
              <Grid size="grow"></Grid>
              <Grid size="auto">
                <Button size="small" color="primary" variant="contained" onClick={efectuarCopiaDeOpcionesYAcciones}>
                  COPIAR
                </Button>
              </Grid>
            </Grid>
          </Box>
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
        tipo="error"
        handleClose={() => {}}
        content={"¿Esta seguro que desea eliminar el registro?"}
      />
    </Box>
  );
};
TablaOpcion.propTypes = {
  // LISTA DE DATOS
  lista: PropTypes.array,
  // CATALOGOS
  estados: PropTypes.array,
  // EVENTOS
  reConsultar: PropTypes.func,

  catalogos: PropTypes.object,
};
export default TablaOpcion;
