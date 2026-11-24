import React, { useState, useEffect, useMemo } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { Grid, Icon, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { encryptId, decryptId } from "../../api/encryptDecrypt";
import FormularioCompletoEntidad from "../Entidad/FormularioCompletoEntidad";
// import TablaEntidadActividad from "./TablaEntidadActividad";
import TablaEntidadActividad from "../Actividades/TablaEntidadActividad";
import { FiltroEntidad } from "../Entidad/FiltroEntidad";
import DialogComponent from "../../components/Dialog/DialogComponent";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import FormularioCompletoEntidadContactos from "../Entidad/EntidadContactos/FormularioCompletoEntidadContactos";
import TablaContactosActividad from "../Actividades/TablaContatosActividad";

export const FormularioOportunidad = (props) => {
  const navigate = useNavigate();

  const { nombre, cod_usuario, json } = useSelector((state) => state.auth);

  const { dataGet, setUpdateData, updateData, readOnlyInput = false, catalogos } = props;
  const { entidades, empresas = [], estados, paises, ciudades, industrias, tipos = [], cencos = [], empleados = [] } = catalogos;
  const [data, setData] = useState(null);
  const [openBusqueda, setOpenBusqueda] = useState(false);
  const [openCrear, setOpenCrear] = useState(false);
  const [item, setItem] = useState({});
  const [results, setResults] = useState([]);
  const [state, setState] = useState(0);
  const dispatch = useDispatch();

  const activeInputsMap = {
    CORREO: ["cliente", "contacto"],
    LLAMADA: ["cliente", "contacto"],
    VISITA: ["cliente", "contacto"],
    "SALES LEADS": ["cliente", "contacto", "pais"],
    "CALENDARIZAR COTIZACION": ["cliente", "contacto"],
    "CALENDARIZAR CTS": ["cliente", "contacto"],
    "COTIZACION REALIZADA": ["cliente", "contacto"],
    "CTS REALIZADO": ["cliente", "contacto"],
    "REUNION EN OFICINA": [],
    "FUERA DE LA OFICINA": [],
    "FILE REALIZADO": ["cliente", "contacto"],
    "CONFIRMAR COTIZACION": ["cliente", "contacto"],
  };

  const activeInput = (id) => {
    if (!data || !data?.tipo || readOnlyInput) {
      return true;
    }
    return !activeInputsMap[data?.tipo.label] || !activeInputsMap[data?.tipo.label].includes(id);
  };

  const empresas_ = useMemo(
    () =>
      empresas?.map((item) => ({
        ...item,
        value: item.cod_empresa.toString(),
        label: item.nombre_emp,
      })),
    [empresas]
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

  const empleados_ = useMemo(() => {
    if (data?.cenco) {
      return empleados
        .filter((empleado) => empleado.cod_cc == data.cenco.value)
        .map((item) => ({
          ...item,
          value: item.cod_usuario.toString(),
          label: `${item.nom_empleado} ${item.apellido_emp}`,
        }));
    }
    return [];
  }, [data?.cenco, empleados]);

  const tipos_ = useMemo(
    () =>
      tipos
        ?.filter((tipo) => tipo.tipo_tabla == "OPORTUNIDAD")
        .map((item) => ({
          ...item,
          value: item.cod_tipo,
          label: item.nom_tipo,
        })),
    [tipos]
  );

  const entidades_ = useMemo(
    () =>
      entidades?.map((item, i) => ({
        ...item,
        value: item.entidad_id,
        label: `${item.codigo_entidad} - ${item.entidad_nombre}`,
      })),
    [entidades]
  );

  useEffect(() => {
    if (dataGet) {
      const empresa = empresas.find((i) => dataGet.cod_emp == i.cod_empresa);
      const cenco = cencos.find((i) => dataGet.cod_cc == i.cod_cc);
      const tipo = tipos.find((i) => dataGet.cod_tipo == i.cod_tipo);

      setData({
        empresa: empresa ? { ...empresa, label: empresa.nombre_emp, value: empresa.cod_empresa } : null,
        cenco: cenco ? { ...cenco, label: cenco.nombre_cc, value: cenco.cod_cc } : null,
        tipo: tipo ? { ...tipo, label: tipo.nom_tipo, value: tipo.cod_tipo } : null,
        cliente: null,
        fecha_inicio: null,
        fecha_entrega: null,
        asunto: dataGet?.asunto || "",
        descripcion: dataGet?.descripcion || "",
        objetivo_importe: null,
        objetivo_movimiento: null,
      });
    } else {
      // const empresa = empresas.find((i) => json.configuracion.empresas[0] == i.cod_empresa)
      // const cenco = cencos.find((i) => json.configuracion.centrosCosto[0] == i.cod_cc)
      const empresa = JSON.parse(decryptId(localStorage.getItem("currentEmpresa")));
      const cenco = JSON.parse(decryptId(localStorage.getItem("currentCentroCosto")));

      setData({
        empresa: empresa ? { ...empresa, label: empresa.nombre_emp, value: empresa.cod_empresa } : null,
        cenco: cenco ? { ...cenco, label: cenco.nombre_cc, value: cenco.cod_cc } : null,
        tipo: null,
        cliente: null,
        fecha_inicio: null,
        fecha_entrega: null,
        asunto: null,
        descripcion: null,
        objetivo_importe: null,
        objetivo_movimiento: null,
      });
    }
  }, [dataGet, empresas, cencos]);

  const entidadCreada = async (data) => {
    const entityData = await api.post("api/appweb/recuperar-datos-entidad", { cod_tipo: data.cod_tipo, entidad_id: data.entidad_id });

    setOpenCrear(false);
    entidades_.push({
      ...data,
      value: Number(data.entidad_id),
      label: `${entityData.data.data.data_entidad[0]["CODIGO_ENTIDAD"]} - ${data.entidad_nombre}`,
    });
    setData((oldData) => ({
      ...oldData,
      cliente: {
        ...entityData,
        value: Number(data.entidad_id),
        label: `${entityData.data.data.data_entidad[0]["CODIGO_ENTIDAD"]} - ${data.entidad_nombre}`,
      },
    }));
  };

  const entidadSeleccionada = (data) => {
    setOpenBusqueda(false);
    setResults([]);
    setData((oldData) => ({
      ...oldData,
      cliente: {
        ...data,
        value: Number(data["ENTIDAD_ID"]),
        label: `${data["CODIGO_ENTIDAD"]} - ${data["ENTIDADNOMBRE_NOMBRE"]}`,
      },
    }));
  };

  const nuevoEnBusqueda = () => {
    setOpenBusqueda(false);
    setResults([]);
    setOpenCrear(true);
  };

  const inputs = useMemo(
    () => [
      {
        id: "empresa",
        label: "Empresa",
        val: data?.empresa || null,
        tipo: "select",
        size: 6,
        readonly: false,
        options: empresas_,
        requerido: true,
      },
      {
        id: "cenco",
        label: "Centro de Costo",
        val: data?.cenco || null,
        tipo: "select",
        size: 6,
        readonly: !data?.empresa,
        options: cencos_,
        requerido: true,
      },
      {
        id: "tipo",
        label: "Proyecto o Licitación",
        val: data?.tipo || null,
        tipo: "select",
        size: 6,
        options: tipos_,
        readonly: readOnlyInput,
        requerido: true,
      },
      {
        id: "cliente",
        label: "Cliente",
        val: data?.cliente || null,
        tipo: "modalselect",
        size: 6,
        options: entidades_,
        readonly: false,
        requerido: true,
        onBuscar: () => setOpenBusqueda(true),
        onCrear: () => setOpenCrear(true),
      },
      {
        tipo: "datetime",
        id: "fecha_inicio",
        label: "Fecha de Inicio",
        size: 6,
        requerido: true,
        val: data?.fecha_inicio || null,
        readonly: readOnlyInput,
      },
      {
        tipo: "datetime",
        id: "fecha_entrega",
        label: "Fecha de Entrega",
        size: 6,
        requerido: true,
        val: data?.fecha_entrega || null,
        readonly: readOnlyInput,
      },
      {
        tipo: "textarea",
        id: "asunto",
        size: 6,
        requerido: true,
        val: data?.asunto || null,
        label: "Asunto del Proyecto o Licitación",
        readonly: readOnlyInput,
      },
      {
        tipo: "textarea",
        id: "descripcion",
        size: 6,
        requerido: true,
        val: data?.descripcion || null,
        label: "Descripcion deL Proyecto o Licitación",
        readonly: readOnlyInput,
      },
      {
        tipo: "number",
        id: "objetivo_movimiento",
        size: 6,
        requerido: true,
        val: data?.objetivo_movimiento || 0,
        label: "Cantidad de Movimiento",
        readonly: readOnlyInput,
        icono: "c-bienes",
      },
      {
        tipo: "quetzales",
        id: "objetivo_importe",
        size: 6,
        requerido: true,
        val: data?.objetivo_importe || 0,
        label: "Cantidad de Importe",
        readonly: readOnlyInput,
      },
    ],
    [data, tipos_, empresas_, cencos_, entidades_, data?.cliente]
  );

  const validateFormData = (data) => {
    let errors = {};
    if (!data.empresa) errors.empresa = true;
    if (!data.cenco) errors.cenco = true;
    if (!data.tipo) errors.tipo = true;
    if (!data.cliente) errors.cliente = true;
    if (!data.fecha_inicio) errors.fecha_inicio = true;
    if (!data.fecha_entrega) errors.fecha_entrega = true;
    if (!data.asunto || data.asunto == "") errors.asunto = true;
    if (!data.descripcion || data.descripcion == "") errors.descripcion = true;
    return errors;
  };

  const handleSubmitPost = async () => {
    try {
      validateFormData(data);
      if (Object.keys(validateFormData(data)).length > 0) {
        console.log(validateFormData(data));
        throw new Error("Existen campos incorrectos o faltantes");
      }

      const sendData = {
        cod_empresa: data.empresa.value,
        cod_cc: data.cenco.value,
        cod_tipo: data.tipo.value,
        cod_cliente: data.cliente.value,
        fecha_inicio: new Date(data.fecha_inicio),
        fecha_entrega: new Date(data.fecha_entrega),
        fecha_cierre: null,
        asunto: data.asunto,
        descripcion: data.descripcion,
        objetivo_movimientos: Number(data.objetivo_movimiento),
        objetivo_importe: Number(data.objetivo_importe),
        cod_usuario: cod_usuario,
        cod_estado: 29,
      };

      api
        .post("api/appweb/insertar-oportunidad", sendData)
        .then(({ data }) => {
          if (data.data.mensaje == "Proyecto o Licitación creado correctamente") {
            // navigate(-1)
            navigate(`../${encryptId(data.data.cod_oportunidad)}`);
            // alert("Oportunidad creada correctamente")
          } else {
            throw new Error("Error al crear la oportunidad");
          }
        })
        .catch((e) => console.error(e));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Grid sx={{ p: 1, m: 0 }}>
      <Grid>
        <FormularioComponent
          inputs={inputs}
          onInput={({ id, val }) => {
            if (id == "empresa") {
              setData((inp) => ({ ...inp, [id]: val, cenco: null }));
            } else {
              setData((inp) => ({ ...inp, [id]: val }));
            }
            setState(state + 1);
          }}
          botones={{
            agregar: { visible: true, onClick: handleSubmitPost },
            cancelar: { visible: false, onClick: null },
            guardar: { visible: false, onClick: null },
            filtrar: { visible: false, onClick: null },
          }}
        />
      </Grid>

      <DialogComponent
        openDialog={openCrear}
        handleClose={() => setOpenCrear(false)}
        titulo="Crear Pre-Cliente"
        width="80vw"
        children={
          <Grid sx={{ display: "flex", flexDirection: "column", px: 3 }}>
            <FormularioCompletoEntidad id="new" tipo={5} cliente={item} catalogos={catalogos} onCreate={entidadCreada} />
          </Grid>
        }
      />

      <DialogComponent
        openDialog={openBusqueda}
        handleClose={() => {
          setOpenBusqueda(false);
          setResults([]);
        }}
        titulo="Buscar Cliente"
        children={
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
        }
      />
    </Grid>
  );
};
