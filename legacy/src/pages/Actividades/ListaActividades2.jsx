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
import { colores_actividad, colores_estados } from "../../theme/colores_actividad";
import { colors } from "../../theme/colors";
import generarExcel from "../../utils/GeneradorExcel/_generador_excel_v2";
import moment from "moment";
import { transformDatos } from "../../utils/GeneradorExcel/_data_format";
import { tablas } from "./headersReporteActividades";
import LoaderComponent from "../../components/Loader/LoaderComponent";
import { useObtenerPermisosDeMenuActual } from "../../hooks/useObtenerOpcionesAcciones";

export const ListaActividades2 = (props) => {
  const dispatch = useDispatch();

  const {
    filtros,
    cod_empresa,
    cod_cc,
    cod_usuario,
    cod_estado,
    cod_oportunidad,
    vencidas = false,
    asignacion = false,
    proximas = false,
    newBtn = false,
    excel = false,
    reporte = false,
    historico = false,
  } = props;

  const { currentCentroCosto, currentEmpresa } = useSelector((state) => state.menu);
  const { colors } = useSelector((state) => state.theme);

  const opciones = useObtenerPermisosDeMenuActual();

  const permisoPaisCC = useMemo(() => {
    const primerGrupo = Object.values(opciones || {})[0] || {};
    const primeraOpcion = Object.values(primerGrupo?.opciones || {})[0] || {};
    const acciones = primeraOpcion?.acciones || {};

    return "11" in acciones;
  }, [opciones]);

  const filtrosDefault = {
    estado: true,
    empresa: false,
    cenco: false,
    empleado: false,
    fecha: false,
    nom_tipo: true,
  };

  const inputsActivos = { ...filtrosDefault, ...filtros };

  const [data, setData] = useState({
    estado: null,
    empresa: null,
    cenco: null,
    empleado: null,
    fecha_inicio: null,
    fecha_fin: null,
    nom_tipo: [],
  });

  const [state, setState] = useState(0);
  const [actividades, setActividades] = useState([]);
  const [estados, setEstados] = useState();
  const [empresas, setEmpresas] = useState();
  const [cencos, setCencos] = useState();
  const [entidades, setEntidades] = useState([]);
  const [empleados, setEmpleados] = useState();
  const [updateData, setUpdateData] = useState(0);
  const [mostrar, setMostrar] = useState(false);
  const [accionesDeTabla, setAccionesDeTabla] = useState({
    add: false,
    view: reporte ? false : true,
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

  const header_reporte = useMemo(() => {
    let json = { "Generado el: ": moment().format("DD/MM/YYYY HH:mm:SS") };

    if (data?.empresa) json["Empresa: "] = data?.empresa?.label;
    if (data?.cenco) json["Centro de Costo: "] = data?.cenco?.label;
    if (data?.empleado) json["Empleado: "] = data?.empleado?.label;
    if (data?.estado) json["Estado: "] = data?.estado?.label;
    if (data?.fecha_inicio) json["Fecha Inicio: "] = data?.fecha_inicio;
    if (data?.fecha_fin) json["Fecha Fin: "] = data?.fecha_fin;
    if (data?.nom_tipo) json["Tipo de Actividad: "] = data?.nom_tipo.map((i) => i.label).join(", ");
    if (data?.empleado && !data?.["Empleado: "]) json["Empleado: "] = data?.empleado.label;

    return json;
  }, [data]);

  const actualizarActividades = useCallback(async (empleado, empresa, cenco) => {
    setMostrar(true);
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
        .get("api/appweb/lista-actividades-vencidas", {
          params: {
            cod_asesor: empleado ? empleado : cod_usuario,
            cod_cc: cenco ? cenco : cod_cc,
            cod_empresa: empresa ? empresa : cod_empresa,
          },
        })
        .then(({ data }) => setActividades(data.data || []))
        .catch((e) => console.error(e));
    } else if (proximas) {
      await api
        .get("api/appweb/lista-actividades-en-curso", {
          params: {
            cod_asesor: empleado ? empleado : cod_usuario,
            cod_cc: cenco ? cenco : cod_cc,
            cod_empresa: empresa ? empresa : cod_empresa,
          },
        })
        .then(({ data }) => setActividades(data.data || []))
        .catch((e) => console.error(e));
    } else if (asignacion) {
      await api
        .get("api/appweb/lista-actividades-sin-asignar", {
          params: {
            cod_cc: cenco ? cenco : cod_cc,
            cod_empresa: empresa ? empresa : cod_empresa,
          },
        })
        .then(({ data }) => setActividades(data.data || []))
        .catch((e) => console.error(e));
    } else if (reporte) {
      console.log(data);
      await api
        .get("api/appweb/lista-actividades2", {
          params: {
            cod_asesor: empleado ? empleado : cod_usuario,
            cod_cc: cenco ? cenco : cod_cc,
            cod_empresa: empresa ? empresa : cod_empresa,
          },
        })
        .then(({ data }) => {
          console.log(data.data);
          setActividades(data.data || []);
        })
        .catch((e) => console.error(e));
    } else {
      await api
        .get("api/appweb/lista-actividades", {
          params: {
            cod_asesor: empleado ? empleado : cod_usuario,
            cod_empresa: empresa ? empresa : cod_empresa,
            cod_cc: cenco ? cenco : cod_cc,
            cod_estado: cod_estado,
          },
        })
        .then(({ data }) => setActividades(data.data || []))
        .catch((e) => console.error(e));
    }
  }, []);
  const obtenerActividades = useCallback(async () => {
    if (reporte) return;
    setMostrar(true);
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
        .get("api/appweb/lista-actividades-vencidas", {
          params: {
            // cod_asesor: cod_usuario,
            cod_asesor: data.empleado ? data.empleado.value : cod_usuario,
            cod_cc: cod_cc,
            cod_empresa: cod_empresa,
          },
        })
        .then(({ data }) => setActividades(data.data || []))
        .catch((e) => console.error(e));
    } else if (proximas) {
      await api
        .get("api/appweb/lista-actividades-en-curso", {
          params: {
            // cod_asesor: cod_usuario,
            cod_asesor: data.empleado ? data.empleado.value : cod_usuario,
            cod_cc: cod_cc,
            cod_empresa: cod_empresa,
          },
        })
        .then(({ data }) => setActividades(data.data || []))
        .catch((e) => console.error(e));
    } else if (asignacion) {
      await api
        .get("api/appweb/lista-actividades-sin-asignar", {
          params: {
            cod_cc: cod_cc,
            cod_empresa: cod_empresa,
          },
        })
        .then(({ data }) => setActividades(data.data || []))
        .catch((e) => console.error(e));
    } else if (reporte) {
      await api
        .get("api/appweb/lista-actividades2", {
          params: {
            // cod_asesor: cod_usuario,
            cod_asesor: data.empleado ? data.empleado.value : cod_usuario ? cod_usuario : undefined,
            cod_empresa: cod_empresa || undefined,
            cod_cc: cod_cc || undefined,
            cod_estado: cod_estado || undefined,
          },
        })
        .then(({ data }) => setActividades(data.data || []))
        .catch((e) => console.error(e));
    } else {
      await api
        .get("api/appweb/lista-actividades", {
          params: {
            // cod_asesor: cod_usuario,
            cod_asesor: data.empleado ? data.empleado.value : cod_usuario ? cod_usuario : undefined,
            cod_empresa: cod_empresa || undefined,
            cod_cc: cod_cc || undefined,
            cod_estado: cod_estado || undefined,
          },
        })
        .then(({ data }) => setActividades(data.data || []))
        .catch((e) => console.error(e));
    }
  }, []);
  const obtenerEstados = useCallback(async () => {
    await api
      .get("api/appweb/listaestados")
      .then((data) => setEstados(data?.data?.data?.filter((estado) => estado.nom_tipo === "ACTIVIDAD")))
      .catch((e) => console.error(e));
  }, []);
  const obtenerEmpresas = useCallback(async () => {
    await api
      .get("api/appweb/listaempresas")
      .then((data) => setEmpresas(data?.data?.data || []))
      .catch((e) => console.error(e));
  }, []);
  const obtenerCencos = useCallback(async () => {
    await api
      .get("api/appweb/listacentrocosto")
      .then((data) => setCencos(data?.data?.data || []))
      .catch((e) => console.error(e));
  }, []);
  const obtenerEmpleados = useCallback(async () => {
    await api
      .get("api/appweb/listaemp-usu-puesto")
      .then((data) => setEmpleados(data?.data?.data || []))
      .catch((e) => console.error(e));
  }, []);

  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerEmpleados(), obtenerCencos(), obtenerEmpresas(), obtenerEstados()]).then(() => dispatch(apagarCarga()));
  }, [obtenerEmpleados, obtenerEstados, obtenerEmpresas, updateData, dispatch]);

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
    const currentCodEmpresa = currentEmpresa?.cod_empresa;
    const currentCodCc = currentCentroCosto?.cod_cc;

    if (cod_oportunidad) return;

    if (cod_empresa) {
      empresa = empresas?.find((i) => cod_empresa == i.cod_empresa);
    } else if (currentCodEmpresa) {
      empresa = empresas?.find((i) => currentCodEmpresa == i.cod_empresa);
    }

    if (cod_cc) {
      cenco = cencos?.find((i) => cod_cc == i.cod_cc);
      empresa = cenco ? empresas?.find((i) => cenco.cod_empresa_cc == i.cod_empresa) : null;
    } else if (currentCodCc) {
      cenco = cencos?.find((i) => currentCodCc == i.cod_cc);
      empresa = currentCodEmpresa ? empresas?.find((i) => currentCodEmpresa == i.cod_empresa) : empresa;
    }

    if (cod_usuario) {
      asesor = empleados?.find((i) => cod_usuario == i.cod_usuario);
      cenco = asesor ? cencos?.find((i) => asesor.cod_cc == i.cod_cc) : null;
      empresa = asesor ? empresas?.find((i) => asesor.cod_emp == i.cod_empresa) : null;
    }

    if (cod_estado) {
      estado = estados?.find((i) => cod_estado == i.cod_estado) || null;
    }
    setData({
      estado: estado ? { value: estado.cod_estado, label: estado.estado_desc } : null,
      empresa: empresa ? { value: empresa.cod_empresa.toString(), label: empresa.nombre_emp } : null,
      cenco: cenco ? { value: cenco.cod_cc.toString(), label: cenco.nombre_cc } : null,
      empleado: asesor ? { value: asesor.cod_usuario.toString(), label: `${asesor.nom_empleado} ${asesor.apellido_emp}` } : null,
    });
  }, [cod_cc, cod_empresa, cod_estado, cod_oportunidad, cod_usuario, cencos, currentCentroCosto, currentEmpresa, empleados, empresas, estados]);

  // useEffect(() => {
  //   if(!reporte){
  //     actualizarActividades(data.empleado?.value, data.empresa?.value, data.cenco?.value).then(() => setMostrar(false));
  //   }
  // }, [data.empleado, data.empresa, data.cenco]);

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
      ).reduce((arr, item) => {
        if (!arr.some((i) => i.cod_usuario === item.cod_usuario)) {
          arr.push(item);
        }
        return arr;
      }, []);
    }
    return [];
  }, [data?.cenco, empleados]);

  const datos_filtrados = useMemo(() => {
    let datos = actividades;

    if (data?.empresa) {
      datos = datos.filter((actividad) => actividad.cod_emp == data.empresa.value);
    }
    if (data?.cenco) {
      datos = datos.filter((actividad) => actividad.cod_cc == data.cenco.value);
    }
    if (data?.empleado) {
      datos = datos.filter((actividad) => actividad.cod_asesor == data.empleado.value);
    }
    if (data?.fecha_inicio) {
      datos = datos.filter((actividad) => new Date(actividad.fecha_programada) >= new Date(data.fecha_inicio));
    }
    if (data?.fecha_fin) {
      datos = datos.filter((actividad) => new Date(actividad.fecha_programada) <= new Date(data.fecha_fin).setHours(23, 59, 59, 999));
    }
    if (data?.estado) {
      datos = datos.filter((actividad) => actividad.cod_estado == data.estado.value);
    }
    if (data?.nom_tipo) {
      datos = datos.filter((actividad) => data.nom_tipo.map((i) => i.label).includes(actividad.nom_tipo));
    }

    return datos.map((actividad) => {
      let o = {};
      Object.keys(actividad).forEach((d) => {
        o[d] = {
          color: d === "estado_desc" ? colores_estados[actividad.estado_desc] : undefined,
          bold: d === "estado_desc" ? true : undefined,
        };
      });
      const asesor = empleados?.find((e) => e.cod_usuario === actividad.cod_asesor);
      const contacto = Object.fromEntries(Object.entries(actividad.contacto ? JSON.parse(actividad.contacto)[0] : {}).map(([k, v]) => [`contacto_${k.toLowerCase()}`, v]));
      const resultado = Object.fromEntries(Object.entries(actividad.resultado ? JSON.parse(actividad.resultado)[0] : {}).map(([k, v]) => [`resultado_${k.toLowerCase()}`, v]));
      return {
        ...actividad,
        ...contacto,
        ...resultado,
        resultado_cod_actividad: resultado ? (resultado.resultado_cod_actividad ? resultado.resultado_cod_actividad : resultado.resultado_nom_tipo ? "Resultado  final" : "") : "",
        cliente_desc: actividad.nombre_cliente,
        asesor: asesor ? `${asesor.nom_empleado} ${asesor.apellido_emp}` : "",
        fecha_creada_locale: moment(actividad.fecha_creada).format("DD/MM/YYYY"),
        fecha_programada_locale: moment(actividad.fecha_programada).format("DD/MM/YYYY"),
        resultado_fecha_programada_locale: resultado.resultado_fecha_programada ? moment(resultado.resultado_fecha_programada).format("DD/MM/YYYY") : "",
        propiedadesDeTabla: o,
        accionesDeTabla,
      };
    });
  }, [actividades]);

  const inputs = useMemo(() => {
    return [
      inputsActivos.empresa
        ? {
            id: "empresa",
            label: "Empresa",
            val: data?.empresa || null,
            tipo: "select",
            readonly: permisoPaisCC === undefined ? !inputsActivos.empresa : permisoPaisCC,
            options: empresas_,
          }
        : null,
      inputsActivos.empresa && inputsActivos.cenco
        ? {
            id: "cenco",
            label: "Centro de Costo",
            val: data?.cenco || null,
            tipo: "select",
            readonly: permisoPaisCC === undefined ? !inputsActivos.cenco || !data?.empresa : permisoPaisCC,
            options: cencos_,
          }
        : null,
      inputsActivos.empleado
        ? {
            id: "empleado",
            label: "Empleado",
            val: data?.empleado || null,
            tipo: "select",
            readonly: !inputsActivos.empleado || !data?.cenco,
            options: empleados_,
          }
        : null,
      inputsActivos.estado
        ? {
            id: "estado",
            label: "Estado",
            val: data?.estado || null,
            tipo: "select",
            readonly: !inputsActivos.estado,
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
      reporte && inputsActivos.nom_tipo
        ? {
            id: "nom_tipo",
            label: "Tipo",
            val: data?.nom_tipo || [],
            tipo: "select",
            multiple: true,
            options: Object.entries(colores_actividad).map(([key, value]) => ({ label: key, value: value, activo: true })),
            readonly: !inputsActivos.nom_tipo,
          }
        : null,
    ].filter((item) => item !== null);
  }, [data, estados_, empresas_, cencos_, empleados_, inputsActivos, reporte]);

  return (
    <Box sx={{ m: 0, p: 0 }}>
      {actividades ? (
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
                filtrar: { visible: true, onClick: () => actualizarActividades(data.empleado?.value, data.empresa?.value, data.cenco?.value).then(() => setMostrar(false)) },
                excel: {
                  visible: excel,
                  readonly: datos_filtrados.length == 0,
                  onClick: () => {
                    generarExcel({
                      descargar: true,
                      propiedades: {
                        title: !historico
                          ? `${tablas[1].nombre} - ERPWEB - ${moment().format("YYYY_MM_DD_HH_mm_SS")}.xlsx`
                          : `${tablas[0].nombre} - ERPWEB - ${moment().format("YYYY_MM_DD_HH_mm_SS")}.xlsx`,
                        subject: "Reporte en excel",
                        author: "ERP-web",
                        creator: "ERP-web",
                      },
                      titulo: `Reporte de actividades`,
                      horizontal: true,
                      bottom: true,
                      hojas: [
                        {
                          nombre: !historico ? tablas[1].nombre : tablas[0].nombre,
                          header: header_reporte,
                          props: !historico ? tablas[1].props : tablas[0].props,
                          datos: transformDatos(!historico ? tablas[1].headers : tablas[0].headers, datos_filtrados, ["cod_actividad", "resultado_cod_actividad"]),
                        },
                      ],
                    });
                  },
                  texto: "",
                  fromat: { color: "excel", borderColor: "excel.main" },
                  ...{ color: "excel", borderColor: colors?.excel?.main },
                },
              }}
            />
          ) : null}
          <Grid>
            <TablaActividades
              datos={datos_filtrados}
              newBtn={newBtn}
              catalogos={{ empleados: empleados_, estados }}
              asignacion={asignacion}
              updateData={updateData}
              setUpdateData={setUpdateData}
              vencidas={vencidas}
              proximas={proximas}
              reporte={reporte}
              historico={historico}
            />
          </Grid>
        </Grid>
      ) : (
        <Box sx={{ display: "flex", width: "90vw", height: "85vh", justifyContent: "center", alignItems: "center", color: "primary" }}>
          <CircularProgress />
        </Box>
      )}
      <LoaderComponent open={mostrar} />
    </Box>
  );
};

ListaActividades2.propTypes = {
  filtros: PropTypes.shape({
    estado: PropTypes.bool,
    empresa: PropTypes.bool,
    cenco: PropTypes.bool,
    empleado: PropTypes.bool,
    fecha: PropTypes.bool,
  }),
  cod_cc: PropTypes.number,
  cod_empresa: PropTypes.number,
  cod_usuario: PropTypes.number,
  cod_usuario_prop: PropTypes.number,
  cod_oportunidad: PropTypes.number, // Tiene precedencia sobre cod_usuario_prop y cod_cc
  cod_estado: PropTypes.number,
  asignacion: PropTypes.bool,
  vencidas: PropTypes.bool,
  newBtn: PropTypes.bool,
  proximas: PropTypes.bool,
  reporte: PropTypes.bool,
  excel: PropTypes.bool,
  historico: PropTypes.bool,
};
