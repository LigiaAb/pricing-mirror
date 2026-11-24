// update comment
import React, { useState, useEffect, useMemo } from "react";
import FormularioComponent from "@/components/Formulario/FormularioComponent";
import PropTypes from "prop-types";
import { Grid, Icon, Box, Typography, Fab, Drawer, Button } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/api";
import { encryptId, decryptId } from "@/api/encryptDecrypt";
import { useSelector, useDispatch } from "react-redux";
import BandaAlertaComponent from "@/components/Alertas/BandaAlertaComponent";
import useObtenerOpcionesAcciones from "@/hooks/useObtenerOpcionesAcciones";
import { useFetchAllEntidadesSimple, useFetchAllEntidadesSimplePaginada } from "@/hooks/Fetch/useFetchEntidades";
import {
  useFetchCentrosCosto,
  useFetchEmpresas,
  useFetchEstados,
  useFetchTipos,
} from "@/hooks/Fetch/useFetchCatalog";
import { useFetchEmpleados } from "@/hooks/Fetch/useFetchConfiguracion";
import CODS_TIPOS_ENTIDAD, { NOMBRES_TIPOS_ENTIDAD } from "@/constants/tiposEntidades";
import useCatalogosCotizacion from "@/views/Tarifas/Cotizaciones/hooks/useCatalogosCotizacion";

export const FormularioAsignacionCTS = (props) => {
  const { dataGet, readOnlyInput = false, catalogos, onCreate = () => {}, ignorarLimite = false, updateData, setUpdateData, actualizacion = false } = props;

  // const fetchClientes = useFetchAllEntidadesSimplePaginada([NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.CLIENTE]], { tipo_entidad: NOMBRES_TIPOS_ENTIDAD[CODS_TIPOS_ENTIDAD.CLIENTE] }, {}, undefined, 1);

  const { fetchOptionsClientes, catalogos: catalogosH } = useCatalogosCotizacion();

  const { solo_clientes: clientes } = catalogosH;

  const estados = useFetchEstados();
  const tipos = useFetchTipos();
  const empresas = useFetchEmpresas();
  const cencos = useFetchCentrosCosto();
  const empleados = useFetchEmpleados();

  const [data, setData] = useState({
    especial: false,
  });
  const [fechaLimite, setFechaLimite] = useState(new Date("1900-01-01"));
  const [state, setState] = useState(0);
  const [errorFecha, setErrorFecha] = useState(false);
  const [errorBand, setErrorBand] = useState("");


  useEffect(() => {
    if(!!dataGet){
      setData({
        asesor_responsable: { label: `${dataGet.nombre_completo}`, value: dataGet.cod_usuario},
        cenco: { label: `${dataGet.cencod_nombre}`, value: dataGet.cod_cc},
        cliente: { label: `${dataGet.nombre_cliente}`, value: dataGet.entidad_id, entidad_id: dataGet.entidad_id, entidad_nombre: `${dataGet.nombre_cliente}`},
        empresa: { label: `${dataGet.empresa_nombre}`, value: dataGet.cod_empresa},
        estado: { label: `${dataGet.estado_desc}`, value: dataGet.cod_estado},
        fecha_creacion: !!dataGet.fecha_creacion ? new Date(dataGet.fecha_creacion) : null,
        fecha_fin: !!dataGet.fecha_fin ? new Date(dataGet.fecha_fin) : null ,
        fecha_inicio: !!dataGet.fecha_inicio ? new Date(dataGet.fecha_inicio) : null ,
        tipo: { label: `${dataGet.tipo_embarque_desc}`, value: dataGet.cod_tipo_embarque},
        especial: !!dataGet.especial,
      })
    } else {
      setData({
        especial: false,
      })
    }
  }, [dataGet]);

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
      tipos.data
        ?.filter((tipo) => tipo.tipo_tabla == "TRANSPORTE")
        ?.map((tipo) => ({
          ...tipo,
          value: tipo.cod_tipo,
          label: tipo.nom_tipo,
        })),
    [tipos.data],
  );

  const estados_ = useMemo(
    () => 
      estados.data
        ?.filter((estado) => estado.nom_tipo == "GLOBAL")
        ?.map((estado) => ({ 
          ...estado, value: estado.cod_estado, label: estado.estado_desc 
        })), 
    [estados.data]
  );

  const inputs = useMemo(
    () => [
      {
        id: "empresa",
        label: "Empresa",
        val: data?.empresa || null,
        tipo: "select",
        size: 4,
        readonly: false,
        options: empresas_,
        requerido: true,
      },
      {
        id: "cenco",
        label: "Centro de Costo",
        val: data?.cenco || null,
        tipo: "select",
        size: 4,
        readonly:  actualizacion ? true : !data?.empresa,
        options: cencos_,
        requerido: true,
      },
      {
        id: "asesor_responsable",
        label: "Empleado",
        val: !!data.especial ? null : (data?.asesor_responsable || null),
        tipo: "select",
        size: 4,
        options: empleados_,
        readonly: actualizacion ? true : !data?.cenco || !!data.especial,
      },
      {
        id: "cliente",
        tipo: "select",
        label: "Cliente",
        options: clientes,
        val: data?.cliente,
        fetchOptions: fetchOptionsClientes,
        valueOption: "entidad_id",
        labelOption: "entidad_nombre",
        size: 6,
        requerido: true,
        readonly: false,
      },
      {
        id: "tipo",
        label: "Transporte",
        val: data?.tipo || null,
        tipo: "select",
        size: 6,
        options: tipos_,
        readonly: actualizacion ? true : readOnlyInput,
        requerido: true,
      },
      {
        tipo: "datetime",
        id: "fecha_inicio",
        label: "Fecha Inicio",
        size: 6,
        val: data?.fecha_inicio || null,
        readonly: actualizacion ? true : readOnlyInput,
        min: fechaLimite,
        requerido: true,
      },
      {
        tipo: "datetime",
        id: "fecha_fin",
        label: "Fecha Final",
        size: 6,
        val: data?.fecha_fin || null,
        readonly: actualizacion ? true : readOnlyInput,
        min: fechaLimite,
        requerido: true,
      },
      {
        tipo: "datetime",
        id: "fecha_creacion",
        label: "Fecha Creación",
        size: 6,
        val: data?.fecha_creacion || null,
        readonly: true,
        min: fechaLimite,
        requerido: false,
      },
      {
        tipo: "select",
        id: "estado",
        label: "Estados",
        size: 6,
        val: data?.estado || null,
        readonly: actualizacion ? true : readOnlyInput,
        options: estados_,
        requerido: true,
      },
      {
        tipo: "toggle",
        id: "especial",
        label: "¿Es una asignación vacia?",
        val: data?.especial
      },
    ],
    [data, tipos_, empresas_, cencos_, data?.cliente, fechaLimite, fetchOptionsClientes],
  );


  const handleSubmitPost = async () => {
    const {cliente, asesor_responsable, cenco, empresa, estado, fecha_fin, fecha_inicio, tipo, especial} = data

    const postData = {
      "entidad_id": cliente.value,
      "cod_empresa": empresa.value,
      "cod_cc": cenco.value,
      "cod_usuario": asesor_responsable.value,
      "cod_tipo_embarque": tipo.value,
      "fecha_inicio": fecha_inicio || null, 
      "fecha_fin": fecha_fin || null, 
      "cod_estado": estado.value || null, 
      "especial": especial || false
    }

    await api
      .post("api/appweb/insertar-asignacion-cliente-cts", postData)
      .then(({ data }) => onCreate(data.data))
      .catch((e) => console.error(e));
  };

  const handleSubmitUpdate = async () => {
    const {cliente, asesor_responsable, cenco, empresa, estado, fecha_fin, fecha_inicio, tipo, especial} = data

    const postData = {
      "cod_asignacion_cts": dataGet.cod_asignacion_cts,
      "entidad_id": cliente.value,
      "cod_empresa": empresa.value,
      "cod_cc": cenco.value,
      "cod_usuario": asesor_responsable.value,
      "cod_tipo_embarque": tipo.value,
      "fecha_inicio": fecha_inicio || null, 
      "fecha_fin": fecha_fin || null, 
      "cod_estado": estado.value || null, 
      "especial": especial || false
    }

    await api
      .post("api/appweb/actualizar-asignacion-cliente-cts", postData)
      .then(({ data }) => onCreate(data.data))
      .catch((e) => console.error(e));
  };

  return (
    <Grid sx={{ p: 1, m: 0 }} width={"100%"}>
      <Box mt={3}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: 'text.primary' }}>
          { 
            !!dataGet ? 
              `Asignación: ${dataGet.nombre_cliente} - ${dataGet.cencod_nombre} - ${dataGet.tipo_embarque_desc}`
              : `Nueva Asignación`
          }
        </Typography>
      </Box>
      {errorBand != "" && <BandaAlertaComponent tipo="error">{errorBand}</BandaAlertaComponent>}
      {
        !!data?.especial && 
        <BandaAlertaComponent tipo="info">
          En una asignación vacia, el CTS será asignado al pricing que esta aprobando la cotización, el cual podrá luego asignar el CTS a un operador.
        </BandaAlertaComponent>
      }
      
      <Grid display="flex" flexDirection="column">
        <FormularioComponent
          inputs={inputs}
          onInput={({ id, val }) => {
            setData((inp) => ({ ...inp, [id]: val }));
            setState(state + 1);
          }}
          botones={{
            agregar: { visible: !dataGet, onClick: handleSubmitPost },
            cancelar: { visible: false, onClick: null },
            guardar: { visible: !!dataGet, onClick: handleSubmitUpdate },
            filtrar: { visible: false, onClick: null },
          }}
        />
      </Grid>
    </Grid>
  );
};

FormularioAsignacionCTS.propTypes = {
  dataGet: PropTypes.object,
  readOnlyInput: PropTypes.bool,
  catalogos: PropTypes.object, // { entidades, empresas, estados, paises, ciudades, industrias, tipos, cencos, empleados, tratamientos, temperamentos }
  updateData: PropTypes.func,
  setUpdateData: PropTypes.func,
};
