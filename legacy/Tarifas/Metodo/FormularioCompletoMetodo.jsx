import { Box, Grid, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import { useNavigate } from "react-router-dom/dist";
import { encryptId } from "../../../api/encryptDecrypt";
import moment from "moment";
import { api } from "../../../api";
import TabComponent from "../../../components/Tabs/TabComponent";
import FormularioCalculoRango from "../Calculo/FormularioCalculoRango";
import FormularioCalculoEquipo from "../Calculo/FormularioCalculoEquipo";
import FormularioCalculoCostoVenta from "../Calculo/FormularioCalculoCostoVenta";
import FormularioCompletoDetalleMetodo from "./FormularioCompletoDetalleMetodo";
import FormularioCompletoEntidadMetodo from "./FormularioCompletoEntidadMetodo";
import FormularioCompletoRutaMetodo from "./FormularioCompletoRutaMetodo";
import FormularioCompletoCommoditiesMetodo from "./FormularioCompletoCommoditiesMetodo";
import FormularioCalculoPorcentaje from "../Calculo/FormularioCalculoPorcentaje";

const FormularioCompletoMetodo = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    metodo = null, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
    catalogos, // Catalogos referentes al crud
    // nuevo,
    onInput: paramOnInput,
    reConsultar = () => {},
    onTarifaCreada = () => {},
  } = props;
  const { estados = [], tipos = [], tiposTarifa = [], servicio, empresas = [], commodities = [] } = catalogos;

  // paises
  // ciudades
  // industrias
  // monedas

  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    cod_servicio: null,
    fecha_inicial: moment().toDate(),
    fecha_final: null,
    cod_metodo: null,
    cod_estado: null,
    cod_tipo: null,
    cod_tipo_tarifa: null,
    todos_los_paises: true,
    todos_los_commodities: true,
    tipo: null,
    tipo_tarifa: null,
    estados: null,
  });
  const [nuevo, setNuevo] = useState(true);
  const navigate = useNavigate();
  const [key, setKey] = useState(0);
  const [monedas, setMonedas] = useState([]);
  const [keyServicio, setKeyServicio] = useState(0);
  /**
   * FORMULARIO
   * Es un use Memo que contiene el contenido del formulario incluyendo:
   * - inputs
   * - valores
   * - opciones
   */
  const inputs = useMemo(() => {
    const { cod_metodo, estado, tipo, tipo_tarifa, fecha_inicial, fecha_final, todos_los_paises, todos_los_commodities } = valores;
    return {
      grupos: [
        {
          id: "Método",
          label: "Método",
          tipo: "separador",
          size: 6,
          variant: "h6",
        },
        {
          id: "Vigencia",
          label: "Vigencia",
          tipo: "separador",
          size: 6,
          variant: "h6",
        },
        {
          id: "Aplicacion",
          label: "Aplicacion",
          tipo: "separador",
          size: 6,
          variant: "h6",
        },
      ],
      inputs: [
        // { id: "titulo1", tipo: "subtitulo", val: "Aplicacion", readonly: false },
        { grupoId: "Aplicacion", id: "cod_metodo", label: "metodo", tipo: "number", val: cod_metodo, readonly: true, visible: false },
        { grupoId: "Aplicacion", id: "todos_los_paises", label: "Aplica a todos los destino", tipo: "toggle", val: todos_los_paises, readonly: false },
        { grupoId: "Aplicacion", id: "todos_los_commodities", label: "Aplica a todos los commodities", tipo: "toggle", val: todos_los_commodities, readonly: false, size: "grow" },
        { grupoId: "Aplicacion", id: "tipo_tarifa", label: "tipo de tarifa", tipo: "select", val: tipo_tarifa, options: tiposTarifa, readonly: false },
        // { grupoId: "Aplicacion", id: "comentario", tipo: "comentario", val: "", readonly: false },
        // { id: "titulo", tipo: "subtitulo", val: "Vigencia", readonly: false },
        { grupoId: "Vigencia", id: "fecha_inicial", label: "Fecha de inicio", formato: "dd-MM-yyyy HH:mm", tipo: "datetime", val: fecha_inicial, readonly: false, size: 4 },
        { grupoId: "Vigencia", id: "fecha_final", label: "Fecha Final", formato: "dd-MM-yyyy HH:mm", tipo: "datetime", val: fecha_final, readonly: false, size: 4 },
        // { id: "titulo", tipo: "subtitulo", val: "Método", readonly: false },
        {
          grupoId: "Método",
          id: "tipo",
          label: "metodo de calculo a aplicar",
          tipo: "select",
          val: tipo,
          options: tipos.filter((t) => (servicio?.cod_tipo_calculo === 89 || servicio?.cod_tipo_calculo === 90 ? true : t.value !== 148)),
          readonly: false,
          size: 4,
        },
        { id: "estado", label: "estado", tipo: "select", val: estado, options: estados, visible: false, readonly: false },
      ],
    };
  }, [servicio, valores, tipos, tiposTarifa, estados]);
  /**
   * FUNCIONES
   * Utilizando useCallback se generan las funciones para manejar los valores de los inputs
   */
  const setearValores = useCallback(
    (metodo) => {
      setValores(() => {
        const { cod_metodo, cod_estado, cod_tipo, todos_los_paises, todos_los_commodities, fecha_inicial, fecha_final, cod_tipo_tarifa } = metodo;
        console.log({ metodo });
        const estado = metodo.estado ? metodo.estado : estados.find((i) => i.cod_estado === cod_estado);
        const tipo = metodo.tipo ? metodo.tipo : tipos.find((i) => i.cod_tipo === cod_tipo);
        const tipoTarifa = metodo.tipo_tarifa ? metodo.tipo_tarifa : tiposTarifa.find((i) => i.value === cod_tipo_tarifa);
        return {
          ...metodo,
          cod_metodo,
          fecha_inicial: fecha_inicial ? new Date(fecha_inicial) : null,
          fecha_final: fecha_final ? new Date(fecha_final) : null,
          cod_estado: metodo.cod_estado || 1,
          cod_tipo: metodo.cod_tipo || 101,
          cod_tipo_tarifa: metodo.cod_tipo_tarifa || 97,
          todos_los_paises: "todos_los_paises" in metodo ? todos_los_paises : true,
          todos_los_commodities: "todos_los_commodities" in metodo ? todos_los_commodities : true,
          estado: estado ? { ...estado } : { value: 1, label: "ACTIVO" },
          tipo: tipo ? { ...tipo } : { value: 101, label: "RANGO" },
          tipo_tarifa: tipoTarifa ? { ...tipoTarifa } : { value: 97, label: "PUBLICA" },
          todos_los_clientes: false,
          cod_servicio: servicio.cod_servicio,
        };
      });
      setKey((i) => i + 1);
    },
    [servicio, estados, tiposTarifa, tipos],
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
  const consultarMetodo = useCallback(
    async (met, serv) => {
      const metodo = met;
      const servicio = serv;
      await api
        .get("api/appweb/lista-metodos", { params: { cod_estado: 1, cod_metodo: metodo?.cod_metodo, cod_servicio: servicio?.cod_servicio } })
        .then(({ data }) => {
          if (data.data[0]) setearValores(data.data[0]);
          else setearValores(data.data[0] || {});
          if (data.data[0]) setNuevo(false);
          else setNuevo(true);
        })
        .catch((e) => console.error(e));
    },
    [setearValores],
  );
  const onInput = useCallback(({ id, val }) => {
    setValores((v) => {
      if (id === "tipo") return { ...v, [id]: val, cod_tipo: val?.value };
      if (id === "estado") return { ...v, [id]: val, cod_estado: val?.value };
      if (id === "tipo_tarifa") return { ...v, [id]: val, cod_tipo_tarifa: val?.value };
      return { ...v, [id]: val };
    });
  }, []);
  const agregar = useCallback(async () => {
    const { cod_estado } = valores;
    await api.post("api/appweb/insertar-metodos", { ...valores, cod_estado: cod_estado, cod_metodo: undefined, tipo: undefined, estado: undefined, tipo_tarifa: undefined }).then(async ({ data }) => {
      reConsultar();
      consultarMetodo(null, servicio);
    });
  }, [consultarMetodo, servicio, reConsultar, valores]);
  const cancelar = useCallback(() => {}, []);
  const guardar = useCallback(() => {
    const { cod_estado } = valores;
    api.post("api/appweb/actualizar-metodos", { ...valores, cod_estado: cod_estado, tipo: undefined, estado: undefined, tipo_tarifa: undefined }).then(({ data }) => reConsultar());
  }, [reConsultar, valores]);
  const filtrar = useCallback(() => {}, []);

  const renderizarMetodoDeCalculo = useCallback(
    (item) => {
      const consultarDeNuevo = () => {
        (reConsultar(), setKeyServicio((v) => v + 1));
      };
      switch (item) {
        case 101:
          return <FormularioCalculoRango key={keyServicio} reConsultar={consultarDeNuevo} onTarifaCreada={onTarifaCreada} monedas={monedas} servicio={servicio} metodo={valores} />;
        case 102:
          return <FormularioCalculoCostoVenta key={keyServicio} reConsultar={consultarDeNuevo} onTarifaCreada={onTarifaCreada} monedas={monedas} servicio={servicio} metodo={valores} />;
        case 103:
          return <FormularioCalculoEquipo key={keyServicio} reConsultar={consultarDeNuevo} onTarifaCreada={onTarifaCreada} monedas={monedas} servicio={servicio} metodo={valores} />;
        case 148:
          return <FormularioCalculoPorcentaje key={keyServicio} reConsultar={consultarDeNuevo} onTarifaCreada={onTarifaCreada} monedas={monedas} servicio={servicio} metodo={valores} />;

        default:
          return <></>;
      }
    },
    [reConsultar, keyServicio, onTarifaCreada, monedas, servicio, valores],
  );

  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    if (servicio) setKeyServicio((v) => v + 1);
  }, [servicio]);
  useEffect(() => {
    if (metodo) setearValores(metodo);
  }, [setearValores, metodo]);
  useEffect(() => {
    if (servicio && !metodo) consultarMetodo(undefined, servicio);
  }, [consultarMetodo, metodo, servicio]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <FormularioComponent
        key={key}
        data={inputs}
        onInput={onInput}
        botones={{ agregar: { texto: nuevo ? "agregar" : "actializar", color: nuevo ? "primary" : "secondary", onClick: () => (nuevo ? agregar() : guardar()) } }}
      />
      {valores.cod_metodo && (
        <TabComponent
          tabInicial={1}
          opciones={[
            // Tab principal con el formulario completo relacionado al CRUD
            {
              id: 1,
              content: <Box sx={{ p: 1, m: 0 }}>{renderizarMetodoDeCalculo(valores?.cod_tipo)}</Box>,
              label: `Metodo de calculo - ${valores?.tipo?.label}`,
            },
            {
              id: 2,
              content: (
                <Box sx={{ p: 1, m: 0 }}>
                  <FormularioCompletoEntidadMetodo metodo={valores} catalogos={{ monedas, estados, tipos, empresas }} />
                </Box>
              ),
              label: `Clientes ${valores.tipo_tarifa.value !== 97 ? "" : "no "}aplicados`,
            },
            {
              id: 3,
              content: (
                <Box sx={{ p: 1, m: 0 }}>
                  <FormularioCompletoRutaMetodo metodo={valores} />
                </Box>
              ),
              label: `Paises ${valores.todos_los_paises ? "no " : ""}aplicados`,
            },
            {
              id: 4,
              content: (
                <Box sx={{ p: 1, m: 0 }}>
                  <FormularioCompletoDetalleMetodo metodo={valores} />
                </Box>
              ),
              label: "Detalles",
            },
            {
              id: 5,
              content: (
                <Box sx={{ p: 1, m: 0 }}>
                  <FormularioCompletoCommoditiesMetodo metodo={valores} catalogos={{ commodities, estados }} />
                </Box>
              ),
              label: "Commodities",
            },
          ]}
        />
      )}

      <Grid container>
        {/* <pre>{JSON.stringify({ servicio }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ metodo }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ valores }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ tiposTarifa }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ estados }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ tipos }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ servicio }, null, 2)}</pre> */}
      </Grid>
    </Box>
  );
};
FormularioCompletoMetodo.propTypes = {
  // ELEMENTO
  metodo: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  // EVENTOS
  onTarifaCreada: PropTypes.func,
  reConsultar: PropTypes.func,
  onInput: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,
  servicio: PropTypes.object,

  nuevo: PropTypes.bool,
};
export default FormularioCompletoMetodo;
