import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Button, Grid, Typography } from "@mui/material";
import EditableDataGridComponent from "../../../components/Tabla/EditableDataGridComponent";
import { api } from "../../../api";
import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";
import LOADER from "../../../assets/loader_1.gif";
import TablaEditableComponent from "../../../components/Tabla/TablaEditableComponent";
import BandaAlertaComponent from "@/components/Alertas/BandaAlertaComponent";

const permisosBase = { ver: false, editar: false, eliminar: false, guardar: false };
const objetoBase = {
  cod_tarifa_rango: null,
  inicio: "",
  costo_minimo: "",
  venta_minimo: "",
  costo: "",
  moneda_costo: null,
  venta: "",
  moneda_venta: null,
};

const FormularioCalculoRangoV2 = (props) => {
  const { metodo = {}, reConsultar = () => {}, onTarifaCreada = () => {}, readonly = false } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [monedas, setMonedas] = useState([]);
  const [rangos, setRangos] = useState([]);

  const encabezados = useMemo(
    () => [
      { field: "inicio", headerName: "A partir de...", editable: true, type: "number", readonly },
      { field: "costo_minimo", headerName: "Minimo costo", editable: true, type: "number", requerido: true, readonly },
      { field: "venta_minimo", headerName: "Minimo venta", editable: true, type: "number", requerido: true, readonly },
      { field: "costo", headerName: "Costo", editable: true, type: "number", requerido: true, readonly },
      { field: "moneda_costo", headerName: "Moneda costo", editable: true, type: "singleSelect", valueOptions: monedas, labelOption: "label", valueOption: "value", requerido: true, readonly },
      { field: "venta", headerName: "Venta", editable: true, type: "number", requerido: true, readonly },
      { field: "moneda_venta", headerName: "Moneda venta", editable: true, type: "singleSelect", valueOptions: monedas, labelOption: "label", valueOption: "value", requerido: true, readonly },
    ],
    [monedas, readonly],
  );
  const lengthAcual = useMemo(() => rangos.length, [rangos]);
  const formatearFilaTabla = useCallback(
    (fila) => {
      return {
        ...fila,
        cod_tarifa_rango: !fila.cod_tarifa_rango ? lengthAcual + 1 : fila.cod_tarifa_rango,
        cod_metodo: metodo.cod_metodo,
        moneda_costo: fila.moneda_costo ?? monedas.find((m) => m.value === fila.cod_moneda_costo),
        moneda_venta: fila.moneda_venta ?? monedas.find((m) => m.value === fila.cod_moneda_venta),
      };
    },
    [metodo.cod_metodo, lengthAcual, monedas],
  );
  const formatearFilaApi = useCallback(
    (fila) => ({
      ...fila,
      inicio: fila.inicio || 0,
      final: null,
      cod_metodo: metodo.cod_metodo,
      cod_moneda_costo: fila.moneda_costo.value,
      cod_moneda_venta: fila.moneda_venta.value,
    }),
    [metodo.cod_metodo],
  );
  const datos = useMemo(() => rangos.map(formatearFilaTabla), [formatearFilaTabla, rangos]);

  const obtenerAccionesSegunPermisos = useMemo(() => {
    const habilitar = !readonly;
    return {
      add: habilitar, // item?.acciones.some((i) => i.cod_accion === 3),
      edit: habilitar, // true, // item?.acciones.some((i) => i.cod_accion === 2),
      save: habilitar, // true, // item?.acciones.some((i) => i.cod_accion === 2),
      delete: habilitar, // item?.acciones.some((i) => [5, 4].includes(i.cod_accion)),
    };
  }, [readonly]);

  const datosObligatorios = useCallback((row) => {
    if (!row.final || !row.costo || !row.venta || !row.costo_minimo || !row.venta_minimo || !row.moneda_costo || !row.moneda_venta) {
      let lista = [];
      if (!row.final) lista.push("Final del rango");
      if (!row.costo) lista.push("Costo");
      if (!row.venta) lista.push("Venta");
      if (!row.costo_minimo) lista.push("Minimo de Costo");
      if (!row.venta_minimo) lista.push("Minimo de Venta");
      if (!row.moneda_costo) lista.push("Moneda de Costo");
      if (!row.moneda_venta) lista.push("Moneda de Venta");
      return lista;
    } else if (row.costo > row.venta) {
      return ["El valor de venta debe ser igual o mayor al valor del costo"];
    } else return [];
  }, []);
  const consultarMonedas = useCallback(async () => {
    await api
      .get("api/appweb/lista-moneda", { params: { es_operativa: true } })
      .then(({ data }) => setMonedas(data.data.map((i) => ({ label: `${i.simbolo_moneda} - ${i.nom_moneda}`, value: i.cod_moneda, simbolo: i.simbolo_moneda }))))
      .catch((e) => console.error(e));
  }, []);
  const consultarRangos = useCallback(async () => {
    if (metodo.cod_metodo)
      await api
        .get("api/appweb/lista-tarifa-rango", { params: { cod_estado: 1, cod_metodo: metodo.cod_metodo } })
        .then(({ data }) => {
          setRangos(data.data);
        })
        .catch((e) => console.error(e));
    else {
      setRangos([]);
    }
  }, [metodo.cod_metodo, setRangos]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([consultarMonedas(), consultarRangos()]).finally(() => setIsLoading(false));
  }, []);

  // const eliminarFila = useCallback(async (row) => await api.post("api/appweb/actualizar-tarifa-rango", { ...row, cod_estado: 4 }).then((i) => reConsultar()), [reConsultar]);
  // const guardar = useCallback(async (row) => await api.post("api/appweb/actualizar-tarifa-rango", { ...formatearFilaApi(row) }).then((i) => consultarRangos()), [consultarRangos, formatearFilaApi]);
  // const agregar = useCallback(
  //   async (row) =>
  //     await api.post("api/appweb/insertar-tarifa-rango", { cod_servicio: metodo.cod_servicio, cod_metodo: metodo.cod_metodo, ...formatearFilaApi(row) }).then((i) => {
  //       onTarifaCreada();
  //       consultarRangos();
  //       reConsultar();
  //     }),
  //   [formatearFilaApi, consultarRangos, onTarifaCreada, metodo.cod_servicio, metodo.cod_metodo, reConsultar],
  // );
  const agregarAll = useCallback(
    async () =>
      await Promise.all(
        rangos.map((row) =>
          api.post("api/appweb/insertar-tarifa-rango", { cod_servicio: metodo.cod_servicio, cod_metodo: metodo.cod_metodo, ...formatearFilaApi(row) }).then((i) => {
            onTarifaCreada();
            consultarRangos();
            reConsultar();
          }),
        ),
      ),
    [rangos, metodo.cod_servicio, metodo.cod_metodo, formatearFilaApi, onTarifaCreada, consultarRangos, reConsultar],
  );

  // useEffect(() => {
  //   console.log({ metodo });
  // }, [metodo]);

  if (isLoading) return <Box component="img" src={LOADER} sx={{ maxWidth: { xs: "90%" }, mx: "auto" }} />;

  return (
    <Box sx={{ m: 0, p: 1 }} key={`${metodo?.cod_metodo}_${readonly}`}>
      {!readonly && (
        <BandaAlertaComponent content="Los datos ingresados en la lista no se registrarán hasta hacer clic en Guardar. Favor de ingresar todos los rangos antes de Guardar." tipo="warning" />
      )}
      <TablaEditableComponent
        idKey="cod_tarifa_rango"
        data={datos}
        encabezados={encabezados}
        acciones={obtenerAccionesSegunPermisos}
        onRowAdded={(id, row) => setRangos((rangos) => [...rangos, formatearFilaTabla(row)])}
        onRowUpdated={(id, row) => setRangos((rangos) => rangos.map((i) => (i.cod_tarifa_rango === row.cod_tarifa_rango ? formatearFilaTabla(row) : i)))}
        onRowDeleted={(id, row) => setRangos((rangos) => rangos.filter((i) => i.cod_tarifa_rango !== row.cod_tarifa_rango))}
        camposRequeridosParaGuardar={datosObligatorios}
        editarEnTabla={!readonly}
        keepLastInput={false}
        objetoBase={objetoBase}
      />

      <Box sx={{ mt: 2 }} />

      <Grid container display={!readonly ? null : "none"} spacing={2} alignItems="center" justifyContent="center" direction="row" wrap="nowrap" sx={{ mt: 2 }}>
        <Button variant="contained" color="primary" onClick={agregarAll} disabled={!lengthAcual}>
          Guardar
        </Button>
      </Grid>
    </Box>
  );
};

FormularioCalculoRangoV2.propTypes = {
  metodo: PropTypes.object,
  reConsultar: PropTypes.func,
  onTarifaCreada: PropTypes.func,
  isLoading: PropTypes.bool,
  readonly: PropTypes.bool,
};

export default FormularioCalculoRangoV2;
