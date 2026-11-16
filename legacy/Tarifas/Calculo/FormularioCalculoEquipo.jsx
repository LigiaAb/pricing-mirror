import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { api } from "../../../api";
import { Box, Grid } from "@mui/material";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import { useFetchMonedas } from "../../../hooks/Fetch/useFetchCatalog";
import { useFetchEquipos } from "../../../hooks/Fetch/useFetchTarifas";

const FormularioCalculoEquipo = (props) => {
  const { metodo, servicio, onTarifaCreada = () => {}, readonly } = props;
  const [valores, setValores] = useState({
    cod_tarifa_equipo: null,
    cod_metodo: null,
    cod_equipo: null,
    costo: null,
    venta: null,
    cod_moneda_costo: null,
    cod_moneda_venta: null,
    cod_estado: 1,
  });
  // const [monedas, setMonedas] = useState([]);
  // const [equipos, setEquipos] = useState([]);
  const [esNuevo, setEsNuevo] = useState(false);
  const monedas = useFetchMonedas({ es_operativa: true });
  const equipos = useFetchEquipos({ equipo_operativo: true });
  // const eq

  const inputs = useMemo(
    () => [
      { tipo: "number", label: "tarifa_equipo", id: "cod_tarifa_equipo", val: valores.cod_tarifa_equipo, visible: false, readonly },
      { tipo: "number", label: "metodo", id: "cod_metodo", val: valores.cod_metodo, visible: false, readonly },
      { tipo: "select", label: "equipo", id: "cod_equipo", options: equipos.data || [], val: valores.cod_equipo, requerido: true, readonly },
      { tipo: "comentario" },
      { val: valores.cod_moneda_costo, id: "cod_moneda_costo", label: "moneda de costo", tipo: "select", options: monedas.data || [], requerido: true, readonly },
      { val: valores.costo, id: "costo", label: "costo", tipo: "number", step: 0.1, moneda: valores.cod_moneda_costo?.simbolo, requerido: true, readonly },
      { val: valores.cod_moneda_venta, id: "cod_moneda_venta", label: "moneda de venta", tipo: "select", options: monedas.data || [], requerido: true, readonly },
      {
        val: valores.venta,
        id: "venta",
        label: "venta",
        tipo: "number",
        step: 0.1,
        moneda: valores.cod_moneda_venta?.simbolo,
        requerido: true,
        error: Number(valores.costo) > Number(valores.venta),
        errorMessage: valores.costo > valores.venta ? "El valor de venta debe er mayor al de costo" : undefined,
        readonly,
      },
      { tipo: "number", id: "cod_estado", val: valores.cod_estado, visible: false, readonly },
    ],
    [valores, monedas.data, equipos.data, readonly],
  );

  // const consultarMonedas = useCallback(async () => {
  //   return await api
  //     .get("api/appweb/lista-moneda", { params: { es_operativa: true } })
  //     .then(({ data }) => {
  //       let monedas = data.data.map((i) => ({ label: `${i.simbolo_moneda} - ${i.nom_moneda}`, value: i.cod_moneda, simbolo: i.simbolo_moneda }));
  //       setMonedas(monedas);
  //       return monedas;
  //     })
  //     .catch((e) => console.error(e));
  // }, []);
  // const consultaTipo = useCallback(async () => {
  //   return await api
  //     .get("api/appweb/lista-tipo-cenco", { params: { cod_cenco: servicio?.cod_cc, tipo_tabla: "EQUIPO" } })
  //     .then(({ data }) => {
  //       let equipos = data.data.map((i) => ({ label: `${i.tipo_desc}`, value: i.cod_tipo }));
  //       setEquipos(equipos);
  //       return equipos;
  //     })
  //     .catch((e) => console.error(e));
  // }, []);

  const obtenerTarifasEquipos = useCallback(async () => {
    if (metodo.cod_metodo && monedas.data?.length > 0) {
      api
        .get("api/appweb/lista-tarifa-equipo", { params: { cod_metodo: metodo.cod_metodo, cod_estado: 1 } })
        .then(({ data }) => {
          let equipo = data.data[0];
          setValores({
            ...data.data[0],
            cod_equipo: (equipos.data || []).find((i) => i.value === equipo?.cod_equipo) || null,
            cod_moneda_costo: (monedas.data || [])?.find((i) => i.value === equipo?.cod_moneda_costo) || null,
            cod_moneda_venta: (monedas.data || [])?.find((i) => i.value === equipo?.cod_moneda_venta) || null,
          });
        })
        .catch((e) => console.error(e));
      setEsNuevo(false);
    } else {
      setValores({ cod_tarifa_equipo: null, cod_metodo: null, cod_equipo: null, costo: null, venta: null, cod_moneda_costo: null, cod_moneda_venta: null, cod_estado: 1 });
      setEsNuevo(true);
    }
  }, [equipos.data, monedas.data, metodo]);

  useEffect(() => {
    if (!monedas.isLoading && !monedas.isError) obtenerTarifasEquipos();
  }, [monedas.isLoading, monedas.isError, obtenerTarifasEquipos]);

  // const consultar = useCallback(async () => {
  //   await Promise.all([consultaTipo()]);
  // }, [consultaTipo]);

  const insertarTarifaEquipo = useCallback(async () => {
    await api
      .post("api/appweb/insertar-tarifa-equipo", {
        costo: Number(valores.costo),
        venta: Number(valores.venta),
        cod_metodo: metodo.cod_metodo,
        cod_equipo: valores.cod_equipo?.value || null,
        cod_moneda_costo: valores.cod_moneda_costo?.value || null,
        cod_moneda_venta: valores.cod_moneda_venta?.value || null,
        cod_estado: 1,
      })
      .then(() => {
        onTarifaCreada();
      });
  }, [valores, metodo, onTarifaCreada]);

  const actualizarTarifaEquipo = useCallback(async () => {
    await api.post("api/appweb/actualizar-tarifa-equipo", {
      costo: Number(valores.costo),
      venta: Number(valores.venta),
      cod_metodo: metodo.cod_metodo,
      cod_tarifa_equipo: valores.cod_tarifa_equipo,
      cod_equipo: valores.cod_equipo?.value || null,
      cod_moneda_costo: valores.cod_moneda_costo?.value || null,
      cod_moneda_venta: valores.cod_moneda_venta?.value || null,
      cod_estado: 1,
    });
  }, [valores, metodo]);

  // useEffect(() => {
  //   consultar();
  // }, [consultar]);

  return (
    <Grid fullWidth container>
      <Grid size={12}>
        <FormularioComponent
          inputs={inputs}
          onInput={({ id, val }) => setValores((v) => ({ ...v, [id]: val }))}
          botones={{
            agregar: {
              texto: !valores.cod_tarifa_equipo ? "agregar" : "actializar",
              color: !valores.cod_tarifa_equipo ? "primary" : "secondary",
              onClick: () => (!valores.cod_tarifa_equipo ? insertarTarifaEquipo() : actualizarTarifaEquipo()),
            },
          }}
        />
      </Grid>
      <Grid container>
        {/* <pre>{JSON.stringify({ equipos }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ metodo }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ servicio }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ valores }, null, 2)}</pre> */}
      </Grid>
    </Grid>
  );
};

FormularioCalculoEquipo.propTypes = {
  metodo: PropTypes.object,
  servicio: PropTypes.object,
  onTarifaCreada: PropTypes.func,
  readonly: PropTypes.bool,
};

export default FormularioCalculoEquipo;
