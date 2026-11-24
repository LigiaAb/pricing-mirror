import { Box, Grid, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useNavigate, useParams } from "react-router-dom/dist";
import { decryptId, encryptId } from "../../api/encryptDecrypt";
import moment from "moment";
import { api } from "../../api";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import DialogComponent from "../../components/Dialog/DialogComponent";
import LoaderComponent from "../../components/Loader/LoaderComponent";
import { useFetchPaises, useFetchEstados, useFetchIndustrias, useFetchEmpresas, useFetchMonedas, useFetchCiudades } from "../../hooks/Fetch/useFetchCatalog";
const FormularioCompletoEntidad = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    cliente, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
    tipo,
    catalogos, // Catalogos referentes al crud
    insertarPais,
    onCreate,
    tipoStr,
  } = props;
  // const { paises = [], ciudades = [], industrias = [], empresas = [], monedas = [] } = catalogos;

  const {
    paises: paisesCatalogo = [],
    ciudades: ciudadesCatalogo = [],
    industrias: industriasCatalogo = [],
    empresas: empresasCatalogo = [],
    monedas: monedasCatalogo = [],
    estados: estadosCatalogo = [],
  } = catalogos;

  const paisesFetch = useFetchPaises();
  const ciudadesFetch = useFetchCiudades();
  const industriasFetch = useFetchIndustrias();
  const empresasFetch = useFetchEmpresas();
  const monedasFetch = useFetchMonedas();
  const estadosFetch = useFetchEstados();

  const paises = useMemo(() => (paisesCatalogo.length ? paisesCatalogo : paisesFetch.data) ?? [], [paisesCatalogo, paisesFetch.data]);
  const ciudades = useMemo(() => (ciudadesCatalogo.length ? ciudadesCatalogo : ciudadesFetch.data) ?? [], [ciudadesCatalogo, ciudadesFetch.data]);
  const industrias = useMemo(() => (industriasCatalogo.length ? industriasCatalogo : industriasFetch.data) ?? [], [industriasCatalogo, industriasFetch.data]);
  const empresas = useMemo(() => (empresasCatalogo.length ? empresasCatalogo : empresasFetch.data) ?? [], [empresasCatalogo, empresasFetch.data]);
  const monedas = useMemo(() => (monedasCatalogo.length ? monedasCatalogo : monedasFetch.data) ?? [], [monedasCatalogo, monedasFetch.data]);
  const estados = useMemo(() => (estadosCatalogo.length ? estadosCatalogo : estadosFetch.data) ?? [], [estadosCatalogo, estadosFetch.data]);

  let { encryptedId, encryptedTipo } = useParams();
  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    entidad_id: 0,
    entidad_nombre: "",
    cod_ciudad: null,
    cod_pais: null,
    cod_industria: null,
    limite_credito: 0,
    cod_moneda: null,
    credito_utilizado: 0,
    cod_estado: null,
    cod_tipo: tipo,
    paises_asociados: [],
  });
  const [mensajeCamposFaltantes, setMensajeCamposFaltantes] = useState("Los campos requeridos para registrar una fila no se han llenado");
  const [mostrarFaltantes, setMostrarFaltantes] = useState(false);
  const [mostrarError, setMostrarError] = useState(false);
  const [subiendoAOracle, setSubiendoAOracle] = useState(false);
  const [mensajeError, setMensajeError] = useState("Error al guardar la entidad. ");
  const navigate = useNavigate();
  const [key, setKey] = useState(0);
  /**
   * FORMULARIO
   * Es un use Memo que contiene el contenido del formulario incluyendo:
   * - inputs
   * - valores
   * - opciones
   */
  const inputs = useMemo(() => {
    const { entidad_id, entidad_nombre, cod_ciudad, cod_pais, cod_industria, limite_credito, cod_moneda, credito_utilizado, cod_estado, cod_tipo, paises_asociados } = valores;
    const estado = estados.find((e) => e.cod_estado === cod_estado);
    return [
      { id: "entidad_id", label: "cliente", tipo: "number", val: entidad_id, readonly: true },
      { id: "entidad_nombre", label: "nombre", requerido: true, tipo: "text", val: entidad_nombre, readonly: false },
      {
        id: "cod_pais",
        label: "Pais",
        tipo: "select",
        val: cod_pais,
        requerido: true,
        options: paises.map((i) => ({ ...i, label: i.nombre_pais, value: i.cod_pais })),
      },
      {
        id: "cod_ciudad",
        label: "Ciudad",
        tipo: "select",
        val: cod_ciudad,
        requerido: true,
        options: ciudades.filter((c) => (cod_pais ? c.cod_pais === cod_pais.cod_pais : false)).map((i) => ({ ...i, label: i.nombre_ciudad, value: i.cod_ciudad })),
      },
      {
        id: "cod_industria",
        label: "industria",
        tipo: "select",
        val: cod_industria,
        requerido: true,
        options: industrias.map((i) => ({ ...i, label: i.nom_industria_es, value: i.cod_industria })),
      },
      {
        id: "limite_credito",
        label: "Limite de Credito",
        tipo: "number",
        val: limite_credito,
        requerido: ["CLIENTE", "PRE-CLIENTE"].includes(tipoStr),
      },
      {
        id: "cod_moneda",
        label: "Moneda de Credito",
        tipo: "select",
        val: cod_moneda,
        options: monedas.map((i) => ({ ...i, label: i.nom_moneda, value: i.cod_moneda })),
        requerido: false, // ["CLIENTE", "PRE-CLIENTE"].includes(tipoStr),
      },
      {
        id: "credito_utilizado",
        label: "Credito Utilizado",
        tipo: "number",
        val: credito_utilizado,
        requerido: false, // ["CLIENTE", "PRE-CLIENTE"].includes(tipoStr),
      },
      {
        id: "cod_estado",
        label: "estado",
        tipo: "select",
        val: cod_estado,
        requerido: true,
        options: estados.map((i) => ({ ...i, label: i.estado_desc, value: i.cod_estado })),
        readonly: id === "new",
        visible: id !== "new",
      },
      {
        id: "paises_asociados",
        label: "El cliente se relacionará con:",
        tipo: "checkbox",
        val: paises_asociados,
        options: empresas
          .filter((obj, index, self) => index === self.findIndex((t) => t.pais_emp === obj.pais_emp))
          .map((i) => ({ ...paises.find((p) => p.cod_pais === i.pais_emp) }))
          .map((i) => ({ value: i.cod_pais, label: i.nombre_pais })),
        readonly: false,
        requerido: insertarPais ? insertarPais : id === "new",
        size: 12,
        visible: insertarPais ? insertarPais : id === "new",
      },
    ];
  }, [valores, paises, ciudades, industrias, estados, empresas, insertarPais, id, monedas, tipoStr]);
  /**
   * FUNCIONES
   * Utilizando useCallback se generan las funciones para manejar los valores de los inputs
   */
  const onInput = useCallback(({ id, val }) => {
    setValores((v) => ({ ...v, [id]: val }));
  }, []);

  const agregar = useCallback(async () => {
    const { entidad_id, entidad_nombre, cod_ciudad, cod_pais, cod_industria, limite_credito, cod_moneda, credito_utilizado, cod_estado, cod_tipo, paises_asociados } = valores;
    if (paises_asociados.length > 0) {
      let dataAEnviar = {
        entidad_nombre,
        cod_ciudad: cod_ciudad?.value,
        cod_pais: cod_pais?.value,
        cod_industria: cod_industria?.value,
        limite_credito: parseFloat(limite_credito),
        cod_moneda: cod_moneda?.value,
        credito_utilizado: parseFloat(credito_utilizado),
        cod_estado: cod_estado?.value,
        cod_tipo,
      };
      await api
        .post("api/appweb/insertar-entidad", dataAEnviar)
        .then(async ({ data }) => {
          await Promise.all([
            ...paises_asociados.map(async (i) => {
              await api.post("api/appweb/insertar-entidad-nombres", {
                entidad_id: Number(data.data.entidad_id),
                cod_pais: Number(i),
                cod_estado: cod_estado.value,
                entidadnombre_nombre: entidad_nombre,
                cod_tipo: 26,
              });
              await api.post("api/appweb/insertar-entidad-paises", { entidad_id: Number(data.data.entidad_id), cod_pais: Number(i) });
            }),
          ]).then((i) =>
            onCreate
              ? onCreate({ ...dataAEnviar, entidad_id: Number(data.data.entidad_id) })
              : navigate(`/${tipoStr.includes("CLIENTE") ? "crm/clientes" : "proveedores/proveedor"}/${tipoStr.toLowerCase().replace(/ /g, "-")}/${encryptedTipo}/${encryptId(data.data.entidad_id)}`),
          );
        })
        .catch((err) => {
          console.log({ err });
          // setMostrarError(true);
          setMensajeError("Error al guardar la entidad. ");
        });
    } else {
      setMostrarFaltantes(true);
      setMensajeCamposFaltantes("Paises Relacionados");
    }
  }, [onCreate, tipo, valores]);
  const cancelar = useCallback(() => {}, []);
  const guardar = useCallback(() => {
    const { entidad_id, entidad_nombre, cod_ciudad, cod_pais, cod_industria, limite_credito, cod_moneda, credito_utilizado, cod_estado } = valores;
    api.post("api/appweb/actualizar-entidad", {
      entidad_id,
      entidad_nombre,
      cod_ciudad: cod_ciudad?.value,
      cod_pais: cod_pais?.value,
      cod_industria: cod_industria?.value,
      limite_credito: parseFloat(limite_credito),
      cod_moneda: cod_moneda?.value,
      credito_utilizado: parseFloat(credito_utilizado),
      cod_estado: cod_estado?.value,
    });
  }, [valores]);

  const actualizarOracle = useCallback(async () => {
    setSubiendoAOracle(true);
    const { entidad_id } = valores;
    await api
      .post("api/appweb/replicar-cliente-oracle-forzado", { entidad_id })
      .then(() => setSubiendoAOracle(false))
      .catch(() => setSubiendoAOracle(false));
  }, [valores]);
  const filtrar = useCallback(() => {}, []);
  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    setValores(() => {
      const { cod_estado, entidad_id, entidad_nombre, cod_ciudad, cod_pais, cod_industria, limite_credito, cod_moneda, credito_utilizado, cod_tipo } = cliente || {};
      const estado = estados?.map((i) => ({ ...i, label: i.estado_desc, value: i.cod_estado })).find((i) => i.cod_estado === cod_estado);
      const pais = paises?.map((i) => ({ ...i, label: i.nombre_pais, value: i.cod_pais })).find((i) => i.cod_pais === cod_pais);
      const ciudad = ciudades?.map((i) => ({ ...i, label: i.nombre_ciudad, value: i.cod_ciudad })).find((i) => i.cod_ciudad === cod_ciudad);
      const industria = industrias?.map((i) => ({ ...i, label: i.nom_industria_es, value: i.cod_industria })).find((i) => i.cod_industria === cod_industria);
      const moneda = monedas?.map((i) => ({ ...i, label: i.nom_moneda, value: i.cod_moneda })).find((i) => i.cod_moneda === cod_moneda);
      return {
        entidad_id: entidad_id || 0,
        entidad_nombre: entidad_nombre || "",
        cod_ciudad: ciudad || null,
        cod_pais: pais || null,
        cod_industria: industria || null,
        limite_credito: limite_credito || "",
        cod_moneda: moneda || null,
        credito_utilizado: credito_utilizado || "",
        cod_tipo: tipo,
        paises_asociados: [],
        cod_estado: estado ? estado : { value: 1, label: "ACTIVO" },
      };
    });
    setKey((i) => i + 1);
  }, [estados, cliente, tipo, paises, ciudades, industrias, monedas]);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <FormularioComponent
        key={key}
        inputs={inputs}
        onInput={onInput}
        botones={{
          agregar: { visible: id === "new", onClick: () => agregar() },
          cancelar: { visible: false, onClick: cancelar },
          guardar: { visible: id !== "new", validar: true, onClick: () => guardar() },
          "Actualizar en Oracle": { visible: id !== "new" && tipoStr === "CLIENTE", onClick: () => actualizarOracle(), readonly: subiendoAOracle },
          filtrar: { visible: false, onClick: filtrar },
        }}
      />
      <Grid container>
        {/* <pre>
        {JSON.stringify(
          empresas
            .filter((obj, index, self) => index === self.findIndex((t) => t.pais_emp === obj.pais_emp))
            .map((i) => ({ ...paises.find((p) => p.cod_pais === i.pais_emp) })),
          null,
          2
        )}
      </pre> */}
        {/* <pre>{JSON.stringify(valores, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ paises_asociados: valores.paises_asociados.length }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(paises, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(ciudades, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(industrias, null, 2)}</pre> */}
      </Grid>
      <ActionAlertComponent
        titulo=":D"
        openDialog={mostrarError}
        tipo="error"
        aceptar={() => {
          // setMostrarError(false);
        }}
        cancelar={() => {
          // setMostrarError(false);
        }}
        handleClose={(ev) => {
          // setMostrarError(false);
        }}
        activarCanecelar={false}
        content={
          <Grid container wdith="100%" direction="column">
            <Grid size={12}>{`${mensajeError}`}</Grid>
          </Grid>
        }
      />
      <ActionAlertComponent
        aceptar={() => {
          setMostrarFaltantes(false);
        }}
        cancelar={() => {
          setMostrarFaltantes(false);
        }}
        openDialog={mostrarFaltantes}
        tipo="error"
        activarCanecelar={false}
        handleClose={(ev) => {
          setMostrarFaltantes(false);
        }}
        content={
          <Grid container wdith="100%" direction="column">
            <Grid size={12}>{`Por favor complete los siguientes campos:`}</Grid>

            {mensajeCamposFaltantes}
          </Grid>
        }
      />
      <LoaderComponent open={subiendoAOracle} />
    </Box>
  );
};
FormularioCompletoEntidad.propTypes = {
  // ELEMENTO
  cliente: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  tipo: PropTypes.number,
  // EVENTOS
  reConsultar: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,
  insertarPais: PropTypes.bool,

  onCreate: PropTypes.func,

  tipoStr: PropTypes.string,
};
export default FormularioCompletoEntidad;
