import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import EditableDataGridComponent from "../../../components/Tabla/EditableDataGridComponent";
import { api } from "../../../api";
import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";
import LOADER from "../../../assets/loader_1.gif";
import TablaEditableComponent from "../../../components/Tabla/TablaEditableComponent";

const permisosBase = { ver: false, editar: false, eliminar: false, guardar: false };
const objetoBase = { cod_tarifa_rango: null, cod_metodo: null, inicio: 0, final: null, costo: null, venta: null, minimo: null, cod_moneda_costo: null, cod_moneda_venta: null, cod_estado: null };

const FormularioCalculoRango = (props) => {
  const { metodo = {}, reConsultar = () => {}, onTarifaCreada = () => {}, readonly = false } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [monedas, setMonedas] = useState([]);
  const [rangos, setRangos] = useState([]);
  const [rangosConsultados, setRangosConsultados] = useState([]);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const { permisosArray } = useObtenerOpcionesAcciones();
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
  const formatearFilaTabla = useCallback(
    (fila) => {
      return {
        ...fila,
        cod_metodo: metodo.cod_metodo,
        moneda_costo: monedas.find((m) => m.value === fila.cod_moneda_costo),
        moneda_venta: monedas.find((m) => m.value === fila.cod_moneda_venta),
      };
    },
    [metodo, monedas],
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
    [metodo],
  );
  const datos = useMemo(() => rangos.map(formatearFilaTabla), [formatearFilaTabla, rangos]);
  const obtenerAccionesSegunPermisos = useMemo(() => {
    let item = permisosArray.find((i) => i.nom_opcion === "Identificaciones");
    return {
      ...permisosBase,
      agregar: true, // item?.acciones.some((i) => i.cod_accion === 3),
      ver: false, // item?.acciones.some((i) => i.cod_accion === 1),
      editar: true, // item?.acciones.some((i) => i.cod_accion === 2),
      guardar: true, // item?.acciones.some((i) => i.cod_accion === 2),
      eliminar: true, // item?.acciones.some((i) => [5, 4].includes(i.cod_accion)),
      add: !readonly, // item?.acciones.some((i) => i.cod_accion === 3),
      view: false, // item?.acciones.some((i) => i.cod_accion === 1),
      edit: !readonly, // true, // item?.acciones.some((i) => i.cod_accion === 2),
      save: !readonly, // true, // item?.acciones.some((i) => i.cod_accion === 2),
      delete: !readonly, // item?.acciones.some((i) => [5, 4].includes(i.cod_accion)),
    };
  }, [readonly, permisosArray]);

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
          setRangosConsultados(data.data);
        })
        .catch((e) => console.error(e));
    else {
      setRangos([]);
      setRangosConsultados([]);
    }
  }, [metodo]);
  useEffect(() => {
    setIsLoading(true);
    Promise.all([consultarMonedas(), consultarRangos()]).finally(() => setIsLoading(false));
  }, [consultarMonedas, consultarRangos]);

  const eliminarFila = useCallback(async (row) => await api.post("api/appweb/actualizar-tarifa-rango", { ...row, cod_estado: 4 }).then((i) => reConsultar()), [reConsultar]);
  const guardar = useCallback(async (row) => await api.post("api/appweb/actualizar-tarifa-rango", { ...formatearFilaApi(row) }).then((i) => consultarRangos()), [consultarRangos, formatearFilaApi]);
  const agregar = useCallback(
    async (row) =>
      await api.post("api/appweb/insertar-tarifa-rango", { cod_servicio: metodo.cod_servicio, cod_metodo: metodo.cod_metodo, ...formatearFilaApi(row) }).then((i) => {
        onTarifaCreada();
        consultarRangos();
        reConsultar();
      }),
    [formatearFilaApi, consultarRangos, onTarifaCreada, metodo.cod_servicio, metodo.cod_metodo, reConsultar],
  );

  if (isLoading) return <Box component="img" src={LOADER} sx={{ maxWidth: { xs: "90%" }, mx: "auto" }} />;

  return (
    <Box sx={{ m: 0, p: 1 }} key={metodo?.cod_metodo}>
      <TablaEditableComponent
        idKey="cod_tarifa_rango"
        data={datos}
        encabezados={encabezados}
        acciones={obtenerAccionesSegunPermisos}
        onRowAdded={async (id, row) => await agregar(formatearFilaApi(row))}
        onRowUpdated={async (id, row) => await guardar(formatearFilaApi(row))}
        onRowDeleted={async (id, row) => eliminarFila(formatearFilaApi(row))}
        camposRequeridosParaGuardar={datosObligatorios}
        editarEnTabla={!readonly}
      />
    </Box>
  );
};

FormularioCalculoRango.propTypes = {
  metodo: PropTypes.object,
  reConsultar: PropTypes.func,
  onTarifaCreada: PropTypes.func,
  isLoading: PropTypes.bool,
  readonly: PropTypes.bool,
};

export default FormularioCalculoRango;
