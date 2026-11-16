import { useState, useMemo, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { Grid } from "@mui/material";
import { api } from "../../../../../api";
import FormularioComponent from "../../../../../components/Formulario/FormularioComponent";
import useInputsFitroTarifas from "./hooks/useInputsFitroTarifas";
import DialogComponent from "../../../../../components/Dialog/DialogComponent";
import { FiltroEntidad } from "../../../../../views/Entidad/FiltroEntidad";
import TablaEntidadActividad from "../../../../../views/Actividades/TablaEntidadActividad";
import FormularioCompletoEntidad from "../../../../../views/Entidad/FormularioCompletoEntidad";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { encenderCarga, apagarCarga } from "../../../../../store/slices/status/statusSlice";

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

const CODS_TIPOS_ENTIDAD = {
  PRE_PROVEEDOR: 15,
};

const selectsLimpios = {
  empresa: null,
  centroCosto: null,
  tipoTransporte: null,
  proveedor: null,
  tipoCarga: null,
  clasificacionCarga: null,
};

const formatFiltrosToApiSubmissionFormat = (filtros) => {
  const filtorsConFormato = {
    cod_empresa: filtros.empresa?.value,
    cod_cc: filtros.centroCosto?.value,
    cod_tipo_transporte: filtros.tipoTransporte?.value,
    cod_tipo_servicio: filtros.tipoServicio?.value,
    entidad_id: filtros.proveedor?.value,
    cod_tipo_carga: filtros.tipoCarga?.value,
    cod_clasificacion_carga: filtros.clasificacionCarga?.value,
    incoterm_id: filtros.incoterm?.value,
    cod_tipo_pago: filtros.tipoPago?.value,
  };

  delete filtorsConFormato.empresa;
  delete filtorsConFormato.centroCosto;
  delete filtorsConFormato.tipoTransporte;
  delete filtorsConFormato.tipoServicio;
  delete filtorsConFormato.proveedor;
  delete filtorsConFormato.tipoCarga;
  delete filtorsConFormato.clasificacionCarga;
  delete filtorsConFormato.incoterm;
  delete filtorsConFormato.tipoPago;
  return filtorsConFormato;
};

const FormularioFiltroTrarifas = ({ defaultValues, inputsToHide = [], catalogos, onSubmit = () => {} }) => {
  const dispatch = useDispatch();
  const { empresas = [], centrosCostos = [], tiposTransporte = [], tiposServicio = [], tiposCarga = [], clasificacionesCarga = [], incoterms = [], tiposPago = [] } = catalogos;
  const { currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);

  const [isOpenDialogBusquedaProveedor, setIsOpenDialogBusquedaProveedor] = useState(false);
  const [isOponDialogCrearProveedor, setIsOpenDialogCrearProveedor] = useState(false);
  const [opcionesProveedores, setOpcionesProveedores] = useState([]);
  const [catalogosProveedor, setCatalogosProveedor] = useState({
    estados: [],
    tipos: [],
    paises: [],
    ciudades: [],
    industrias: [],
    monedas: [],
  });

  const valoresIniciales = useMemo(() => {
    return {
      ...selectsLimpios,
      empresa: currentEmpresa,
      centroCosto: currentCentroCosto,
    };
  }, [currentEmpresa, currentCentroCosto]);

  const [valores, setValores] = useState({
    empresa: null,
    centroCosto: null,
    tipoTransporte: null,
    proveedor: null,
    tipoCarga: null,
    clasificacionCarga: null,
    incoterm: null,
    tipoPago: null,
  });

  useEffect(() => {
    if (defaultValues) {
      setValores({
        ...valoresIniciales,
        ...defaultValues,
      });
    } else {
      setValores(valoresIniciales);
    }
  }, []);

  const obtenerEstados = useCallback(async () => await api.get("api/appweb/listaestados").then(({ data }) => setCatalogosProveedor((v) => ({ ...v, estados: data.data }))), []);
  const obtenerTipos = useCallback(async () => await api.get("api/appweb/lista-tipo").then(({ data }) => setCatalogosProveedor((v) => ({ ...v, tipos: data.data }))), []);
  const obtenerPaises = useCallback(async () => await api.get("api/appweb/listapaises").then(({ data }) => setCatalogosProveedor((v) => ({ ...v, paises: data.data }))), []);
  const obtenerCiudades = useCallback(async () => await api.get("api/appweb/lista-ciudad").then(({ data }) => setCatalogosProveedor((v) => ({ ...v, ciudades: data.data }))), []);
  const obtenerIndustrias = useCallback(async () => await api.get("api/appweb/lista-industria").then(({ data }) => setCatalogosProveedor((v) => ({ ...v, industrias: data.data }))), []);
  const obtenerMonedas = useCallback(async () => await api.get("api/appweb/lista-moneda").then(({ data }) => setCatalogosProveedor((v) => ({ ...v, monedas: data.data }))), []);
  const obtenerEmpresas = useCallback(async () => await api.get("api/appweb/listaempresas").then(({ data }) => setCatalogosProveedor((v) => ({ ...v, empresas: data.data }))), []);

  useEffect(() => {
    const fetchData = async () => {
      dispatch(encenderCarga());
      try {
        await Promise.all([obtenerEstados(), obtenerTipos(), obtenerPaises(), obtenerCiudades(), obtenerIndustrias(), obtenerMonedas(), obtenerEmpresas()]);
      } catch (error) {
        console.error("Error al obtener datos:", error);
      } finally {
        dispatch(apagarCarga());
      }
    };

    fetchData();
  }, [dispatch, obtenerEstados, obtenerTipos, obtenerPaises, obtenerCiudades, obtenerIndustrias, obtenerMonedas, obtenerEmpresas]);

  const centrosCostosSeleccionables = useMemo(() => {
    return centrosCostos.filter((cc) => cc.cod_empresa_cc === valores.empresa?.value);
  }, [valores.empresa, centrosCostos]);

  const inputsFiltrosTarifas = useInputsFitroTarifas({
    empresas,
    centrosCostos: centrosCostosSeleccionables,
    tiposTransporte,
    tiposServicio,
    tiposCarga,
    clasificacionesCarga,
    incoterms,
    tiposPago,
    valores,
    inputsToHide,
    setIsOpenDialogBusquedaProveedor,
    setIsOpenDialogCrearProveedor,
  });

  const obtenerPorveedorSeleccionado = (proveedor) => {
    setIsOpenDialogBusquedaProveedor(false);
    setOpcionesProveedores([]);
    const data_lc = keysToLowerCase(proveedor);
    setValores((prev) => ({
      ...prev,
      proveedor: {
        ...data_lc,
        value: +data_lc.entidad_id,
        label: `${data_lc.codigo_entidad} - ${data_lc.entidad_nombre}`,
      },
    }));
  };

  const handleOpenCreacionProveedor = () => {
    setIsOpenDialogCrearProveedor(true);
    setIsOpenDialogBusquedaProveedor(false);
  };

  const handleProveedorCreado = async (optionProveedor) => {
    const baseApiURL = "api/appweb/recuperar-datos-entidad";
    const response = await api.post(baseApiURL, { cod_tipo: optionProveedor.cod_tipo, entidad_id: optionProveedor.entidad_id });
    let [proveedor] = response.data.data.data_entidad;
    proveedor = keysToLowerCase(proveedor);
    setIsOpenDialogCrearProveedor(false);
    setValores((prev) => ({
      ...prev,
      proveedor: {
        ...proveedor,
        value: +proveedor.entidad_id,
        label: `${proveedor.codigo_entidad} - ${proveedor.entidad_nombre}`,
      },
    }));
  };

  const handleInputChange = ({ id, val }) => {
    setValores((prev) => {
      const newValues = { ...prev, [id]: val };
      if (id === "empresa") newValues.centroCosto = null;
      if (id === "tipoTransporte") {
        newValues.tipoServicio = newValues.cod_tipo_servicio = null;
      }
      if (id === "proveedor") {
        newValues.entidad_id = newValues.proveedor?.value;
      }
      return newValues;
    });
  };

  const handleSubmit = () => {
    onSubmit(formatFiltrosToApiSubmissionFormat(valores));
  };

  return (
    <>
      <FormularioComponent
        inputs={inputsFiltrosTarifas}
        onInput={handleInputChange}
        botones={{
          agregar: { visible: false, onClick: () => {} },
          buscar: { visible: true, onClick: handleSubmit },
        }}
      />

      <Grid sx={{ width: "100%", height: "100%" }}>
        <DialogComponent
          titlo="Buscar Proveedor"
          openDialog={isOpenDialogBusquedaProveedor}
          handleClose={() => {
            setIsOpenDialogBusquedaProveedor(false);
            setOpcionesProveedores([]);
          }}
          width="80vw"
          height="85vh"
        >
          <FiltroEntidad
            tiposEntidad={["PRE-PROVEEDOR", "PROVEEDOR"]}
            tiposBusqueda={[
              { label: "CODIGO", value: 1 },
              { label: "NIT", value: 2 },
              { label: "NOMBRE", value: 3 },
            ]}
            setResults={setOpcionesProveedores}
            useCache={false}
            listaTipos={catalogosProveedor.tipos}
            tipoDefaultIndex={3}
          />

          <TablaEntidadActividad lista={opcionesProveedores} reConsultar={null} obtenerFilaSeleccionada={obtenerPorveedorSeleccionado} handleNuevo={handleOpenCreacionProveedor} />
        </DialogComponent>

        <DialogComponent titulo="Crear Proveedor" openDialog={isOponDialogCrearProveedor} handleClose={() => setIsOpenDialogCrearProveedor(false)} width="80vw" height="85vh">
          <FormularioCompletoEntidad id="new" tipo={CODS_TIPOS_ENTIDAD.PRE_PROVEEDOR} cliente={{}} catalogos={catalogosProveedor} onCreate={handleProveedorCreado} />
        </DialogComponent>
      </Grid>
    </>
  );
};

FormularioFiltroTrarifas.propTypes = {
  defaultValues: PropTypes.object,
  inputsToHide: PropTypes.array,
  catalogos: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  filterOnLoad: PropTypes.bool,
};

export default FormularioFiltroTrarifas;
