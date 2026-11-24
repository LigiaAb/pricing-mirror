import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, CircularProgress, Grid } from "@mui/material";
import PropTypes from "prop-types";
import { api } from "../../api";
import { useSelector } from "react-redux";
import { TablaActividades } from "../../views/Actividades/TablaActividades";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { colores_estados } from "../../theme/colores_actividad";

export const ListaActividades = (props) => {
  const { json, cod_usuario } = useSelector((state) => state.auth);
  const { filtros, cod_cc, cod_usuario_prop, cod_estado, cod_oportunidad, vencidas = false, asignacion = false } = props;
  const dispatch = useDispatch();

  const filtrosDefault = {
    estado: true,
    empresa: false,
    cenco: false,
    empleado: false,
    fecha: false,
  };

  const [data, setData] = useState({
    estado: null,
    empresa: null,
    cenco: null,
    empleado: null,
    fecha_inicio: null,
    fecha_fin: null,
  });

  const inputsActivos = { ...filtrosDefault, ...filtros };

  const [state, setState] = useState(0);
  const [actividades, setActividades] = useState([]);
  const [estados, setEstados] = useState();
  const [empresas, setEmpresas] = useState();
  const [cencos, setCencos] = useState();
  const [entidades, setEntidades] = useState([]);
  const [empleados, setEmpleados] = useState();
  const [updateData, setUpdateData] = useState(0);
  // const [ inputsActivos, setInputsActivos ] = useState();

  const [accionesDeTabla, setAccionesDeTabla] = useState({
    add: false,
    view: true,
    go: false,
    copy: false,
    paste: false,
    auth: false,
    edit: false,
    excel: false,
    pdf: false,
    download: false,
    delete: false,
  });

  const obtenerEntidades = useCallback(async () => {
    let lista_entidades = [];
    let tipos_entidades = ["CLIENTE", "PRE-CLIENTE", "DSV"];

    for (let tipo in tipos_entidades) {
      await api
        .get("api/appweb/lista-entidad-simplificada", { params: { tipo_entidad: tipos_entidades[tipo] } })
        .then(({ data }) => {
          lista_entidades = lista_entidades.concat(data.data.data);
        })
        .catch((e) => console.error(e));
    }
    setEntidades(lista_entidades);
  }, []);

  const obtenerActividades = useCallback(async () => {
    if (cod_oportunidad) {
      await api
        .get("api/appweb/lista-actividad-oportunidad", {
          params: {
            cod_oportunidad: cod_oportunidad,
          },
        })
        .then(({ data }) => setActividades(data.data || []))
        .catch((e) => console.error(e));
    } else if (vencidas) {
      await api
        .get("api/appweb/lista-actividades-vencidas", { params: { cod_cc: cod_cc } })
        .then(({ data }) => setActividades(data.data || []))
        .catch((e) => console.error(e));
    } else if (asignacion) {
      await api
        .get("api/appweb/lista-actividades-sin-asignar", { params: { cod_cc: cod_cc } })
        .then(({ data }) => setActividades(data.data || []))
        .catch((e) => console.error(e));
    } else {
      await api
        .get("api/appweb/lista-actividades", {
          params: {
            cod_asesor: cod_usuario_prop,
            cod_cc: cod_cc,
            cod_estado: cod_estado,
          },
        })
        .then(({ data }) => setActividades(data.data || []))
        .catch((e) => console.error(e));
    }
  }, []);

  const obtenerEstados = useCallback(async () => {
    await api
      .get("api/appweb/listaestados")
      .then(({ data }) => setEstados(data.data?.filter((estado) => estado.nom_tipo === "ACTIVIDAD")))
      .catch((e) => console.error(e));
  }, []);

  const obtenerEmpresas = useCallback(async () => {
    await api
      .get("api/appweb/listaempresas")
      .then(({ data }) => setEmpresas(data.data || []))
      .catch((e) => console.error(e));
  }, []);

  const obtenerCencos = useCallback(async () => {
    await api
      .get("api/appweb/listacentrocosto")
      .then(({ data }) => setCencos(data.data || []))
      .catch((e) => console.error(e));
  }, []);

  const obtenerEmpleados = useCallback(async () => {
    await api
      .get("api/appweb/listaemp-usu-puesto")
      .then(({ data }) => setEmpleados(data.data || []))
      .catch((e) => console.error(e));
  }, []);

  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerActividades(), obtenerEntidades(), obtenerEmpleados(), obtenerCencos(), obtenerEmpresas(), obtenerEstados()]).then(() => dispatch(apagarCarga()));
  }, [obtenerActividades, obtenerEmpleados, obtenerEntidades, obtenerEstados, obtenerEmpresas, updateData, dispatch]);

  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);

  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  useEffect(() => {
    let empresa = null;
    let cenco = null;
    let asesor = null;
    let estado = null;

    if (cod_cc) {
      cenco = cencos?.find((i) => cod_cc == i.cod_cc) || null;
      empresa = cenco ? empresas?.find((i) => cenco.cod_empresa_cc == i.cod_empresa) || null : null;
    }

    if (cod_usuario_prop) {
      asesor = empleados?.find((i) => cod_usuario_prop == i.cod_usuario) || null;
      cenco = cencos?.find((i) => asesor?.cod_cc == i.cod_cc) || null;
      empresa = empresas?.find((i) => asesor?.cod_emp == i.cod_empresa) || null;
    }

    if (cod_estado) {
      estado = estados?.find((i) => cod_estado == i.cod_estado) || null;
    }

    if (cod_oportunidad) {
      empresa = null;
      cenco = null;
      asesor = null;
    }

    setData({
      estado: estado ? { value: estado.cod_estado, label: estado.estado_desc } : null,
      empresa: empresa ? { value: empresa.cod_empresa.toString(), label: empresa.nombre_emp } : null,
      cenco: cenco ? { value: cenco.cod_cc.toString(), label: cenco.nombre_cc } : null,
      empleado: asesor ? { value: asesor.cod_usuario.toString(), label: `${asesor.nom_empleado} ${asesor.apellido_emp}` } : null,
    });
  }, [empleados, empresas, cencos, cod_cc, cod_usuario_prop, cod_estado]);

  const estados_ = useMemo(() => estados?.map((estado) => ({ ...estado, value: estado.cod_estado, label: estado.estado_desc })), [estados]);

  const empresas_ = useMemo(
    () =>
      empresas?.map((item) => ({
        ...item,
        value: item.cod_empresa.toString(),
        label: item.nombre_emp,
      })) || [],
    [empresas],
  );

  const cencos_ = useMemo(() => {
    if (data?.empresa) {
      return (
        cencos
          ?.filter((cenco) => cenco.cod_empresa_cc == data.empresa?.value)
          .map((item) => ({
            ...item,
            value: item.cod_cc.toString(),
            label: item.nombre_cc,
          })) || []
      );
    }
    return [];
  }, [data?.empresa, cencos]);

  const empleados_ = useMemo(() => {
    if (data?.cenco) {
      return (
        empleados
          ?.filter((empleado) => empleado.cod_cc == data.cenco?.value)
          .map((item) => ({
            ...item,
            value: item.cod_usuario.toString(),
            label: `${item.nom_empleado} ${item.apellido_emp}`,
          })) || []
      );
    }
    return [];
  }, [data?.cenco, empleados]);

  const datos_2 = useMemo(() => {
    return actividades
      ?.filter((actividad) => (data?.estado ? actividad.cod_estado == data.estado.value : true))
      .filter((actividad) => (data?.empresa ? actividad.cod_emp == data.empresa.value : true))
      .filter((actividad) => (data?.cenco ? actividad.cod_cc == data.cenco.value : true))
      .filter((actividad) => (data?.empleado ? actividad.cod_asesor == data.empleado.value : true))
      .filter((actividad) => (data?.fecha_inicio ? new Date(actividad.fecha_programada) >= new Date(data.fecha_inicio) : true))
      .filter((actividad) => (data?.fecha_fin ? new Date(actividad.fecha_programada) <= new Date(data.fecha_fin).setHours(23, 59, 59, 999) : true))
      .map((actividad) => {
        let o = {};
        Object.keys(actividad).forEach((d) => {
          o[d] = {
            color: d === "estado_desc" ? colores_estados[actividad.estado_desc] : undefined,
            bold: d === "estado_desc" ? true : undefined,
          };
        });
        const asesor = empleados?.find((e) => e.cod_usuario === actividad.cod_asesor);

        return {
          ...actividad,
          // cliente_desc: actividad.cod_cliente ? entidades.find((e) => e.entidad_id === actividad.cod_cliente)?.entidad_nombre : "",
          asesor: asesor ? `${asesor.nom_empleado} ${asesor.apellido_emp}` : "",
          fecha_programada_locale: new Date(actividad.fecha_programada).toLocaleString(),
          propiedadesDeTabla: o,
          accionesDeTabla,
        };
      });
  }, [data, actividades, entidades]);

  const inputs = useMemo(() => {
    return [
      inputsActivos.empresa
        ? {
            id: "empresa",
            label: "Empresa",
            val: data?.empresa || null,
            tipo: "select",
            readonly: cod_usuario_prop || cod_cc || !inputsActivos.empresa,
            options: empresas_,
          }
        : null,
      inputsActivos.empresa && inputsActivos.cenco
        ? {
            id: "cenco",
            label: "Centro de Costo",
            val: data?.cenco || null,
            tipo: "select",
            readonly: cod_usuario_prop || cod_cc || !(inputsActivos.cenco && data?.empresa),
            options: cencos_,
          }
        : null,
      inputsActivos.empresa && inputsActivos.empresa && inputsActivos.empleado
        ? {
            id: "empleado",
            label: "Empleado",
            val: data?.empleado || null,
            tipo: "select",
            readonly: cod_usuario_prop || !(inputsActivos.empleado && data?.cenco),
            options: empleados_,
          }
        : null,
      inputsActivos.estado
        ? {
            id: "estado",
            label: "Estado",
            val: data?.estado || null,
            tipo: "select",
            readonly: cod_estado || !inputsActivos.estado,
            options: estados_,
          }
        : null,
      inputsActivos.fecha
        ? {
            id: "fecha_inicio",
            label: "Fecha Inicio",
            val: data?.fecha_inicio || null,
            tipo: "date",
            readonly: !inputsActivos.fecha,
          }
        : null,
      inputsActivos.fecha
        ? {
            id: "fecha_fin",
            label: "Fecha Fin",
            val: data?.fecha_fin || null,
            tipo: "date",
            readonly: !inputsActivos.fecha,
          }
        : null,
    ].filter((item) => item !== null);
  }, [filtrosDefault, data, estados_, empresas_, cencos_, empleados_]);

  return actividades ? (
    <Grid sx={{ px: 2, m: 0 }}>
      {inputs.length > 0 ? (
        <FormularioComponent
          inputs={inputs}
          onInput={({ id, val }) => {
            if (id == "empresa") {
              setData((inp) => ({ ...inp, [id]: val, cenco: null, empleado: null }));
            } else if (id == "cenco") {
              setData((inp) => ({ ...inp, [id]: val, empleado: null }));
            } else {
              setData((inp) => ({ ...inp, [id]: val }));
            }
            setState(state + 1);
          }}
          botones={{
            agregar: { visible: false, onClick: null },
            cancelar: { visible: false, onClick: null },
            guardar: { visible: false, onClick: null },
            filtrar: { visible: false, onClick: null },
          }}
        />
      ) : null}
      <Grid>
        {/* <pre>{JSON.stringify(empleados_, null, 2)}</pre> */}
        <TablaActividades
          datos={datos_2}
          newBtn={false}
          catalogos={{ entidades, empleados: empleados_, estados }}
          asignacion={asignacion}
          updateData={updateData}
          setUpdateData={setUpdateData}
          vencidas={vencidas}
        />
      </Grid>
    </Grid>
  ) : (
    <Box sx={{ display: "flex", width: "90vw", height: "85vh", justifyContent: "center", alignItems: "center", color: "primary" }}>
      <CircularProgress />
    </Box>
  );
};

ListaActividades.propTypes = {
  filtros: PropTypes.shape({
    estado: PropTypes.bool,
    empresa: PropTypes.bool,
    cenco: PropTypes.bool, // Si cenco es true, entonces empresa debe ser true
    empleado: PropTypes.bool, // Si empleado es true, entonces cenco debe ser true
    fecha: PropTypes.bool,
  }),
  cod_cc: PropTypes.number,
  cod_usuario_prop: PropTypes.number,
  cod_oportunidad: PropTypes.number, // Tiene precedencia sobre cod_usuario_prop y cod_cc
  cod_estado: PropTypes.number,
  asignacion: PropTypes.bool,
  vencidas: PropTypes.bool,
};
