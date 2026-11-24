import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography, Grid } from "@mui/material";
import PropTypes from "prop-types";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import { useNavigate } from "react-router-dom/dist";
import { api } from "../../../api";
import ActionAlertComponent from "../../../components/Dialog/ActionAlertComponent";
import { decryptId } from "../../../api/encryptDecrypt";
import { useSelector } from "react-redux";
import { useFetchCentrosCosto, useFetchEmpresas, useFetchTemperamentos, useFetchTipos, useFetchTratamientos } from "@/hooks/Fetch/useFetchCatalog";

const FormularioCompletoEntidadContactos = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    dataGet = null,
    cliente,
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
    catalogos = {}, // Catalogos referentes al crud,
    onCreate,
    onActividad,
  } = props;

  const { tipos: tiposCatalogo = [], cencos: cencosCatalogo = [], empresas: empresasCatalogo = [], tratamientos: tratamientosCatalogo = [], temperamentos: temperamentosCatalogo = [] } = catalogos;

  const tiposFetch = useFetchTipos();
  const cencosFetch = useFetchCentrosCosto();
  const empresasFetch = useFetchEmpresas();
  const tratamientosFetch = useFetchTratamientos();
  const temperamentosFetch = useFetchTemperamentos();

  const tipos = useMemo(() => (tiposCatalogo.length ? tiposCatalogo : tiposFetch.data) ?? [], [tiposCatalogo, tiposFetch.data]);
  const cencos = useMemo(() => (cencosCatalogo.length ? cencosCatalogo : cencosFetch.data) ?? [], [cencosCatalogo, cencosFetch.data]);
  const empresas = useMemo(() => (empresasCatalogo.length ? empresasCatalogo : empresasFetch.data) ?? [], [empresasCatalogo, empresasFetch.data]);
  const tratamientos = useMemo(() => (tratamientosCatalogo.length ? tratamientosCatalogo : tratamientosFetch.data) ?? [], [tratamientosCatalogo, tratamientosFetch.data]);
  const temperamentos = useMemo(() => (temperamentosCatalogo.length ? temperamentosCatalogo : temperamentosFetch.data) ?? [], [temperamentosCatalogo, temperamentosFetch.data]);

  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    entidadcontactos1: "",
    contactos2: "",
    cod_estado: null,
  });
  const navigate = useNavigate();
  const [key, setKey] = useState(0);
  const [data, setData] = useState(null);
  const [mostrarError, setMostrarError] = useState(false);
  const [mensajeError, setMensajeError] = useState("Error al guardar la entidad. ");

  const { currentPais, currentEmpresa, currentCentroCosto, currentModulo, currentMenu, currentCategoria } = useSelector((state) => state.menu);

  useEffect(() => {
    if (dataGet) {
      setData((oldData) => ({
        entidadcontacto_id: dataGet.entidadcontacto_id,
        entidad_id: cliente?.entidad_id,
        tipo_entidad: cliente?.cod_tipo,
        email: dataGet.entidadcontacto_email,
        nombre: dataGet.entidadcontacto_nombre,
        empresa: dataGet.empresa,
        cenco: dataGet.cenco,
        estado: 0,
        telefono: dataGet.entidadcontacto_telefono,
        lista_tipos: [],
        temperamento: null,
        tratamiento: null,
      }));
    } else {
      setData({
        entidadcontacto_id: 0,
        entidad_id: cliente?.entidad_id,
        tipo_entidad: cliente?.cod_tipo,
        nombre: "",
        email: "",
        empresa: null,
        cenco: null,
        estado: 0,
        telefono: "",
        lista_tipos: [],
        temperamento: null,
        tratamiento: null,
      });
    }
  }, [dataGet]);

  const empresas_ = useMemo(
    () =>
      empresas?.map((item) => ({
        ...item,
        value: item.cod_empresa.toString(),
        label: item.nombre_emp,
      })),
    [empresas],
  );

  const cencos_ = useMemo(() => {
    if (data?.empresa) {
      return cencos
        .filter((cenco) => cenco.cod_empresa_cc == data.empresa.value)
        .map((item) => ({
          ...item,
          value: item.cod_cc.toString(),
          label: item.nombre_cc,
        }));
    }
    return [];
  }, [data?.empresa, cencos]);

  const tratamientos_ = useMemo(
    () =>
      tratamientos?.map((item) => ({
        ...item,
        value: item.cod_tratamiento.toString(),
        label: item.tratamiento_descripcion,
      })),
    [tratamientos],
  );

  const temperamentos_ = useMemo(
    () =>
      temperamentos?.map((item) => ({
        ...item,
        value: item.cod_temperamento.toString(),
        label: item.temperamento_descripcion,
      })),
    [temperamentos],
  );

  /**
   * FORMULARIO
   * Es un use Memo que contiene el contenido del formulario incluyendo:
   * - inputs
   * - valores
   * - opciones
   */
  //
  const inputs = useMemo(() => {
    return [
      !onActividad
        ? {
            id: "entidadcontacto_id",
            label: "Código",
            tipo: "text",
            val: data?.entidadcontacto_id || null,
            readonly: true,
          }
        : null,
      {
        id: "nombre",
        label: "Nombre",
        tipo: "text",
        val: data?.nombre || "",
        readonly: false,
      },
      {
        id: "email",
        label: "Email",
        tipo: "text",
        val: data?.email || "",
        readonly: false,
      },
      {
        id: "telefono",
        label: "Teléfono",
        tipo: "text",
        val: data?.telefono || "",
        readonly: false,
      },
      !onActividad
        ? {
            id: "empresa",
            label: "Empresa",
            tipo: "select",
            options: empresas_,
            val: data?.empresa || "",
            readonly: false,
          }
        : null,
      !onActividad
        ? {
            id: "cenco",
            label: "Centro de Costo",
            val: data?.cenco || "",
            tipo: "select",
            readonly: !data?.empresa,
            options: cencos_,
          }
        : null,
      {
        id: "tratamiento",
        label: "Dirigirse como:",
        tipo: "select",
        options: tratamientos_,
        val: data?.tratamiento || "",
        readonly: false,
      },
      {
        id: "temperamento",
        label: "Tratar de manera:",
        tipo: "select",
        options: temperamentos_,
        val: data?.temperamento || "",
        readonly: false,
      },
      {
        id: "lista_tipos",
        label: "Tipo del contacto:",
        tipo: "select",
        val: data?.lista_tipos || [],
        options: tipos.filter((tipo) => tipo.tipo_tabla == "ENTIDAD_CONTACTOS").map((i) => ({ ...i, value: i.cod_tipo, label: i.nom_tipo })),
        readonly: false,
        requerido: true,
        multiple: true,
      },
    ].filter((input) => input != null);
  }, [data, cencos_, empresas_, temperamentos_, tratamientos_]);

  /**
   * FUNCIONES
   * Utilizando useCallback se generan las funciones para manejar los valores de los inputs
   */

  const onInput = useCallback(({ id, val }) => {
    setData((v) => ({ ...v, [id]: val }));
  }, []);

  const agregar = useCallback(async () => {
    const valores = {
      entidadcontacto_id: 0,
      entidad_id: data?.entidad_id,
      cod_tipo: data?.tipo_entidad,
      entidadcontacto_nombre: data.nombre,
      entidadcontacto_email: data.email,
      cod_emp: onActividad ? currentEmpresa?.cod_empresa : data.empresa?.cod_empresa,
      cod_cc: onActividad ? currentCentroCosto?.cod_cc : data.cenco?.cod_cc,
      cod_estado: 1,
      entidadcontacto_telefono: data.telefono,
      lista_cod_tipo: data.lista_tipos?.map((tipo) => tipo.cod_tipo),
      cod_temperamento: data.temperamento?.value,
      cod_tratamiento: data.tratamiento?.value,
    };

    await api
      .post("api/appweb/insertar-entidad-contacto", valores)
      .then(async ({ data }) => {
        onCreate({ ...valores, entidadcontacto_id: data.data.entidadcontacto_id });
      })
      .catch((err) => {
        console.log({ err });
        setMostrarError(true);
        setMensajeError("Error al guardar el. ");
      });
  }, [navigate, data]);

  const cancelar = useCallback(() => {}, []);

  const guardar = useCallback(() => {
    // const { cod_estado } = valores;
    // api.post("api/appweb/", { ...valores, cod_estado: cod_estado.value });
  }, [valores]);

  const filtrar = useCallback(() => {}, []);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <FormularioComponent
        key={key}
        inputs={inputs}
        onInput={onInput}
        botones={{
          agregar: { visible: id === "new", onClick: () => agregar() },
          cancelar: { visible: false, onClick: cancelar },
          guardar: { visible: id !== "new", onClick: () => guardar() },
          filtrar: { visible: false, onClick: filtrar },
        }}
      />
      <ActionAlertComponent
        titulo=":("
        openDialog={mostrarError}
        tipo="error"
        aceptar={() => {
          setMostrarError(false);
        }}
        cancelar={() => {
          setMostrarError(false);
        }}
        handleClose={(ev) => {
          setMostrarError(false);
        }}
        activarCanecelar={false}
        content={
          <Grid container wdith="100%" direction="column">
            <Grid size={12}>{`${mensajeError}`}</Grid>
          </Grid>
        }
      />
      {/* <pre>{JSON.stringify(tipos, null, 2)}</pre> */}
    </Box>
  );
};
FormularioCompletoEntidadContactos.propTypes = {
  dataGet: PropTypes.object,
  cliente: PropTypes.object.isRequired,
  id: PropTypes.string,
  catalogos: PropTypes.object,
  onCreate: PropTypes.func,
  onActividad: PropTypes.bool,
};
export default FormularioCompletoEntidadContactos;
