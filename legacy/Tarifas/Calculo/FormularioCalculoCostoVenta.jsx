import { Box, Grid, Typography } from "@mui/material";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import { api } from "../../../api";

const FormularioCalculoCostoVenta = (props) => {
  const { metodo = {}, reConsultar = () => {}, onTarifaCreada = () => {}, readonly = false } = props;
  const [monedas, setMonedas] = useState([]);
  const [valores, setValores] = useState({ cod_metodo: "", costo: null, venta: null, cod_moneda_costo: "", cod_moneda_venta: "", cod_estado: "" });
  const [rangosConsultados, setRangosConsultados] = useState([]);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [esNuevo, setEsNuevo] = useState(false);
  const { permisosArray } = useObtenerOpcionesAcciones();
  const inputs = useMemo(
    () => [
      { val: valores.cod_metodo, id: "cod_metodo", label: "cod_metodo", tipo: "text", visible: false, readonly },
      { val: valores.cod_moneda_costo, id: "cod_moneda_costo", label: "moneda de costo", tipo: "select", options: monedas, requerido: true, readonly },
      {
        val: valores.costo,
        id: "costo",
        label: "costo",
        tipo: "number",
        step: 0.1,
        moneda: valores.cod_moneda_costo?.simbolo,
        requerido: true,
        readonly,
      },
      { val: valores.cod_moneda_venta, id: "cod_moneda_venta", label: "moneda de venta", tipo: "select", options: monedas, requerido: true, readonly },
      {
        val: valores.venta,
        id: "venta",
        label: "venta",
        tipo: "number",
        step: 0.1,
        moneda: valores.cod_moneda_venta?.simbolo,
        requerido: true,
        error: valores.costo > valores.venta,
        errorMessage: valores.costo > valores.venta ? "El valor de venta debe ser mayor al de costo" : undefined,
        readonly,
      },
      { val: valores.cod_estado, id: "cod_estado", label: "cod_estado", tipo: "text", visible: false, readonly },
    ],
    [valores, monedas, readonly],
  );

  const consultarMonedas = useCallback(async () => {
    return await api
      .get("api/appweb/lista-moneda", { params: { es_operativa: true } })
      .then(({ data }) => {
        let monedas = data.data.map((i) => ({ label: `${i.simbolo_moneda} - ${i.nom_moneda}`, value: i.cod_moneda, simbolo: i.simbolo_moneda }));
        setMonedas(monedas);
        return monedas;
      })
      .catch((e) => console.error(e));
  }, []);

  const consultarCostoVenta = useCallback(
    async (mon) => {
      let monedas = mon;
      if (metodo.cod_metodo && mon.length > 0) {
        await api
          .get("api/appweb/lista-tarifa-costoventa", { params: { cod_metodo: metodo.cod_metodo } })
          .then(({ data }) => {
            console.log(data.data.length);
            if (data.data.length === 0) {
              setEsNuevo(true);
              return;
            } else {
              let costoVenta = data.data[0];

              setValores({
                ...costoVenta,
                cod_moneda_costo: monedas.find((i) => i.value === costoVenta?.cod_moneda_costo) || null,
                cod_moneda_venta: monedas.find((i) => i.value === costoVenta?.cod_moneda_venta) || null,
              });
              setEsNuevo(false);
            }
          })
          .catch((e) => console.error(e));
      } else {
        setValores({ cod_metodo: "", costo: null, venta: null, cod_moneda_costo: "", cod_moneda_venta: "", cod_estado: "" });
        setEsNuevo(true);
      }
    },
    [metodo],
  );

  const insertarCostoVenta = useCallback(async () => {
    await api
      .post("api/appweb/insertar-tarifa-costoventa", {
        costo: Number(valores.costo),
        venta: Number(valores.venta),
        cod_metodo: metodo.cod_metodo,
        cod_servicio: metodo.cod_servicio,
        cod_moneda_costo: valores.cod_moneda_costo?.value || null,
        cod_moneda_venta: valores.cod_moneda_venta?.value || null,
        cod_estado: 1,
      })
      .then(() => onTarifaCreada());
  }, [valores, metodo, onTarifaCreada]);

  const actualizarCostoVenta = useCallback(async () => {
    await api.post("api/appweb/actualizar-tarifa-costoventa", {
      costo: Number(valores.costo),
      venta: Number(valores.venta),
      cod_metodo: metodo.cod_metodo,
      cod_tarifa_costoventa: valores.cod_tarifa_costoventa,
      cod_servicio: metodo.cod_servicio,
      cod_moneda_costo: valores.cod_moneda_costo?.value || null,
      cod_moneda_venta: valores.cod_moneda_venta?.value || null,
      cod_estado: 1,
    });
  }, [valores, metodo]);

  const realizarConsultas = useCallback(async () => {
    await consultarMonedas().then(async (monedas) => await consultarCostoVenta(monedas));
  }, [consultarCostoVenta, consultarMonedas]);

  useEffect(() => {
    realizarConsultas();
  }, []);

  return (
    <Box>
      <FormularioComponent
        inputs={inputs}
        onInput={({ id, val }) => setValores((v) => ({ ...v, [id]: val }))}
        botones={{ agregar: { texto: esNuevo ? "agregar" : "actializar", color: esNuevo ? "primary" : "secondary", onClick: () => (esNuevo ? insertarCostoVenta() : actualizarCostoVenta()) } }}
      />
      <Grid container>
        {/* <pre>{JSON.stringify(metodo)}</pre> */}
        {/* <pre>{JSON.stringify(inputs, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(valores, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(metodo, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(permisosArray, null, 2)}</pre> */}
      </Grid>
    </Box>
  );
};

FormularioCalculoCostoVenta.propTypes = {
  metodo: PropTypes.object,
  reConsultar: PropTypes.func,
  onTarifaCreada: PropTypes.func,
  isLoading: PropTypes.bool,
  readonly: PropTypes.bool,
};

export default FormularioCalculoCostoVenta;
