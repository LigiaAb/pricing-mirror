import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Grid, Typography } from "@mui/material";
import { api } from "../../../api";
import EditableDataGridComponent from "../../../components/Tabla/EditableDataGridComponent";
import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";
import TablaEditableComponent from "../../../components/Tabla/TablaEditableComponent";

const permisosBase = { ver: false, editar: false, eliminar: false, guardar: false };
const objetoBase = { cod_tarifa_detalle: null, descripcion: null, valor: null, cod_metodo: null, cod_tipo: null, cod_estado: null };

const FormularioCompletoDetalleMetodo = (props) => {
  const { metodo } = props;

  const [detalles, setDetalles] = useState([]);
  const [detallesConsultado, setDetallesConsultado] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const { permisosArray } = useObtenerOpcionesAcciones();
  const encabezados = useMemo(
    () => [
      { field: "tipo", headerName: "Tipo de Detalle", editable: true, type: "singleSelect", valueOptions: tipos, labelOption: "label", valueOption: "value" },
      {
        field: "descripcion",
        headerName: "Descripcion",
        editable: (row) => row?.tipo?.cod_tipo_dato,
        type: "string",
      },
      {
        field: "valor",
        headerName: "Valor",
        editable: (row) => row?.tipo?.cod_tipo_dato,
        type: "number",
      },
    ],
    [tipos],
  );
  const datosObligatorios = useMemo(() => {
    const segunTipo = filaSeleccionada?.row?.tipo?.cod_tipo_dato === 2 ? { descripcion: "Descripcion" } : { valor: "Valor" };

    return { tipo: "Tipo de Detalle" };
  }, [filaSeleccionada]);
  const formatearFilaTabla = useCallback(
    (fila) => ({
      ...fila,
      cod_metodo: metodo.cod_metodo,
      tipo: tipos.find((m) => m.cod_tipo === fila.cod_tipo),
    }),
    [metodo, tipos],
  );
  const formatearFilaApi = useCallback(
    (fila) => ({
      ...fila,
      cod_metodo: metodo.cod_metodo,
      cod_tipo: fila.tipo.value,
      tipo: undefined,
    }),
    [metodo],
  );
  const datos = useMemo(() => detalles.map(formatearFilaTabla), [formatearFilaTabla, detalles]);
  const obtenerAccionesSegunPermisos = useMemo(() => {
    let item = permisosArray.find((i) => i.nom_opcion === "Identificaciones");
    return {
      ...permisosBase,
      agregar: true, // item?.acciones.some((i) => i.cod_accion === 3),
      ver: false, // item?.acciones.some((i) => i.cod_accion === 1),
      editar: true, // item?.acciones.some((i) => i.cod_accion === 2),
      guardar: true, // item?.acciones.some((i) => i.cod_accion === 2),
      eliminar: true, // item?.acciones.some((i) => [5, 4].includes(i.cod_accion)),

      add: true, // item?.acciones.some((i) => i.cod_accion === 3),
      view: false, // item?.acciones.some((i) => i.cod_accion === 1),
      edit: true, // item?.acciones.some((i) => i.cod_accion === 2),
      save: true, // item?.acciones.some((i) => i.cod_accion === 2),
      delete: true, // item?.acciones.some((i) => [5, 4].includes(i.cod_accion)),
    };
  }, [permisosArray]);

  const obtenerTipos = useCallback(async () => {
    await api.get("/api/appweb/lista-tipo", { params: { tipo_tabla: "TARIFA_DETALLE" } }).then(({ data }) => setTipos(data.data.map((i) => ({ ...i, value: i.cod_tipo, label: i.nom_tipo }))));
  }, []);
  const obtenerDetallesMetodo = useCallback(async (metodo) => {
    if (metodo.cod_metodo)
      await api
        .get("/api/appweb/lista-tarifa-detalle", { params: { cod_metodo: metodo.cod_metodo, cod_estado: 1 } })
        .then(({ data }) => {
          setDetalles(data.data);
          setDetallesConsultado(data.data);
        })
        .catch((e) => console.error(e));
    else {
      setDetalles([]);
      setDetallesConsultado([]);
    }
  }, []);
  const consultar = useCallback(async () => {
    await Promise.all([obtenerTipos()]);
    await obtenerDetallesMetodo(metodo);
  }, [metodo, obtenerTipos, obtenerDetallesMetodo]);

  useEffect(() => {
    consultar();
  }, [metodo.cod_metodo]);

  const eliminarFila = useCallback(async (row) => await api.post("api/appweb/actualizar-tarifa-detalle", { ...row, cod_estado: 4 }).then((i) => consultar()), [consultar]);
  const guardar = useCallback(async (row) => await api.post("api/appweb/actualizar-tarifa-detalle", { ...row }).then((i) => consultar()), [consultar]);
  const agregar = useCallback(async (row) => await api.post("api/appweb/insertar-tarifa-detalle", { ...row }).then((i) => consultar()), [consultar]);

  return (
    <Grid container>
      <Grid width="100%">
        <TablaEditableComponent
          idKey="cod_tarifa_detalle"
          acciones={obtenerAccionesSegunPermisos}
          data={datos}
          encabezados={encabezados}
          objetoBase={objetoBase}
          keepLastInput={false}
          onRowAdded={(id, row) => agregar(formatearFilaApi(row))}
          onRowUpdated={(id, row) => guardar(formatearFilaApi(row))}
          onRowDeleted={(id, row) => eliminarFila(formatearFilaApi(row))}
          textoAlertaEliminacion={(id) => {
            let l = datos.find((i) => i.cod_tarifa_detalle === id);
            return (
              <>
                <Typography>
                  Esta por anular el detalle{" "}
                  <Typography variant="span" fontSize={20} color="error">
                    <b>{l?.descripcion}</b>.
                  </Typography>
                  <br />
                  Esto puede causar problemas a la hora mostrar las cotizaciones.
                  <br />
                  ¿Esta seguro que desea continuar?
                </Typography>
              </>
            );
          }}
          camposRequeridosParaGuardar={datosObligatorios}
        />
      </Grid>
      <Grid container>
        {/* <pre>{JSON.stringify(filaSeleccionada, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(tipos, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(detalles, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(metodo, null, 2)}</pre> */}
      </Grid>
    </Grid>
  );
};

FormularioCompletoDetalleMetodo.propTypes = {
  metodo: PropTypes.object,
  reConsultar: PropTypes.func,
};

export default FormularioCompletoDetalleMetodo;
