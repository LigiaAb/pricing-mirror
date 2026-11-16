import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import { api } from "../../../api";
import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";
import { useSelector } from "react-redux";
import { Grid } from "@mui/material";
import DialogComponent from "../../../components/Dialog/DialogComponent";
import FormularioCompletoEntidad from "../../../views/Entidad/FormularioCompletoEntidad";
import { FiltroEntidad } from "../../../views/Entidad/FiltroEntidad";
import TablaEntidadActividad from "../../../views/Actividades/TablaEntidadActividad";
import { useFetchCentrosCosto, useFetchEmpresas, useFetchRelacionTipo, useFetchTipos } from "../../../hooks/Fetch/useFetchCatalog";
import { useFetchIncoterms } from "../../../hooks/Fetch/useFetchTarifas";
import { useFetchAllEntidadesSimple } from "../../../hooks/Fetch/useFetchEntidades";

const GenerarFiltroInicial = (props) => {
  const { retornarCriterios, reconsultarPlantilla } = props;
  const allClientes = useFetchAllEntidadesSimple(["clientes"], { cod_estado: 1, tipo_entidad: "CLIENTE" }, {}, ["CLIENTE"]);
  const empresas = useFetchEmpresas();
  const centrosCosto = useFetchCentrosCosto();
  const tiposTransporte = useFetchTipos({ tipo_tabla: "TRANSPORTE" });
  const tiposCarga = useFetchTipos({ tipo_tabla: "TIPO_CARGA" });
  const clasificacionCarga = useFetchTipos({ tipo_tabla: "CLASIFICACION_CARGA" });
  const tiposServicio = useFetchRelacionTipo({ tipo_tabla: "SERVICIO", tipo_padre_tabla: "TRANSPORTE" });
  const incoterms = useFetchIncoterms();
  const tiposPagos = useFetchTipos({ tipo_tabla: "PAGO" });

  const keysToLowerCase = (obj) => {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => keysToLowerCase(item));
    }
    return Object.keys(obj).reduce((acc, key) => {
      const lowerCaseKey = key.toLowerCase();
      acc[lowerCaseKey] = keysToLowerCase(obj[key]);
      return acc;
    }, {});
  };

  const { currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);

  const [catalogosEntidad, setCatalogosEntidad] = useState({ estados: [], tipo: [], paises: [], ciudades: [], industrias: [], monedas: [] });

  const [entidades, setEntidades] = useState([]);
  const [results, setResults] = useState([]);

  const [initialized, setInitialized] = useState(false);

  const [openBusqueda, setOpenBusqueda] = useState(false);
  const [openCrear, setOpenCrear] = useState(false);
  const [item, setItem] = useState({});

  const { permisosArray } = useObtenerOpcionesAcciones();

  const opcion = useMemo(() => permisosArray.find((i) => i.nom_opcion === "Calcular"), [permisosArray]);

  const [valores, setValores] = useState({
    empresa: null,
    centro_costo: null,
    tipo_transporte: null,
    cod_tipo_carga: null,
    cod_clasificacion_carga: null,
    incoterm: null,
    cod_tipo_pago: null,
    tipo_servicio: null,
    entidad_id: null,
  });

  const centrosCostoFiltrados = useMemo(() => centrosCosto.data?.filter((i) => i.cod_empresa_cc === valores.empresa?.value) || [], [centrosCosto, valores]);
  const tipoServicioFiltrados = useMemo(
    () => tiposServicio.data?.filter((i) => i.cod_tipo_padre === valores.tipo_transporte?.value).map((ts) => ({ ...ts, label: ts.tipo_desc, value: ts.cod_tipo })) || [],
    [tiposServicio, valores],
  );

  const entidadSeleccionada = (data) => {
    setOpenBusqueda(false);
    setResults([]);
    const data_lc = keysToLowerCase(data);
    setValores((oldData) => ({
      ...oldData,
      entidad_id: {
        ...data_lc,
        value: Number(data_lc["entidad_id"]),
        label: `${data_lc["codigo_entidad"]} - ${data_lc["entidadnombre_nombre"]}`,
      },
    }));
  };

  const nuevoEnBusqueda = () => {
    setOpenBusqueda(false);
    setResults([]);
    setOpenCrear(true);
  };

  const entidades_ = useMemo(
    () =>
      entidades?.slice(0, 200).map((item, i) => ({
        ...item,
        value: item.entidad_id,
        label: `${item.codigo_entidad} - ${item.entidad_nombre}`,
      })),
    [entidades],
  );

  const inputs = useMemo(
    () => [
      {
        id: "empresa",
        val: valores.empresa,
        requerido: true,
        tipo: "select",
        options: empresas.data,
        labelOption: "label",
        valueOption: "value",
        label: "empresa",
        visible: opcion?.acciones?.some((i) => i.cod_accion === 11),
      },
      {
        id: "centro_costo",
        val: valores.centro_costo,
        requerido: true,
        tipo: "select",
        options: centrosCostoFiltrados,
        labelOption: "label",
        valueOption: "value",
        label: "centro de costo",
        readonly: !valores.empresa,
        visible: opcion?.acciones?.some((i) => i.cod_accion === 11),
      },
      {
        id: "tipo_transporte",
        val: valores.tipo_transporte,
        requerido: true,
        tipo: "select",
        options: tiposTransporte.data,
        labelOption: "label",
        valueOption: "value",
        label: "Tipo de transporte",
      },
      {
        id: "tipo_servicio",
        val: valores.tipo_servicio,
        requerido: false,
        tipo: "select",
        options: tipoServicioFiltrados,
        labelOption: "label",
        valueOption: "value",
        label: "Tipo de servicio",
        readonly: !valores.tipo_transporte,
      },
      {
        id: "cod_tipo_carga",
        val: valores.cod_tipo_carga,
        requerido: false,
        tipo: "select",
        options: tiposCarga.data,
        labelOption: "label",
        valueOption: "value",
        label: "Tipo de Carga",
        // readonly: !valores.tipo_transporte,
      },
      {
        id: "cod_clasificacion_carga",
        val: valores.cod_clasificacion_carga,
        requerido: false,
        tipo: "select",
        options: clasificacionCarga.data,
        labelOption: "label",
        valueOption: "value",
        label: "Clasificación de Carga",
        // readonly: !valores.tipo_transporte,
      },
      {
        id: "incoterm",
        val: valores.incoterm,
        requerido: false,
        tipo: "select",
        options: incoterms.data || [],
        labelOption: "label",
        valueOption: "value",
        label: "Incoterm",
        // renderOption: "valor_incoterm",
        // readonly: !valores.tipo_transporte,
      },
      {
        id: "cod_tipo_pago",
        val: valores.cod_tipo_pago,
        requerido: false,
        tipo: "select",
        options: tiposPagos.data || [],
        labelOption: "label",
        valueOption: "value",
        label: "Tipo de Pago",
        // readonly: !valores.tipo_transporte,
      },
      {
        id: "entidad_id",
        label: "Cliente",
        tipo: "select",
        options: allClientes.data?.data || [],
        labelOption: "entidad_nombre",
        valueOption: "entidad_id",
        requerido: true,
        val: valores.entidad_id,
        actions: [
          // {
          //   nombre: "Agregar",
          //   icono: "c-suma",
          //   onClick: () => console.log(true),
          // },
        ],
      },
    ],
    [valores, empresas, opcion, centrosCostoFiltrados, tiposTransporte, tipoServicioFiltrados, tiposCarga, clasificacionCarga, incoterms, tiposPagos, allClientes],
  );

  const entidadCreada = async (data) => {
    const entityData = await api.post("api/appweb/recuperar-datos-entidad", { cod_tipo: data.cod_tipo, entidad_id: data.entidad_id });

    setOpenCrear(false);
    entidades_.push({
      ...data,
      value: Number(data.entidad_id),
      label: `${entityData.data.data.data_entidad[0]["CODIGO_ENTIDAD"]} - ${data.entidad_nombre}`,
    });
    setValores((oldData) => ({
      ...oldData,
      entidad_id: {
        ...data,
        value: Number(data.entidad_id),
        label: `${entityData.data.data.data_entidad[0]["CODIGO_ENTIDAD"]} - ${data.entidad_nombre}`,
      },
    }));
  };

  const onInput = useCallback(async ({ id, val }) => {
    if (id === "empresa") setValores((v) => ({ ...v, centro_costo: null, [id]: val }));
    else if (id === "tipo_transporte") setValores((v) => ({ ...v, tipo_servicio: null, [id]: val }));
    else setValores((v) => ({ ...v, [id]: val }));
  }, []);

  const enviar = useCallback(
    async (tipo) => {
      let filtros = {
        cod_empresa: valores.empresa?.value,
        cod_cc: valores.centro_costo?.value,
        cod_tipo_transporte: valores.tipo_transporte?.value,
        cod_tipo_servicio: valores.tipo_servicio?.value,
        cod_tipo_carga: valores.cod_tipo_carga?.value,
        cod_clasificacion_carga: valores.cod_clasificacion_carga?.value,
        incoterm_id: valores.incoterm?.value,
        cod_tipo_pago: valores.cod_tipo_pago?.value,
        entidad_id: valores.entidad_id?.entidad_id,
      };
      await api
        .get("/api/appweb/recupera-datos-plantilla", {
          params: { ...filtros },
        })
        .then(async ({ data }) => {
          if (!Array.isArray(data?.data)) {
            retornarCriterios({ criterios: [], rubros: [] }, null, [], {}, [], tipo, data.data.message);
            throw new Error(data?.data.mensaje);
          }
          const gruposRubros =
            data.data[0].cod_tarifaplantilla !== 0
              ? (await api.get("/api/appweb/recupera-datos-grupos", { params: { cod_pantilla: data.data[0].cod_tarifaplantilla, cod_estado: 1, ...filtros } }).then(({ data }) => data.data)) || []
              : [];
          const serviciosInternos = (await api.get("/api/appweb/lista-servicios", { params: { servicio_interno: true, cod_estado: 1, ...filtros } }).then(({ data }) => data.data)) || [];

          const citerios = (
            await Promise.all(serviciosInternos.map((i) => api.get("/api/appweb/obtener-criterios", { params: { cod_servicio: i.cod_servicio } }).then(({ data }) => data.data)))
          ).reduce((arr, acc) => {
            arr.push(...acc);

            return arr;
          }, []);

          // console.log(data.data);

          retornarCriterios(
            {
              ...data.data[0],
              criterios: [...(data.data[0]?.criterios || []), ...citerios].reduce((arr, acc) => {
                if (!arr.some((i) => i.campo === acc.campo)) arr.push(acc);

                return arr;
              }, []),
              rubros: [...(data.data[0]?.rubros || [])],
            },
            valores.entidad_id,
            valores,
            filtros,
            gruposRubros,
            tipo,
          );
        })
        .catch((error) => {
          retornarCriterios({ criterios: [], rubros: [] }, null, [], [], tipo, error.message);
        });
    },
    [retornarCriterios, valores],
  );

  const obtenerEstados = useCallback(async () => await api.get("api/appweb/listaestados").then(({ data }) => setCatalogosEntidad((v) => ({ ...v, estados: data.data }))), []);
  const obtenerTipos = useCallback(async () => await api.get("api/appweb/lista-tipo").then(({ data }) => setCatalogosEntidad((v) => ({ ...v, tipos: data.data }))), []);
  const obtenerPaises = useCallback(async () => await api.get("api/appweb/listapaises").then(({ data }) => setCatalogosEntidad((v) => ({ ...v, paises: data.data }))), []);
  const obtenerCiudades = useCallback(async () => await api.get("api/appweb/lista-ciudad").then(({ data }) => setCatalogosEntidad((v) => ({ ...v, ciudades: data.data }))), []);
  const obtenerIndustrias = useCallback(async () => await api.get("api/appweb/lista-industria").then(({ data }) => setCatalogosEntidad((v) => ({ ...v, industrias: data.data }))), []);
  const obtenerMonedas = useCallback(async () => await api.get("api/appweb/lista-moneda").then(({ data }) => setCatalogosEntidad((v) => ({ ...v, monedas: data.data }))), []);

  const consultarCatalogosEntidades = useCallback(async () => {
    await Promise.all([obtenerEstados(), obtenerTipos(), obtenerPaises(), obtenerCiudades(), obtenerIndustrias(), obtenerMonedas()]);
  }, [obtenerEstados, obtenerTipos, obtenerPaises, obtenerCiudades, obtenerIndustrias, obtenerMonedas]);
  const consultarCatalogos = useCallback(async () => {
    await Promise.all([]);
  }, []);

  const consultar = useCallback(async () => {
    await Promise.all([consultarCatalogos(), consultarCatalogosEntidades()]);
  }, [consultarCatalogos, consultarCatalogosEntidades]);

  useEffect(() => {
    setCatalogosEntidad((v) => ({ ...v, empresas: empresas.data }));
  }, [empresas.data]);

  useEffect(() => {
    consultar();
  }, [consultar]);

  useEffect(() => {
    reconsultarPlantilla !== 0 ? enviar(1) : null;
  }, [reconsultarPlantilla]);

  useEffect(() => {
    if (!initialized && empresas.data && centrosCosto.data) {
      setValores((v) => ({
        ...v,
        empresa: empresas.data?.find((i) => i.value === currentEmpresa?.cod_empresa) || null,
        centro_costo: centrosCosto.data?.filter((i) => i.cod_empresa_cc === currentEmpresa?.cod_empresa)?.find((i) => i.value === currentCentroCosto?.cod_cc) || null,
      }));
      setInitialized(true);
    }
  }, [empresas.data, centrosCosto.data, currentEmpresa, currentCentroCosto]); // Eliminar centrosCostoFiltrados de las dependencias

  return (
    <>
      {/* {reconsultarPlantilla} */}
      <FormularioComponent inputs={inputs} onInput={onInput} botones={{ agregar: { texto: "Buscar Criterios", onClick: () => enviar(0) } }} />
      <Grid container>
        {/* <pre>{JSON.stringify(opcion, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(currentEmpresa, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(currentCentroCosto, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(catalogosEntidad.tipos, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(catalogosEntidad.estados, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(valores.entidad_id, null, 2)}</pre> */}
      </Grid>
      {/* <Button onClick={() => setOpenCrear(true)}>:D</Button> */}
      <DialogComponent openDialog={openCrear} handleClose={() => setOpenCrear(false)} titulo="Crear Pre-Cliente" width="80vw">
        <Grid sx={{ display: "flex", flexDirection: "column", px: 3 }}>
          <FormularioCompletoEntidad id="new" tipo={5} cliente={item} catalogos={catalogosEntidad} onCreate={entidadCreada} />
        </Grid>
      </DialogComponent>

      <DialogComponent
        openDialog={openBusqueda}
        handleClose={() => {
          setOpenBusqueda(false);
          setResults([]);
        }}
        titulo="Buscar Cliente"
      >
        <Grid sx={{ display: "flex", flexDirection: "column", px: 3, minWidth: "80vw", maxHeight: "80vh" }}>
          <FiltroEntidad
            tiposEntidad={["PRE-CLIENTE", "CLIENTE"]}
            tiposBusqueda={[
              { label: "CODIGO", value: 1 },
              { label: "NIT", value: 2 },
              { label: "NOMBRE", value: 3 },
            ]}
            setResults={setResults}
            useCache={false}
            listaTipos={catalogosEntidad.tipos}
            tipoDefaultIndex={2}
          />

          <TablaEntidadActividad lista={results} reConsultar={null} obtenerFilaSeleccionada={entidadSeleccionada} handleNuevo={nuevoEnBusqueda} />
        </Grid>
      </DialogComponent>
    </>
  );
};

GenerarFiltroInicial.propTypes = {
  retornarCriterios: PropTypes.func,
  reconsultarPlantilla: PropTypes.number,
};

export default GenerarFiltroInicial;
