import { Box, Grid, Typography } from "@mui/material";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import { api } from "../../../api";
import BandaAlertaComponent from "../../../components/Alertas/BandaAlertaComponent";
import { useFetchRubros } from "../../../hooks/Fetch/useFetchTarifas";
import { REL_TIPOS_CLASIFICACION_TARIFAS } from "../../../constants/clasifacionesTarifas";

const FormularioCalculoPorcentaje = (props) => {
  const { metodo = {}, reConsultar = () => {}, onTarifaCreada = () => {}, servicio = {}, readonly = false } = props;
  const [monedas, setMonedas] = useState([]);
  const [valores, setValores] = useState({ cod_tarifa_porcentaje: 0, cod_metodo: "", porcentaje_costo: 0, porcentaje_venta: 0, cod_moneda_costo: "", cod_moneda_venta: "", cod_estado: "", minimo: 0 });
  const [rangosConsultados, setRangosConsultados] = useState([]);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [esNuevo, setEsNuevo] = useState(false);
  const { permisosArray } = useObtenerOpcionesAcciones();
  const rubros = useFetchRubros();
  const rubroCorrespondiente = useMemo(
    () =>
      servicio?.clasificacion === 89
        ? rubros.data?.find((r) => r.value == 11)
        : servicio?.clasificacion === 90
          ? { value: 1, label: "RUBRO ASINGADO NO CONFIGURADO" }
          : { value: 1, label: "RUBRO ASINGADO NO CONFIGURADO" },
    [servicio, rubros.data],
  );

  const inputs = useMemo(
    () => [
      { val: valores.cod_metodo, id: "cod_metodo", label: "cod_metodo", tipo: "text", visible: false, readonly },
      { val: valores.minimo, id: "minimo", label: "minimo", tipo: "number", requerido: true, readonly },
      { val: "", text: "", id: "comentario", tipo: "comentario" },
      { val: valores.cod_moneda_costo, id: "cod_moneda_costo", label: "moneda de costo", tipo: "select", options: monedas, requerido: true, readonly },
      {
        val: valores.porcentaje_costo,
        id: "porcentaje_costo",
        label: "porcentaje costo",
        tipo: "number",
        max: 100,
        min: 0,
        step: 0.01,
        sufijo: "%",
        requerido: true,
        readonly,
      },
      { val: valores.cod_moneda_venta, id: "cod_moneda_venta", label: "moneda de venta", tipo: "select", options: monedas, requerido: true, readonly },
      {
        val: valores.porcentaje_venta,
        id: "porcentaje_venta",
        label: "porcentaje venta",
        tipo: "number",
        max: 100,
        min: 0,
        step: 0.01,
        sufijo: "%",
        requerido: true,
        error: Number(valores.porcentaje_costo) > Number(valores.porcentaje_venta),
        errorMessage: Number(valores.porcentaje_costo) > Number(valores.porcentaje_venta) ? "El valor de venta debe ser mayor al de costo" : undefined,
        readonly,
      },
      {
        val: valores.cod_rubro,
        id: "cod_rubro",
        label: "rubro",
        tipo: "select",
        options: rubros?.data ?? [],
        readonly,
      },
      { val: valores.cod_estado, id: "cod_estado", label: "cod_estado", tipo: "text", visible: false, readonly },
    ],
    [valores, monedas, rubroCorrespondiente, servicio, readonly],
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
          .get("api/appweb/lista-tarifa-porcentaje", { params: { cod_metodo: metodo.cod_metodo } })
          .then(({ data }) => {
            console.log(data.data.length);
            if (data.data.length === 0) {
              setEsNuevo(true);
              return;
            } else {
              let costoVenta = data.data[0];

              console.log(costoVenta);

              setValores({
                ...costoVenta,
                cod_moneda_costo: monedas.find((i) => i.value === costoVenta?.cod_moneda_costo) || null,
                cod_moneda_venta: monedas.find((i) => i.value === costoVenta?.cod_moneda_venta) || null,
                cod_rubro: (rubros?.data ?? []).find((i) => i.cod_rubro === costoVenta?.cod_rubro) || null,
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
      .post("api/appweb/insertar-tarifa-porcentaje", {
        porcentaje_costo: Number(valores.porcentaje_costo),
        porcentaje_venta: Number(valores.porcentaje_venta),
        minimo: Number(valores.minimo),
        cod_metodo: metodo.cod_metodo,
        cod_tarifa_porcentaje: valores.cod_tarifa_porcentaje,
        cod_rubro: valores?.cod_rubro?.value || null,
        cod_moneda_costo: valores.cod_moneda_costo?.value || null,
        cod_moneda_venta: valores.cod_moneda_venta?.value || null,
        cod_estado: 1,
      })
      .then(() => {
        reConsultar();
        onTarifaCreada();
      });
  }, [valores, metodo, onTarifaCreada]);

  const actualizarCostoVenta = useCallback(async () => {
    await api.post("api/appweb/actualizar-tarifa-porcentaje", {
      porcentaje_costo: Number(valores.porcentaje_costo),
      porcentaje_venta: Number(valores.porcentaje_venta),
      minimo: Number(valores.minimo),
      cod_metodo: metodo.cod_metodo,
      cod_tarifa_porcentaje: valores.cod_tarifa_porcentaje,
      cod_rubro: valores?.cod_rubro?.value || null,
      cod_moneda_costo: valores.cod_moneda_costo?.value || null,
      cod_moneda_venta: valores.cod_moneda_venta?.value || null,
      cod_estado: 1,
    });
  }, [valores, metodo]);

  const realizarConsultas = useCallback(async () => {
    await consultarMonedas().then(async (monedas) => await consultarCostoVenta(monedas));
  }, [consultarCostoVenta, consultarMonedas]);

  const obtenerCantidadDecimales = (numero) => {
    const parteEntera = Math.trunc(numero);
    const diferencia = numero - parteEntera;
    const diferenciaComoCadena = diferencia.toString().split(".");
    const parteDecimal = diferenciaComoCadena[1] || "";
    return parteDecimal.length;
  };

  useEffect(() => {
    realizarConsultas();
  }, []);

  return (
    <Box>
      {obtenerCantidadDecimales(valores.porcentaje_costo) > 9 && <BandaAlertaComponent tipo="warning" content="El porcentaje de costo no debe tener mas de 8 decimales." />}
      {obtenerCantidadDecimales(valores.porcentaje_venta) > 9 && <BandaAlertaComponent tipo="warning" content="El porcentaje de valor no debe tener mas de 8 decimales." />}
      <FormularioComponent
        inputs={inputs}
        onInput={({ id, val }) => {
          console.log(id, val);
          setValores((v) => ({ ...v, [id]: val }));
        }}
        botones={{ agregar: { texto: esNuevo ? "agregar" : "actializar", color: esNuevo ? "primary" : "secondary", onClick: () => (esNuevo ? insertarCostoVenta() : actualizarCostoVenta()) } }}
      />
      <Grid container>
        {/* <pre>{JSON.stringify(servicio, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(metodo)}</pre> */}
        {/* <pre>{JSON.stringify(inputs, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(valores, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(metodo, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(permisosArray, null, 2)}</pre> */}
      </Grid>
    </Box>
  );
};

FormularioCalculoPorcentaje.propTypes = {
  metodo: PropTypes.object,
  servicio: PropTypes.object,
  reConsultar: PropTypes.func,
  onTarifaCreada: PropTypes.func,
  readonly: PropTypes.bool,
};

export default FormularioCalculoPorcentaje;
