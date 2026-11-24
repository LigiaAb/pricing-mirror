import React, { useState, useEffect, useMemo } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { Grid, Icon, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { encryptId, decryptId } from "../../api/encryptDecrypt";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import BandaAlertaComponent from "../../components/Alertas/BandaAlertaComponent";

export const FormularioCampanas = (props) => {
  const navigate = useNavigate();

  const { nombre, cod_usuario, json } = useSelector((state) => state.auth);

  const { dataGet, setUpdateData, updateData, readOnlyInput = false, catalogos } = props;
  const { entidades, empresas = [], paises = [], tipos = [], cencos = [] } = catalogos;
  const [data, setData] = useState(null);
  const [state, setState] = useState(0);
  const [tiposConf, setTiposConf] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const current_cenco = JSON.parse(decryptId(localStorage.getItem("currentCentroCosto")));
  const current_empresa = JSON.parse(decryptId(localStorage.getItem("currentEmpresa")));

  useEffect(() => {
    const fetchData = async () => {
      if (data?.cenco) {
        await api
          .get("api/appweb/lista-configuracion-actividad", {
            params: {
              cod_cc: data?.cenco.value,
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
  }, [data?.cenco]);

  const tipos_ = useMemo(
    () =>
      tipos
        ?.filter((tipo) => tipo.tipo_tabla == "ENTIDAD")
        .map((item) => ({
          ...item,
          value: item.cod_tipo,
          label: item.nom_tipo,
        })),
    [tipos]
  );

  const tipos_config_ = useMemo(
    () =>
      tiposConf
        ?.filter((tipo) => !tipo.solo_resultado)
        ?.map((tipo) => ({
          ...tipo,
          value: tipo.cod_tipo_actividad,
          label: tipo.nom_tipo_actividad,
        })),
    [data?.cenco, tiposConf]
  );

  const tipos_asignacion = useMemo(
    () =>
      tipos
        ?.filter((tipo) => tipo.tipo_tabla == "ASIGNACION_ENTIDAD")
        .map((item) => ({
          ...item,
          value: item.cod_tipo,
          label: item.nom_tipo,
        })),
    [tipos]
  );

  const tipos_transporte_ = useMemo(
    () =>
      tipos
        ?.filter((tipo) => tipo.tipo_tabla == "TRANSPORTE")
        .map((item) => ({
          ...item,
          value: item.cod_tipo,
          label: item.nom_tipo,
        })),
    [tipos]
  );

  const paises_ = useMemo(
    () =>
      paises?.map((item, i) => ({
        ...item,
        value: item.cod_pais,
        label: item.nombre_pais,
      })),
    [paises]
  );

  useEffect(() => {
    if (dataGet) {
      const empresa = empresas?.find((i) => dataGet.cod_emp == i.cod_empresa);
      const cenco = cencos?.find((i) => dataGet.cod_cc == i.cod_cc);
      const tipo = tipos?.find((i) => dataGet.cod_tipo == i.cod_tipo);

      setData({
        empresa: empresa ? { ...empresa, label: empresa.nombre_emp, value: empresa.cod_empresa } : null,
        cenco: cenco ? { ...cenco, label: cenco.nombre_cc, value: cenco.cod_cc } : null,
        tipo: tipo ? { ...tipo, label: tipo.nom_tipo, value: tipo.cod_tipo } : null,
        cliente: null,
        fecha_inicio: null,
        fecha_fin: null,
        asunto: dataGet?.asunto || "",
        descripcion: dataGet?.descripcion || "",
        tipo_campana: 1,
      });
    } else {
      // const empresa = empresas?.find((i) => json.configuracion.empresas[0] == i.cod_empresa)
      // const cenco = cencos?.find((i) => json.configuracion.centrosCosto[0] == i.cod_cc)
      setData({
        empresa: current_empresa ? { ...current_empresa, label: current_empresa.nombre_emp, value: current_empresa.cod_empresa } : null,
        cenco: current_cenco ? { ...current_cenco, label: current_cenco.nombre_cc, value: current_cenco.cod_cc } : null,
        tipo_entidad: null,
        fecha_inicio: null,
        fecha_fin: null,
        asunto: null,
        descripcion: null,
        tipo_transporte: null,
        pais_origen: null,
        pais_destino: null,
        tipo_campana: 1,
      });
    }
  }, [dataGet, empresas, cencos]);

  const inputs = useMemo(
    () => [
      {
        tipo: "textarea",
        id: "asunto",
        size: 4,
        requerido: true,
        val: data?.asunto || null,
        label: "Titulo de la campaña",
        readonly: readOnlyInput,
      },
      {
        tipo: "textarea",
        id: "descripcion",
        size: 8,
        requerido: true,
        val: data?.descripcion || null,
        label: "Descripcion de la campaña",
        readonly: readOnlyInput,
      },
      {
        tipo: "date",
        id: "fecha_inicio",
        label: "Fecha de Inicio",
        size: 6,
        requerido: true,
        val: data?.fecha_inicio || null,
        readonly: readOnlyInput,
      },
      {
        tipo: "date",
        id: "fecha_fin",
        label: "Fecha de Finalización",
        size: 6,
        requerido: true,
        val: data?.fecha_fin || null,
        readonly: readOnlyInput,
      },

      {
        id: "tipo_campana",
        label: "Tipo de Campaña",
        val: data?.tipo_campana || null,
        tipo: "radio",
        size: 6,
        options: [
          { value: 1, label: "EXPORTACIÓN" },
          { value: 2, label: "IMPORTACIÓN" },
        ],
        readonly: readOnlyInput,
        requerido: true,
      },

      data?.tipo_campana == 2
        ? {
            id: "pais_origen",
            label: "Paises de origen",
            val: data?.pais_origen,
            tipo: "select",
            size: 6,
            options: paises_,
            readonly: readOnlyInput,
            requerido: false,
            multiple: true,
          }
        : {
            id: "pais_destino",
            label: "Paises de destino",
            val: data?.pais_destino,
            tipo: "select",
            size: 6,
            options: paises_,
            readonly: readOnlyInput,
            requerido: false,
            multiple: true,
          },
      // {
      //   id: "tipo_entidad",
      //   label: "Clasificación del cliente",
      //   val: data?.tipo_entidad || null,
      //   tipo: "radio",
      //   size: 6,
      //   options: [
      //     {label: "CLIENTE", value: 3},
      //     {label: "PRE-CLIENTE", value: 5},
      //   ],
      //   readonly: readOnlyInput,
      //   requerido: true,
      // },
      {
        id: "tipo_transporte",
        label: "Tipo de transporte",
        val: data?.tipo_transporte || null,
        tipo: "radio",
        size: 6,
        options: tipos_transporte_,
        readonly: readOnlyInput,
        requerido: true,
      },
      {
        id: "tipo_actividad",
        label: "Tipo de actividad",
        val: data?.tipo_actividad || null,
        tipo: "radio",
        size: 6,
        options: tipos_config_,
        readonly: readOnlyInput,
        requerido: true,
      },
      {
        id: "tipo_asignacion",
        label: "Tipo de Asignacion",
        val: data?.tipo_asignacion || null,
        tipo: "radio",
        size: 6,
        options: tipos_asignacion,
        readonly: readOnlyInput,
        requerido: true,
      },

      // tipos_config_
    ],
    [data, tipos_, tipos_transporte_, tipos_asignacion, paises_, data?.cliente, tipos_config_, data?.tipo_campana]
  );

  const validateFormData = (data) => {
    let errors = {};
    if (!data.empresa) errors.empresa = true;
    if (!data.cenco) errors.cenco = true;
    if (!data.asunto || data.asunto == "") errors.asunto = true;
    if (!data.descripcion || data.descripcion == "") errors.descripcion = true;
    if (!data.fecha_inicio) errors.fecha_inicio = true;
    if (!data.fecha_fin) errors.fecha_fin = true;
    // if (!(data.pais_origen || data.pais_destino)) errors.pais = true;
    if (!data.tipo_transporte) errors.tipo_transporte = true;
    // if (!data.tipo_entidad) errors.tipo_entidad = true;
    if (!data.tipo_actividad) errors.tipo_actividad = true;
    if (!data.tipo_asignacion) errors.tipo_asignacion = true;
    return errors;
  };

  const handleSubmitPost = async () => {
    try {
      setErrorMessage("");
      console.log(data);
      if (Object.keys(validateFormData(data)).length > 0) {
        console.log(validateFormData(data));
        setErrorMessage("Existen campos incorrectos o faltantes");
        throw new Error("Existen campos incorrectos o faltantes");
      }

      const sendData = {
        cod_emp: data.empresa.value,
        cod_cc: data.cenco.value,
        asunto: data.asunto,
        descripcion: data.descripcion,
        fecha_inicio: new Date(data.fecha_inicio),
        fecha_fin: new Date(data.fecha_fin),
        pais_origen: data?.pais_origen || [],
        pais_destino: data?.pais_destino || [],
        cod_transporte: data.tipo_transporte,
        cod_tipo_entidad: 3,
        cod_tipo_actividad: data.tipo_actividad,
        cod_tipo_asignacion: data.tipo_asignacion,
      };

      await api
        .post("api/appweb/insertar-campana", sendData)
        .then(({ data }) => {
          if (data.data.mensaje == "Campaña creada correctamente") {
            navigate(`/crm/calendario/campana/${encryptId(data.data.cod_campana)}`);
            // alert("Oportunidad creada correctamente")
          } else {
            1; // setErrorMessage(data.data.mensaje)
            throw new Error("Error al crear la campaña");
          }
        })
        .catch((e) => console.error(e));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Grid sx={{ p: 1, m: 0 }}>
      {errorMessage && <BandaAlertaComponent tipo={"error"}>{errorMessage}</BandaAlertaComponent>}

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
            agregar: {
              texto: (
                <>
                  <Icon className=" c-suma" sx={{ mr: 1 }} />
                  Crear Campaña
                </>
              ),
              visible: true,
              onClick: handleSubmitPost,
            },
            cancelar: { visible: false, onClick: null },
            guardar: { visible: false, onClick: null },
            filtrar: { visible: false, onClick: null },
          }}
        />
      </Grid>
    </Grid>
  );
};
