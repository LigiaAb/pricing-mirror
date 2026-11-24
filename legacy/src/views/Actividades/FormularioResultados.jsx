import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { Box, Grid, Icon, Typography } from "@mui/material";
import { api } from "../../api";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import useObtenerOpcionesAcciones from "../../hooks/useObtenerOpcionesAcciones";
import { FormularioPreferencias } from "../Entidad/FormularioPreferencias";
import FormularioCotizacion from "../Tarifas/Cotizaciones/FormularioCotizacion/FormularioCotizacion";
import useCatalogosCotizacion from "../Tarifas/Cotizaciones/GestionCotizacion/hooks/useCatalogosCotizacion";
import AcordeonComponent2 from "@/components/AcordeonComponent/AcordeonComponent2";
import { useFetchCentrosCosto, useFetchCiudades, useFetchConfiguracionActividad, useFetchEmpresas, useFetchEstados, useFetchIndustrias, useFetchMonedas, useFetchPaises, useFetchTemperamentos, useFetchTipos, useFetchTratamientos } from "../../hooks/Fetch/useFetchCatalog";
import { useFetchEmpleados } from "../../hooks/Fetch/useFetchConfiguracion";

export const FormularioResultado = (props) => {
  const { dataGet, setUpdateData, updateData, catalogos, actividadPadre, onCreate, ignorarLimite = false, resultadoCotizacion, setResultadoCotizacion } = props;
  const { entidades, contactos = [] } = catalogos;
  const { permisosArray, catalogoArray } = useObtenerOpcionesAcciones();
  const [data, setData] = useState(null);
  const [dataSolicitud, setDataSolicitud] = useState({
    entidad: null
  });

  const paises = useFetchPaises()
  const industrias = useFetchIndustrias()
  const tipos = useFetchTipos()
  const empresas = useFetchEmpresas()
  const cencos = useFetchCentrosCosto()
  const empleados = useFetchEmpleados()

  const [errorFecha, setErrorFecha] = useState(false);
  const [errorInputs, setErrorInputs] = useState(false);
  const [tiposConf, setTiposConf] = useState([]);
  const [fechaLimite, setFechaLimite] = useState(new Date("1900-01-01"));
  const [listaError, setListaError] = useState([]);
  const [accordion, setAccoridion] = useState(false);

  const { isLoading: isLoadingCatalogosCotizacions, ...catalogos_cotizacion } = useCatalogosCotizacion({});

  useEffect(() => {
    if (dataGet) {
      setData({
        empresa: null,
        cenco: null,
        asesor_responsable: null,
        tipo: dataGet.tipo,
        fecha_seguimiento: dataGet.fecha_seguimiento,
        asunto: dataGet.asunto,
        descripcion: dataGet.resultado_desc,
        referencia: null,
        reason_code: dataGet.reason_code,

      });
    } else {
      const asesor = empleados.data.find((emp) => emp.cod_usuario == actividadPadre.cod_asesor);
      setData({
        empresa: {
          value: actividadPadre.cod_emp,
          label: empresas?.data.find((emp) => emp.cod_empresa == actividadPadre.cod_emp)?.nombre_emp,
        },
        cenco: {
          value: actividadPadre.cod_cc,
          label: cencos.data.find((cc) => cc.cod_cc == actividadPadre.cod_cc)?.nombre_cc,
        },
        asesor_responsable: asesor
          ? {
              value: actividadPadre.cod_asesor,
              label: `${asesor.nom_empleado} ${asesor.apellido_emp}`,
            }
          : null,
        tipo: null,
        fecha_seguimiento: null,
        asunto: "",
        descripcion: "",
        referencia: null,
        reason_code: null,
      });
    }
  }, []);

  useEffect(() => {
    setData((data) => ({
      ...data,
      no_file: 0,
      pais: { label: "", value: -1 },
      fecha_seguimiento: null,
    }));
  }, [data?.tipo]);

  useEffect(() => {
    const fetchData = async () => {
      if (actividadPadre?.cod_cc) {
        await api
          .get("api/appweb/lista-configuracion-actividad", {
            params: {
              cod_cc: actividadPadre?.cod_cc,
              cod_estado: 1,
            },
          })
          .then(({ data }) => {
            setTiposConf(data.data);
          })
          .catch((e) => console.error(e));
      }
    };
    fetchData().catch(console.error);
  }, [actividadPadre]);

  useEffect(() => {
    let active = true
    if(!!dataSolicitud.entidad){
      load()
    }
    return () => { active = false }

    async function load() {
      console.log(dataSolicitud.entidad)
      // const res = await api
      //   .post("api/appweb/recuperar-datos-entidad", {
      //    cod_tipo: dataSolicitud.entidad.cod_tipo, entidad_id: 
      //   })
      //   .then(({ data }) => {
      //     const convertKeysToLowerCase = (obj) => {
      //       if (Array.isArray(obj)) {
      //         return obj.map((v) => convertKeysToLowerCase(v));
      //       } else if (obj !== null && obj.constructor === Object) {
      //         return Object.keys(obj).reduce((acc, key) => {
      //           acc[key.toLowerCase()] = convertKeysToLowerCase(obj[key]);
      //           return acc;
      //         }, {});
      //       }
      //       return obj;
      //     };
  
      //     const eliminarDuplicadosById = (arr, id) => {
      //       return arr.filter((item, index) => arr.findIndex((i) => i[id] === item[id]) === index);
      //     };
  
      //     return eliminarDuplicadosById(convertKeysToLowerCase(data.data.data), "entidad_id");
      //   })
      //   .catch((e) => {
      //     console.error(e);
      //     return [];
      //   });



      
      if (!active) { return }
      // setResult(res)
    }
  }, [dataSolicitud])

   const groupItems = (list, key) => {
    const uniqueItems = new Map();
    list.forEach((item) => {
      uniqueItems.set(item[key], item);
    });
    return Array.from(uniqueItems.values()) || [];
  };

  const tipos_ = useMemo(() => {
    if (actividadPadre?.cod_tipo == 65) {
      return [
        { value: 65, cod_tipo_actividad: 65, label: "SEGUIMIENTO COTIZACION", nom_tipo_actividad: "SEGUIMIENTO COTIZACION", dias_creacion: 999, solo_resultado: false, },
        { value: 67, cod_tipo_actividad: 67, label: "COTIZACION CONFIRMADA", nom_tipo_actividad: "COTIZACION CONFIRMADA", dias_creacion: 999, solo_resultado: true },
        { value: 68, cod_tipo_actividad: 68, label: "COTIZACION RECHAZADA", nom_tipo_actividad: "COTIZACION RECHAZADA", dias_creacion: 999, solo_resultado: true },
        { value: 289, cod_tipo_actividad: 289, label: "CERRADO POR OTRA FIGURA", nom_tipo_actividad: "COTIZACION RECHAZADA", dias_creacion: 999, solo_resultado: true },
      ];
    }

    return tiposConf?.map((tipo) => ({
      ...tipo,
      value: tipo.cod_tipo_actividad,
      label: tipo.nom_tipo_actividad,
    }));
  }, [data?.cenco, tiposConf]);

  const empresas_ = useMemo(
    () =>
      empresas?.data.map((item) => ({
        ...item,
        value: item.cod_empresa.toString(),
        label: item.nombre_emp,
      })),
    [empresas?.data]
  );

  const cencos_ = useMemo(() => {
    if (data?.empresa) {
      return cencos.data
        .filter((cenco) => cenco.cod_empresa_cc == data.empresa.value)
        .map((item) => ({
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
          .filter((empleado) => empleado.cod_cc == data.cenco.value)
          .map((item) => ({
            ...item,
            value: item.cod_usuario.toString(),
            label: `${item.nom_empleado} ${item.apellido_emp}`,
          })),
        "cod_empleado"
      );
    }
    return [];
  }, [data?.cenco, empleados.data]);

  const reason_codes = useMemo(
    () =>
      tipos.data
        ?.filter((tipo) => tipo.tipo_tabla == "REASON_CODE")
        .map((item) => ({
          ...item,
          value: item.cod_tipo.toString(),
          label: item.nom_tipo,
        })),
    [tipos.data]
  );


  const inputs = useMemo(() => {
    const asignar = permisosArray.find((opcion) => opcion.nom_opcion == "Resultados")?.acciones?.find((accion) => accion.nom_accion == "Asignar");
    return [
      {
        grupoId: "resultado",
        id: "empresa",
        label: "Empresa",
        val: data?.empresa || null,
        tipo: "select",
        size: 4,
        readonly: !asignar,
        options: empresas_,
        requerido: true,
      },
      {
         grupoId: "resultado",
        id: "cenco",
        label: "Centro de Costo",
        val: data?.cenco || null,
        tipo: "select",
        size: 4,
        readonly: !data?.empresa || !asignar,
        options: cencos_,
        requerido: true,
      },
      {
         grupoId: "resultado",
        id: "asesor_responsable",
        label: "Asesor Responsable",
        size: 4,
        val: data?.asesor_responsable || null,
        tipo: "select",
        options: empleados_,
        readonly: !data?.cenco || !asignar,
      },
      {
         grupoId: "resultado",
        id: "tipo",
        label: "Tipo de resultado",
        val: data?.tipo || null,
        tipo: "select",
        size: 6,
        options: tipos_,
        readonly: false,
      },
      data?.tipo && [68].includes(data?.tipo?.value)
        ? {
             grupoId: "resultado",
            tipo: "select",
            id: "reason_code",
            size: 6,
            val: data?.reason_code || null,
            label: "Reason Code",
            options: reason_codes,
            readonly: false,
          }
        : {
             grupoId: "resultado",
            tipo: "number",
            id: "referencia",
            size: 6,
            val: data?.referencia,
            label: "No. de File, CTS o Cotización",
            readonly: !(data?.tipo && [57, 58, 59, 60, 61, 62, 289].includes(data?.tipo?.value)),
          },
      {
         grupoId: "resultado",
        tipo: "datetime",
        id: "fecha_programada",
        label: "Fecha de Seguimiento",
        size: 6,
        val: data?.fecha_programada || null,
        readonly: !data?.tipo,
        min: fechaLimite,
      },
      {
        grupoId: "resultado",
        tipo: "textarea",
        id: "descripcion",
        size: 6,
        val: data?.descripcion,
        label: "Descripción del resultado",
        readonly: !data?.tipo || data?.tipo?.value == 67 || data?.tipo?.value == 68 || data?.tipo?.value == 289,
      },

    ].filter((input) => input != null);
  }, [data, fechaLimite, tipos_]);

  const validateForm = (data) => {
    let errores = [];
    if (!data.tipo) errores.push("Tipo de resultado");
    // if (!data.fecha_programada) errores.push("Fecha de seguimiento");
    if (!data.empresa) errores.push("Empresa");
    if (!data.cenco) errores.push("Centro de costo");
    return errores;
  };

  const handleSubmitPost = async () => {
    const errores = validateForm(data);
    if (errores.length == 0) {
      // if (!evalFechaLimite(data?.tipo, data?.fecha_programada)) {
      //   setErrorFecha(true);
      //   return;
      // }
      onCreate({
        ...actividadPadre,
        ...data,
        cod_emp: data?.empresa.value,
        cod_cc: data?.cenco.value,
        cod_asesor: data?.asesor_responsable?.value,
        asunto: `${data?.tipo.nom_tipo_actividad} ${new Date(data.fecha_programada).toLocaleDateString()} - ${actividadPadre.nombre_cliente}`,
      });
      setData((data) => ({
        ...data,
        tipo: null,
        fecha_programada: null,
        asunto: "",
        descripcion: "",
        referencia: "",
        reason_code: null,
      }));

      if ([67, 68].includes(data?.tipo.cod_tipo_actividad)) {
        setResultadoCotizacion(true);
      }
    } else {
      setListaError(errores);
      setErrorInputs(true);
    }
  };

  const handleCreacionCotizacion = async () => {
      setData((data) => ({
        ...data,
        fecha_programada: !!data.fecha_programada ? data.fecha_programada : new Date(),
        asunto: data.asunto || `${data?.tipo.nom_tipo_actividad} ${new Date().toLocaleDateString()} - ${actividadPadre.nombre_cliente}`,
        descripcion: data.descripcion || `${data?.tipo.nom_tipo_actividad} ${new Date().toLocaleDateString()} - ${actividadPadre.nombre_cliente}`,
      }));
      await handleSubmitPost()
  };

  const evalFechaLimite = (configuracion, evalFecha) => {
    if (ignorarLimite) return true;
    console.log(configuracion, evalFecha)
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

  return (
    <Grid sx={{ p: 1, m: 0 }}>
      <Grid sx={{pb: data?.tipo?.label !== "SOLICITAR COTIZACION" ? 0 : 3 }}>
        <AcordeonComponent2 expandido={accordion} expandir={() => setAccoridion(!accordion)} 
          titulo={
            <Grid container width="100%" p={1}>
              <Grid size="grow"><Typography variant="h5">Visiting Report </Typography></Grid>
              <Grid size="auto" pr={1}>
                <Typography className={accordion ? "c-arriba-simple" : "c-abajo-simple"} fontSize={16}/>
              </Grid>
            </Grid>
          }
        >
          <FormularioPreferencias entidad_id={actividadPadre.cod_cliente} catalogos={{paises: paises.data, industrias: industrias.data, tipos: tipos.data}}/> 
        </AcordeonComponent2>
        <Box pt={1}></Box>
        <Typography variant="h4" sx={{ mb: 1}}>
          Agregar Resultados
        </Typography>
        <FormularioComponent
          data={{inputs}}
          onInput={({ id, val }) => setData((inp) => ({ ...inp, [id]: val }))}
          botones={{
            agregar: { visible: data?.tipo?.label !== "SOLICITAR COTIZACION", onClick: handleSubmitPost, readonly: resultadoCotizacion },
            cancelar: { visible: false, onClick: null },
            guardar: { visible: false, onClick: null },
            filtrar: { visible: false, onClick: null },
          }}
        />
      </Grid>

      {
        data?.tipo?.label === "SOLICITAR COTIZACION" ?
        <>
          
          <Typography variant="h4" sx={{ mb: 1 }}>
            Solicitar Nueva Cotización
          </Typography>
          <FormularioCotizacion
            tipoFormulario="ingreso"
            defaultValues={{ cod_estado: 20, entidad_id: actividadPadre.cod_cliente || undefined }}
             onCotizacionCreada={handleCreacionCotizacion}
            // onCotizacionEditada={handleEdicionCotizacion}
            catalogos={catalogos_cotizacion}
            // asignarActividad
          />
        </>
        : null
      }
      {/* <pre>{JSON.stringify(data, null, 2)}</pre> */}
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

      <ActionAlertComponent
        aceptar={() => {
          setErrorInputs(false);
        }}
        activarCanecelar={false}
        openDialog={errorInputs}
        tipo="error"
        handleClose={() => {}}
        content={
          <Box>
            Faltan los siguientes parametros para poder crear un resultado:
            {listaError.map((value) => (
              <Typography>- {value}</Typography>
            ))}
          </Box>
        }
      />
    </Grid>
  );
};

FormularioResultado.propTypes = {
  dataGet: PropTypes.object,
  setUpdateData: PropTypes.func,
  updateData: PropTypes.number,
  readOnlyInput: PropTypes.bool,
  listaRes: PropTypes.array,
  setListaRes: PropTypes.func,
  catalogos: PropTypes.object,
};
