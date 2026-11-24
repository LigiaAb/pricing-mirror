import { Box, Grid, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import { useNavigate, useParams } from "react-router-dom/dist";
import { encryptId } from "../../../api/encryptDecrypt";
import moment from "moment";
import { api } from "../../../api";
import ActionAlertComponent from "../../../components/Dialog/ActionAlertComponent";
import DialogComponent from "../../../components/Dialog/DialogComponent";
import FormularioCompletoEntidad from "../FormularioCompletoEntidad";
import { FiltroEntidad } from "../FiltroEntidad";
import TablaEntidadActividad from "../../Actividades/TablaEntidadActividad";

const FormularioEntidadAsignacion = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    asignacion,
    id,
    tipo,
    catalogos, // Catalogos referentes al crud
    onCreate,
    busqueda,
    query = () => {}
  } = props;

  const { tipos = [], cencos = [], estados = [], empresas = [], empleados = [], entidades = [] } = catalogos;

  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    cod_asignacion: 0,
  });
  const [mensajeCamposFaltantes, setMensajeCamposFaltantes] = useState("Los campos requeridos para registrar una fila no se han llenado");
  const [mostrarFaltantes, setMostrarFaltantes] = useState(false);
  const [mostrarError, setMostrarError] = useState(false);
  const [mensajeError, setMensajeError] = useState("Error al guardar la entidad. ");
  const navigate = useNavigate();
  const [key, setKey] = useState(0);

  const [openBusqueda, setOpenBusqueda] = useState(false);
  const [openCrear, setOpenCrear] = useState(false);
  const [results, setResults] = useState([]);
  const [item, setItem] = useState({});
  /**
   * FORMULARIO
   * Es un use Memo que contiene el contenido del formulario incluyendo:
   * - inputs
   * - valores
   * - opciones
   */

  const groupItems = (list = [], key) => {
    const uniqueItems = new Map();
    list?.forEach((item) => {
      uniqueItems.set(item[key], item);
    });
    return Array.from(uniqueItems.values()) || [];
  };

  const estados_ = useMemo(
    () =>
      estados?.map((item) => ({
        ...item,
        value: item.cod_estado.toString(),
        label: item.estado_desc,
      })),
    [estados]
  );

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
    if (valores?.empresa) {
      return cencos
        .filter((cenco) => cenco.cod_empresa_cc == valores.empresa.value)
        .map((item) => ({
          ...item,
          value: item.cod_cc.toString(),
          label: item.nombre_cc,
        }));
    }
    return [];
  }, [valores?.empresa, cencos]);

  const empleados_ = useMemo(() => {
    if (valores?.cenco) {
      return groupItems(
        empleados
          ?.filter((empleado) => empleado.cod_cc == valores.cenco.value)
          ?.map((item) => ({
            ...item,
            value: item.cod_usuario.toString(),
            label: `${item.nom_empleado} ${item.apellido_emp}`,
          })),
        "cod_empleado",
      );
    }
    return [];
  }, [valores?.cenco, empleados]);

  const tipos_ = useMemo(
    () =>
      tipos
        ?.filter((tipo) => tipo.tipo_tabla == "ASIGNACION_ENTIDAD")
        ?.map((tipo) => ({
          ...tipo,
          value: tipo.cod_tipo,
          label: tipo.nom_tipo,
        })),
    [valores?.cenco, tipos]
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

  const inputs = useMemo(() => {
    const { cod_asignacion, empleado, cliente, cenco, empresa, tipo, fecha_inicial, fecha_final, estado } = valores;
    return [
      !busqueda ? { id: "cod_asignacion", label: "Código", tipo: "number", val: cod_asignacion, readonly: !busqueda } : null,
      {
        id: "cliente",
        label: "Cliente",
        tipo: "modalselect",
        val: cliente,
        readonly: false,
        options: entidades_,
        onBuscar: () => setOpenBusqueda(true),
        onCrear: () => setOpenCrear(true),
        requerido: !busqueda,
        size: busqueda ? 12 : 6
      },
      { id: "empresa", label: "Empresa", tipo: "select", val: empresa, readonly: false, options: empresas_, requerido: !busqueda },
      { id: "cenco", label: "Centro de Costo", tipo: "select", val: cenco, readonly: false, options: cencos_, requerido: !busqueda },
      { id: "empleado", label: "Empleado", tipo: "select", val: empleado, readonly: false, options: empleados_, requerido: !busqueda },
      { id: "tipo", label: "Tipo de asignación", tipo: "select", val: tipo, readonly: false, options: tipos_, requerido: !busqueda },

      !busqueda ? { id: "fecha_inicial", label: "Fecha Inicial", tipo: "date", val: fecha_inicial, readonly: false, requerido: !busqueda } : null,
      !busqueda ? { id: "fecha_final", label: "Fecha Final", tipo: "date", val: fecha_final, readonly: false, requerido: !busqueda } : null,

      { id: "estado", label: "Estado", tipo: "select", val: estado, readonly: false, options: estados_, requerido: !busqueda } ,
    ].filter(i => !!i);
  }, [valores, empresas_, cencos_, empleados_, tipos_, estados_, entidades_]);
  /**
   * FUNCIONES
   * Utilizando useCallback se generan las funciones para manejar los valores de los inputs
   */
  const onInput = useCallback(({ id, val }) => {
    setValores((v) => {
      if (id == "empresa") {
        return { ...v, [id]: val, cenco: null, empleado: null, contacto: null };
      } else if (id == "cenco") {
        return { ...v, [id]: val, empleado: null, contacto: null };
      } else {
        return { ...v, [id]: val };
      }
    });
  }, []);

  const agregar = useCallback(async () => {
    try {
      const { empleado, cliente, cenco, empresa, estado, fecha_final, fecha_inicial, tipo } = valores;
      const sendData = {
        cod_usuario: empleado.cod_usuario,
        cod_cliente: cliente.entidad_id,
        fecha_final: new Date(fecha_final),
        fecha_inicial: new Date(fecha_inicial),
        cod_emp: empresa.cod_empresa,
        cod_cc: cenco.cod_cc,
        cod_estado: estado.cod_estado,
        cod_tipo: tipo.cod_tipo,
      };

      await api
        .post("api/appweb/insertar-asignacion-entidad", sendData)
        .then(({ data }) => navigate(`../${encryptId(data.data.cod_asignacion)}`))
        .catch((e) => console.error(e));
    } catch (e) {
      console.error(e);
    }
  }, [onCreate, valores]);

  const cancelar = useCallback(() => {}, []);

  const guardar = useCallback(async () => {
    try {
      const { cod_asignacion, empleado, cliente, cenco, empresa, estado, fecha_final, fecha_inicial, tipo } = valores;
      const sendData = {
        cod_asignacion,
        cod_usuario: empleado.value,
        cod_cliente: cliente.value,
        fecha_final: new Date(fecha_final),
        fecha_inicial: new Date(fecha_inicial),
        cod_emp: empresa.value,
        cod_cc: cenco.value,
        cod_estado: estado.value,
        cod_tipo: tipo.value,
      };

      await api
        .post("api/appweb/actualizar-asignacion-entidad", sendData)
        .then(({ data }) => console.log(data.data.mensaje))
        .catch((e) => console.error(e));
    } catch (e) {
      console.error(e);
    }
  }, [valores]);


  const filtrar = useCallback(() => {
    query(valores)
  }, [valores]);

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
      cliente: {
        ...data,
        value: Number(data.entidad_id),
        label: `${entityData.data.data.data_entidad[0]["CODIGO_ENTIDAD"]} - ${data.entidad_nombre}`,
      },
    }));
  };

  const entidadSeleccionada = (data) => {
    setOpenBusqueda(false);
    setResults([]);
    const data_lc = keysToLowerCase(data);
    setValores((oldData) => ({
      ...oldData,
      cliente: {
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

  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    if (!asignacion) return;
    setValores(() => {
      return {
        cod_asignacion: asignacion?.cod_asignacion,
        cliente: {
          value: asignacion?.cod_entidad.toString(),
          label: asignacion?.nombre_cliente,
        },
        empresa: {
          value: asignacion?.cod_empresa.toString(),
          label: asignacion?.nombre_emp,
        },
        cenco: {
          value: asignacion?.cod_cc.toString(),
          label: asignacion?.nombre_cc,
        },
        empleado: {
          value: asignacion?.cod_usuario.toString(),
          label: `${asignacion.nom_empleado} ${asignacion.apellido_emp}`,
        },
        tipo: {
          value: asignacion?.cod_tipo.toString(),
          label: asignacion?.nom_tipo,
        },
        fecha_inicial: new Date(asignacion?.fecha_inicial),
        fecha_final: new Date(asignacion?.fecha_final),
        // cliente: asignacion?.nombre_cliente,

        estado: {
          value: asignacion?.cod_estado.toString(),
          label: asignacion?.estado_desc,
        },
      };
    });
    setKey((i) => i + 1);
  }, [asignacion]);

  return (
    <Box sx={{ m: 0 }}>
      <FormularioComponent
        key={key}
        inputs={inputs}
        onInput={onInput}
        botones={{
          agregar: { visible: !busqueda && (id === "new") , onClick: () => agregar() },
          cancelar: { visible: false, onClick: cancelar },
          guardar: { visible: !busqueda && (id !== "new"), onClick: () => guardar() },
          filtrar: { visible: busqueda, onClick: () => filtrar() },
        }}
      />
      
      <ActionAlertComponent
        titulo=":D"
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
    </Box>
  );
};
FormularioEntidadAsignacion.propTypes = {
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
};
export default FormularioEntidadAsignacion;
