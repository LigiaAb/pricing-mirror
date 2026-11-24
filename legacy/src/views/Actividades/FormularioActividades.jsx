import React, { useState, useEffect, useMemo } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import PropTypes from "prop-types";
import { Grid, Icon, Box, Typography, Fab, Drawer, Button } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { encryptId, decryptId } from "../../api/encryptDecrypt";
import FormularioCompletoEntidad from "../Entidad/FormularioCompletoEntidad";
import TablaEntidadActividad from "./TablaEntidadActividad";
import { FiltroEntidad } from "../Entidad/FiltroEntidad";
import DialogComponent from "../../components/Dialog/DialogComponent";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import FormularioCompletoEntidadContactos from "../Entidad/EntidadContactos/FormularioCompletoEntidadContactos";
import TablaContactosActividad from "./TablaContatosActividad";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import BandaAlertaComponent from "../../components/Alertas/BandaAlertaComponent";
import { id } from "date-fns/locale";
import useObtenerOpcionesAcciones from "../../hooks/useObtenerOpcionesAcciones";
import SeguimientoDeCliente from "../../pages/Reportes/reports/CRM/SeguimientoDeCliente";

import { useFetchAllEntidadesSimple, useFetchAllEntidadesSimplePaginada } from "../../hooks/Fetch/useFetchEntidades";
import {
  useFetchCentrosCosto,
  useFetchCiudades,
  useFetchConfiguracionActividad,
  useFetchEmpresas,
  useFetchEstados,
  useFetchIndustrias,
  useFetchMonedas,
  useFetchPaises,
  useFetchTemperamentos,
  useFetchTipos,
  useFetchTratamientos,
} from "../../hooks/Fetch/useFetchCatalog";
import { useFetchEmpleados } from "../../hooks/Fetch/useFetchConfiguracion";
import CODS_TIPOS_ENTIDAD, { NOMBRES_TIPOS_ENTIDAD } from "@/constants/tiposEntidades";
import useCatalogosCotizacion from "../Tarifas/Cotizaciones/hooks/useCatalogosCotizacion";

export const FormularioActividades = (props) => {
  // const nombre_asesor = useSelector((state) => state.auth.nombre);
  // const jsonUser = useSelector((state) => state.auth.json);
  const { currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);
  let { encryptedId, encryptedIdActividad } = useParams();
  let id = encryptedIdActividad ? decryptId(encryptedIdActividad) : decryptId(encryptedId);
  const { permisosArray, catalogoArray } = useObtenerOpcionesAcciones();
  const [abrirSeguimientoCliente, setAbrirSeguimientoCliente] = useState(false);
  // const fetchClientes = useFetchAllEntidadesSimple("clientes", { cod_estado: 1, tipo_entidad: "CLIENTE" }, {});
  // const fetchPreclientes = useFetchAllEntidadesSimple("preclientes", { cod_estado: 1, tipo_entidad: "PRE-CLIENTE" }, {});
  const fetchClientes = useFetchAllEntidadesSimplePaginada([NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.CLIENTE]], { tipo_entidad: NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.CLIENTE] }, {}, undefined, 1);
  const fetchPreclientes = useFetchAllEntidadesSimplePaginada(
    [NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.PRE_CLIENTE]],
    { tipo_entidad: NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.PRE_CLIENTE] },
    {},
    undefined,
    1,
  );

  const { fetchOptionsClientes } = useCatalogosCotizacion();

  const navigate = useNavigate();

  const { nombre, cod_usuario, json } = useSelector((state) => state.auth);

  const { dataGet, readOnlyInput = false, catalogos, onCreate, ignorarLimite = false, updateData, setUpdateData, actualizacion = false } = props;

  const { entidades = [] } = catalogos;

  const estados = useFetchEstados();
  const paises = useFetchPaises();
  const ciudades = useFetchCiudades();
  const industrias = useFetchIndustrias();
  const tipos = useFetchTipos();
  const empresas = useFetchEmpresas();
  const cencos = useFetchCentrosCosto();
  const empleados = useFetchEmpleados();
  const tratamientos = useFetchTratamientos();
  const temperamentos = useFetchTemperamentos();
  const monedas = useFetchMonedas();
  const configuraciones = useFetchConfiguracionActividad();

  const [contactos, setContactos] = useState([]);
  const [data, setData] = useState(null);
  const [openBusqueda, setOpenBusqueda] = useState(false);
  const [openBusquedaContacto, setOpenBusquedaContacto] = useState(false);
  const [openCrear, setOpenCrear] = useState(false);
  const [openCrearContacto, setOpenCrearContacto] = useState(false);
  const [item, setItem] = useState({});
  const [results, setResults] = useState([]);
  const [resultsContactos, setResultsContactos] = useState([]);
  const [fechaLimite, setFechaLimite] = useState(new Date("1900-01-01"));
  const [state, setState] = useState(0);
  const [errorFecha, setErrorFecha] = useState(false);
  const [errorBand, setErrorBand] = useState("");

  const activeInput = (id) => {
    if (!data || !data?.tipo || readOnlyInput) {
      return true;
    }
    return false;
  };

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

  const groupItems = (list = [], key) => {
    const uniqueItems = new Map();
    list?.forEach((item) => {
      uniqueItems.set(item[key], item);
    });
    return Array.from(uniqueItems.values()) || [];
  };

  useEffect(() => {
    const fetchData = async () => {
      if (data?.cliente && data?.cenco) {
        await api
          .get("api/appweb/lista-entidad-contacto", {
            params: {
              cod_tipo: data.cliente.cod_tipo,
              entidad_id: data.cliente.entidad_id,
              cod_cc: data?.cenco.value,
            },
          })
          .then(({ data }) => setContactos(data.data.data))
          .catch((e) => console.error(e));
      }
    };
    fetchData().catch(console.error);
  }, [data?.cliente, data?.cenco]);

  const empresas_ = useMemo(
    () =>
      empresas.data?.map((item) => ({
        ...item,
        value: item.cod_empresa.toString(),
        label: item.nombre_emp,
      })),
    [empresas.data],
  );

  const cencos_ = useMemo(() => {
    if (data?.empresa) {
      return cencos.data
        ?.filter((cenco) => cenco.cod_empresa_cc == data.empresa.value)
        ?.map((item) => ({
          ...item,
          value: item.cod_cc.toString(),
          label: item.nombre_cc,
        }));
    }
    return [];
  }, [data?.empresa, cencos.data]);

  const empleados_ = useMemo(() => {
    if (data?.cenco) {
      return groupItems(
        empleados.data
          ?.filter((empleado) => empleado.cod_cc == data.cenco.value)
          ?.map((item) => ({
            ...item,
            value: item.cod_usuario.toString(),
            label: `${item.nom_empleado} ${item.apellido_emp}`,
          })),
        "cod_empleado",
      );
    }
    return [];
  }, [data?.cenco, empleados.data]);

  const tipos_ = useMemo(
    () =>
      configuraciones.data
        ?.filter((tipo) => !tipo.solo_resultado)
        ?.filter((tipo) => data?.cenco?.value == tipo.cod_cc && tipo.cod_estado == 1)
        ?.map((tipo) => ({
          ...tipo,
          value: tipo.cod_tipo_actividad,
          label: tipo.nom_tipo_actividad,
        })),
    [data?.cenco, configuraciones.data],
  );

  const objetivos_ = useMemo(
    () =>
      tipos.data
        ?.filter((tipo) => tipo.tipo_tabla == "OBJETIVO_ACTIVIDAD")
        ?.map((tipo) => ({
          ...tipo,
          value: tipo.cod_tipo,
          label: tipo.nom_tipo,
        })),
    [tipos.data],
  );

  const entidades_ = useMemo(
    () =>
      entidades?.slice(0, 200).map((item, i) => ({
        ...item,
        value: item.entidad_id,
        label: `${item.codigo_entidad} - ${item.entidad_nombre}`,
      })),
    [entidades.data],
  );

  const contactos_ = useMemo(() => {
    return contactos
      ? contactos.map((contacto) => ({
          ...contacto,
          value: contacto.entidadcontacto_id,
          label: `${contacto.entidadcontacto_nombre}: ${contacto.entidadcontacto_email} - ${contacto.entidadcontacto_telefono}`,
          tipos_string: contacto.data_entidad_contacto_tipo ? [...new Set(JSON.parse(contacto.data_entidad_contacto_tipo).map((item) => item.TIPO_DESCRIPCION))].join(", ") : "",
        }))
      : [];
  }, [contactos]);

  const filtrarEmpresaCentroCosto = () => {
    let accesos = permisosArray.filter((i) => i.cod_opcion == 65);
    if (accesos.length > 0) {
      accesos = accesos[0].acciones?.filter((a) => a.cod_accion == 11);
      if (accesos.length > 0) {
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    if (dataGet) {
      const empresa = empresas.data?.find((i) => dataGet.cod_emp == i.cod_empresa);
      const cenco = cencos.data?.find((i) => dataGet.cod_cc == i.cod_cc);
      const asesor = empleados.data?.find((i) => dataGet.cod_asesor == i.cod_usuario);
      const creador = empleados.data?.find((i) => dataGet.cod_creador == i.cod_usuario);
      const tipo = tipos.data?.find((i) => dataGet.cod_tipo == i.cod_tipo);
      const objetivo = tipos.data?.find((i) => dataGet.cod_objetivo_actividad == i.cod_tipo);

      setData({
        empresa: empresa ? { ...empresa, label: empresa.nombre_emp, value: empresa.cod_empresa } : null,
        cenco: cenco ? { ...cenco, label: cenco.nombre_cc, value: cenco.cod_cc } : null,
        asesor_responsable: asesor ? { ...asesor, label: `${asesor.nom_empleado} ${asesor.apellido_emp}`, value: asesor.cod_usuario } : null,
        creador: creador ? { ...creador, label: `${creador.nom_empleado} ${creador.apellido_emp}`, value: creador.cod_usuario } : null,
        tipo: tipo ? { ...tipo, label: tipo.nom_tipo, value: tipo.cod_tipo } : null,
        objetivo: objetivo ? { ...objetivo, label: objetivo.nom_tipo, value: objetivo.cod_tipo } : null,
        fecha_programada: new Date(dataGet?.fecha_programada),
        asunto: dataGet?.asunto || null,
        descripcion: dataGet?.descripcion || null,
        cliente: null,
        contacto: null,
      });
    } else {
      const empresa = currentEmpresa;
      const cenco = currentCentroCosto;
      const asesor = empleados.data?.find((i) => cod_usuario == i.cod_usuario);

      setData({
        empresa: empresa ? { ...empresa, label: empresa.nombre_emp, value: empresa.cod_empresa } : null,
        cenco: cenco ? { ...cenco, label: cenco.nombre_cc, value: cenco.cod_cc } : null,
        asesor_responsable: asesor ? { ...asesor, label: `${asesor.nom_empleado} ${asesor.apellido_emp}`, value: asesor.cod_usuario } : null,
        creador: null,
        tipo: null,
        objetivo: null,
        fecha_programada: null,
        asunto: null,
        descripcion: null,
        cliente: null,
        contacto: null,
      });
    }
  }, [dataGet, empresas.data, cencos.data]);

  useEffect(() => {
    setData((data) => ({
      ...data,
      cliente: !activeInput("cliente") ? data.cliente : null,
      contacto: !activeInput("contacto") ? data.contacto : null,
      pais: !activeInput("pais") ? data.pais : null,
    }));
  }, [state]);

  const entidadCreada = async (data) => {
    const entityData = await api.post("api/appweb/recuperar-datos-entidad", { cod_tipo: data.cod_tipo, entidad_id: data.entidad_id });

    fetchClientes.refetch();
    fetchPreclientes.refetch();

    setOpenCrear(false);
    entidades_.push({
      ...data,
      value: Number(data.entidad_id),
      label: `${entityData.data.data.data_entidad[0]["CODIGO_ENTIDAD"]} - ${data.entidad_nombre}`,
    });
    setData((oldData) => ({
      ...oldData,
      cliente: {
        ...data,
        value: Number(data.entidad_id),
        label: `${entityData.data.data.data_entidad[0]["CODIGO_ENTIDAD"]} - ${data.entidad_nombre}`,
      },
    }));
  };

  const contactoCreado = async (contacto) => {
    setOpenCrearContacto(false);
    contactos_.push({
      ...contacto,
      value: Number(contacto.entidadcontacto_id),
      label: `${contacto.entidadcontacto_nombre}: ${contacto.entidadcontacto_email} - ${contacto.entidadcontacto_telefono}`,
      tipos_string: "",
    });
    setData((oldData) => ({
      ...oldData,
      contacto: {
        ...contacto,
        value: Number(contacto.entidadcontacto_id),
        label: `${contacto.entidadcontacto_nombre}: ${contacto.entidadcontacto_email} - ${contacto.entidadcontacto_telefono}`,
        tipos_string: "",
      },
    }));
  };

  const entidadSeleccionada = (data) => {
    setOpenBusqueda(false);
    setResults([]);
    const data_lc = keysToLowerCase(data);
    setData((oldData) => ({
      ...oldData,
      cliente: {
        ...data_lc,
        value: Number(data_lc["entidad_id"]),
        label: `${data_lc["codigo_entidad"]} - ${data_lc["entidadnombre_nombre"]}`,
      },
    }));
  };

  const contactoSeleccionado = (contacto) => {
    setOpenBusquedaContacto(false);
    const contacto_lc = keysToLowerCase(contacto);
    setData((oldData) => ({
      ...oldData,
      contacto: { ...contacto_lc },
    }));
  };

  const nuevoEnBusqueda = () => {
    setOpenBusqueda(false);
    setResults([]);
    setOpenCrear(true);
  };

  const nuevoEnContacto = () => {
    setOpenBusquedaContacto(false);
    setResults([]);
    setOpenCrearContacto(true);
  };

  const fetchOptions = async (searchTerm) => {
    return await api
      .get("api/appweb/busqueda-entidad-x-criterio", {
        params: {
          ref_busqueda: searchTerm,
          list_descripcion_tipo: ["CLIENTE", "PRE-CLIENTE"],
          tipo_busqueda: "NOMBRE",
        },
      })
      .then(({ data }) => {
        const convertKeysToLowerCase = (obj) => {
          if (Array.isArray(obj)) {
            return obj.map((v) => convertKeysToLowerCase(v));
          } else if (obj !== null && obj.constructor === Object) {
            return Object.keys(obj).reduce((acc, key) => {
              acc[key.toLowerCase()] = convertKeysToLowerCase(obj[key]);
              return acc;
            }, {});
          }
          return obj;
        };

        const eliminarDuplicadosById = (arr, id) => {
          return arr.filter((item, index) => arr.findIndex((i) => i[id] === item[id]) === index);
        };

        return eliminarDuplicadosById(convertKeysToLowerCase(data.data.data), "entidad_id");
      })
      .catch((e) => {
        console.error(e);
        return [];
      });
  };

  const inputs = useMemo(
    () => [
      {
        id: "empresa",
        label: "Empresa",
        val: data?.empresa || null,
        tipo: "select",
        size: 4,
        readonly: actualizacion ? true : filtrarEmpresaCentroCosto(),
        options: empresas_,
        requerido: true,
      },
      {
        id: "cenco",
        label: "Centro de Costo",
        val: data?.cenco || null,
        tipo: "select",
        size: 4,
        readonly: actualizacion ? true : !data?.empresa || filtrarEmpresaCentroCosto(),
        options: cencos_,
        requerido: true,
      },
      {
        id: "asesor_responsable",
        label: "Asesor Responsable",
        val: data?.asesor_responsable || null,
        tipo: "select",
        size: 4,
        options: empleados_,
        readonly: actualizacion ? true : !data?.cenco,
      },
      {
        id: "tipo",
        label: "Tipo Actividad",
        val: data?.tipo || null,
        tipo: "select",
        size: 6,
        options: tipos_,
        readonly: actualizacion ? true : readOnlyInput,
        requerido: true,
      },
      {
        id: "objetivo",
        label: "Objetivo",
        val: data?.objetivo || null,
        tipo: "select",
        size: 6,
        options: objetivos_,
        readonly: actualizacion ? true : readOnlyInput,
        requerido: true,
      },
      {
        tipo: "datetime",
        id: "fecha_programada",
        label: "Fecha Programada",
        size: 6,
        val: data?.fecha_programada || null,
        readonly: actualizacion ? true : readOnlyInput,
        min: fechaLimite,
        requerido: true,
      },
      // {
      //   tipo: "textarea",
      //   id: "asunto",
      //   size: 6,
      //   val: data?.asunto || "",
      //   label: "Asunto de la actividad",
      //   readonly: readOnlyInput,
      //   requerido: true,
      // },
      {
        tipo: "textarea",
        id: "descripcion",
        size: 12,
        val: data?.descripcion || null,
        label: "Descripcion de la actividad",
        readonly: actualizacion ? true : readOnlyInput,
        requerido: true,
      },
      // {
      //   id: "cliente",
      //   label: "Clientes",
      //   val: data?.cliente || null,
      //   tipo: "modalselect",
      //   size: 6,
      //   options: entidades_,
      //   readonly: activeInput("cliente"),
      //   onBuscar: () => setOpenBusqueda(true),
      //   onCrear: () => setOpenCrear(true),
      //   requerido: data?.tipo?.requiere_cliente || false,
      // },
      {
        id: "cliente",
        tipo: "select",
        label: "Cliente",
        options: [...(fetchClientes?.data?.data || []), ...(fetchPreclientes?.data?.data || [])],
        val: data?.cliente,
        fetchOptions: fetchOptionsClientes,
        valueOption: "entidad_id",
        labelOption: "entidad_nombre",
        size: 6,
        requerido: data?.tipo?.requiere_cliente || false,
        readonly: activeInput("cliente"),
        actions: [{ visible: true, enabled: true, nombre: "Crear Cliente", onClick: () => setOpenCrear(true), icono: "c-suma" }],
      },
      {
        id: "contacto",
        label: "Contacto",
        val: data?.contacto || null,
        tipo: "select",
        size: 6,
        options: contactos_,
        readonly: !data?.cliente || !data?.cenco,
        // onBuscar: () => setOpenBusquedaContacto(true),
        // onCrear: () => setOpenCrearContacto(true),
        actions: [{ visible: true, enabled: true, nombre: "Crear Contacto", onClick: () => setOpenCrearContacto(true), icono: "c-suma" }],
        requerido: data?.tipo?.requiere_cliente || false,
      },
    ],
    [data, tipos_, empresas_, cencos_, contactos_, entidades_, objetivos_, data?.cliente, fechaLimite, fetchOptionsClientes],
  );

  const inputsExistente = useMemo(
    () => [
      {
        id: "empresa",
        label: "Empresa",
        val: data?.empresa || null,
        tipo: "select",
        readonly: true,
        options: empresas_,
      },
      {
        id: "cenco",
        label: "Centro de Costo",
        val: data?.cenco || null,
        tipo: "select",
        readonly: true,
        options: cencos_,
      },
      {
        id: "asesor_responsable",
        label: "Creador",
        val: data?.creador || null,
        tipo: "select",
        readonly: true,
        options: empleados_,
      },
      {
        id: "asesor_responsable",
        label: "Asesor Responsable",
        val: data?.asesor_responsable || null,
        tipo: "select",
        readonly: true,
        options: empleados_,
      },
      {
        id: "tipo",
        label: "Tipo Actividad",
        val: data?.tipo || null,
        tipo: "select",
        size: 6,
        options: tipos_,
        readonly: true,
      },
      {
        id: "objetivo",
        label: "Objetivo",
        val: data?.objetivo || null,
        tipo: "select",
        size: 6,
        options: objetivos_,
        readonly: true,
      },
      {
        tipo: "datetime",
        id: "fecha_programada",
        label: "Fecha Programada",
        size: 6,
        val: data?.fecha_programada || null,
        readonly: true,
      },
      // {
      //   tipo: "textarea",
      //   id: "asunto",
      //   size: 6,
      //   val: data?.asunto || "",
      //   label: "Asunto de actividad",
      //   readonly: true,
      // },
      {
        tipo: "textarea",
        id: "descripcion",
        size: 12,
        val: data?.descripcion || "",
        label: "Descripcion de la actividad",
        readonly: true,
      },
    ],
    [data, tipos_, empresas_, cencos_, objetivos_, data?.cliente],
  );

  const validateFormData = (data) => {
    let errors = {};
    if (!data.empresa) errors.empresa = true;
    if (!data.cenco) errors.cenco = true;
    // if (!data.asesor_responsable) errors.asesor_responsable = true;
    if (!data.tipo) errors.tipo = true;
    if (!data.fecha_programada) errors.fecha_programada = true;
    // if (!data.asunto || data.asunto == "") errors.asunto = true;
    // if (!data.descripcion || data.descripcion == "") errors.descripcion = true;

    if (data.tipo.requiere_cliente && !data.cliente) errors.cliente = true;
    if (data.tipo.requiere_cliente && !data.contacto) errors.contacto = true;
    return errors;
  };

  const handleSubmitPost = async () => {
    setErrorBand("");
    try {
      let errors = validateFormData(data);
      if (Object.keys(errors).length > 0) {
        setErrorBand("Existen campos incorrectos o faltantes");
        throw new Error("Existen campos incorrectos o faltantes");
      }

      if (!evalFechaLimite(data.tipo, data.fecha_programada)) {
        setErrorFecha(true);
        return;
      }
      // ESTAD ACTIVO
      let estado = 23;

      // VALIDAR SI ACTIVIDAD ES FINAL
      if ([34, 35, 36, 37, 38, 55, 56, 57, 58, 59].includes(data.tipo.cod_tipo_actividad)) {
        estado = 24;
      }

      const sendData = {
        fecha_programada: new Date(data.fecha_programada),
        asunto: `${data.tipo.nom_tipo_actividad} ${new Date(data.fecha_programada).toLocaleDateString()} - ${data.cliente.entidad_nombre}`,
        descripcion: data.descripcion,
        cod_tipo: data.tipo.cod_tipo_actividad,
        cod_cliente: data.cliente?.entidad_id,
        cod_emp: data.empresa.cod_empresa,
        cod_cc: data.cenco.cod_cc,
        cod_asesor: data.asesor_responsable?.cod_usuario || cod_usuario,
        contactos: data.contacto ? [data.contacto.entidadcontacto_id] : [],
        cod_estado: estado,
        cod_objetivo_actividad: data.objetivo.value,
      };

      api.post("api/appweb/insertar-actividad", sendData).then(({ data }) => {
        if (data.data.mensaje == "Actividad creada correctamente") {
          if (onCreate) {
            onCreate({
              ...sendData,
              cod_actividad: data.data.cod_actividad,
            });
          } else {
            navigate(`../${encryptId(data.data.cod_actividad)}`);
            // navigate(0)
            // setUpdateData(updateData + 1)
          }
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const evalFechaLimite = (configuracion, evalFecha) => {
    if (ignorarLimite) return true;

    const fechaHoy = new Date();
    const fechaLimite_ = new Date();
    fechaLimite_.setDate(fechaHoy.getDate() - configuracion.dias_creacion);
    if (evalFecha) {
      const fecha = new Date(evalFecha);
      fechaLimite_.setDate(fechaLimite_.getDate() - 1);
      return fecha >= fechaLimite_;
    }
    setFechaLimite(fechaLimite_);
    return false;
  };

  const handleSubmitUpdate = async () => {
    let estado = 23;
    if ([34, 35, 36, 37, 38, 55, 56, 57, 58, 59].includes(data.tipo.cod_tipo_actividad)) {
      estado = 24;
    }
    if (data.cliente || data.contacto)
      await api
        .post("api/appweb/actualizar-actividad", {
          ...data,
          cod_actividad: id,
          cod_cliente: data.cliente?.entidad_id,
          contactos: data.contacto?.entidadcontacto_id,
          cod_tipo: data.tipo.cod_tipo,
          cod_emp: data.empresa.cod_empresa,
          cod_cc: data.cenco.cod_cc,
          cod_asesor: data.asesor_responsable?.cod_usuario || null,
          cod_estado: estado,
          empresa: undefined,
          cenco: undefined,
          asesor_responsable: undefined,
          tipo: undefined,
          cliente: undefined,
          contacto: undefined,
          pais: undefined,
        })
        .then((a) => setUpdateData((v) => v + 1));
    // console.log("SEND", data);
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return;
    }

    setAbrirSeguimientoCliente(open);
  };
  return (
    <Grid sx={{ p: 1, m: 0 }} width={"100%"}>
      {errorBand != "" && <BandaAlertaComponent tipo="error">{errorBand}</BandaAlertaComponent>}
      {data && dataGet && !actualizacion && (
        <Grid display="flex" flexDirection="column">
          <FormularioComponent
            inputs={inputsExistente}
            onInput={({ id, val }) => {
              setData((inp) => ({ ...inp, [id]: val }));
              setState(state + 1);
            }}
            botones={{
              agregar: { visible: false, onClick: null },
              cancelar: { visible: false, onClick: null },
              guardar: { visible: false, onClick: null },
              filtrar: { visible: false, onClick: null },
            }}
          />
        </Grid>
      )}
      {(!dataGet || actualizacion) && (
        <Grid>
          <FormularioComponent
            inputs={inputs}
            onInput={({ id, val }) => {
              if (id == "empresa") {
                setData((inp) => ({ ...inp, [id]: val, cenco: null, asesor_responsable: null, contacto: null }));
              } else if (id == "cenco") {
                setData((inp) => ({ ...inp, [id]: val, asesor_responsable: null, contacto: null }));
              } else if (id == "cliente") {
                setData((inp) => ({ ...inp, [id]: val, contacto: null }));
              } else if (id == "tipo") {
                evalFechaLimite(val);
                setData((inp) => ({ ...inp, [id]: val }));
              } else {
                setData((inp) => ({ ...inp, [id]: val }));
              }
              setState(state + 1);
            }}
            botones={{
              agregar: {
                texto: actualizacion ? <>Actualizar Actividad</> : <>Crear Actividad</>,
                visible: true,
                onClick: actualizacion ? () => handleSubmitUpdate() : () => handleSubmitPost(),
              },
              cancelar: { visible: false, onClick: null },
              guardar: { visible: false, onClick: null },
              filtrar: { visible: false, onClick: null },
            }}
          />
        </Grid>
      )}
      {data?.tipo && (
        <ActionAlertComponent
          aceptar={() => {
            setErrorFecha(false);
          }}
          activarCanecelar={false}
          openDialog={errorFecha}
          tipo="error"
          handleClose={() => {}}
          content={`Las actividades de tipo ${data.tipo.label} no pueden crearse mas de ${data.tipo.dias_creacion} dias atras`}
        />
      )}
      <DialogComponent openDialog={openCrear} handleClose={() => setOpenCrear(false)} titulo="Crear Pre-Cliente" width="80vw">
        <Grid sx={{ display: "flex", flexDirection: "column", px: 3 }}>
          <FormularioCompletoEntidad id="new" tipo={5} cliente={item} catalogos={catalogos} onCreate={entidadCreada} />
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
            listaTipos={tipos}
            tipoDefaultIndex={2}
          />

          <TablaEntidadActividad lista={results} reConsultar={null} obtenerFilaSeleccionada={entidadSeleccionada} handleNuevo={nuevoEnBusqueda} />
        </Grid>
      </DialogComponent>
      <DialogComponent openDialog={openCrearContacto} handleClose={() => setOpenCrearContacto(false)} titulo="Crear Contacto" width="80vw">
        <Grid sx={{ display: "flex", flexDirection: "column", px: 3 }}>
          <FormularioCompletoEntidadContactos
            id="new"
            cliente={data?.cliente}
            catalogos={{
              empresas: empresas.data,
              tipos: tipos.data,
              cencos: cencos.data,
              tratamientos: tratamientos.data,
              temperamentos: temperamentos.data,
            }}
            onCreate={contactoCreado}
            onActividad
          />
        </Grid>
      </DialogComponent>
      <Button
        size="small"
        color="primary"
        aria-label="seguimiento"
        variant="outlined"
        sx={{
          margin: 0,
          top: 100,
          right: 20,
          bottom: "auto",
          left: "auto",
          position: "fixed",
        }}
        onClick={toggleDrawer(true)}
      >
        {/* <Typography variant="span" className="c-logo-dsv" sx={{ fontSize: "25px !important", fontWeight: 100 }} /> */}Seguimientos
      </Button>
      <Drawer sx={{ maxWidth: "50%", "& .MuiDrawer-paper": { maxWidth: "50%" } }} anchor={"right"} open={abrirSeguimientoCliente} onClose={toggleDrawer(false)}>
        <Box sx={{ padding: "1em" }}>
          <SeguimientoDeCliente mostrar_filtro={false} cod_entidad_default={dataGet?.cod_cliente} height="90vh" />
        </Box>
      </Drawer>
    </Grid>
  );
};

FormularioActividades.propTypes = {
  dataGet: PropTypes.object,
  readOnlyInput: PropTypes.bool,
  catalogos: PropTypes.object, // { entidades, empresas, estados, paises, ciudades, industrias, tipos, cencos, empleados, tratamientos, temperamentos }
  updateData: PropTypes.func,
  setUpdateData: PropTypes.func,
};
