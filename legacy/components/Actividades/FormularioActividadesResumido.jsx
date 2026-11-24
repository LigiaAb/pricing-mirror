import React, { useState, useEffect, useMemo } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { Box, Grid, Icon } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import moment from "moment";

export const FormularioActividadesResumido = (props) => {
  const { readOnly, dataGet, setUpdateData, updateData, tipoActividad, setEnableBtn, readOnlyInput = false, paises = [] } = props;
  const [data, setData] = useState(null);
  const [errorsInputs, setErrorsInputs] = useState({});
  const navigate = useNavigate();

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

  const paises_ = useMemo(
    () =>
      paises?.map((item) => ({
        value: item.cod_pais.toString(),
        label: item.nombre_pais,
      })),
    [paises]
  );

  const tipos_ = useMemo(
    () =>
      tipoActividad?.map((item, i) => ({
        value: i,
        label: item,
      })),
    [tipoActividad]
  );

  useEffect(() => {
    if (dataGet) {
      setData({
        departamento: { label: "INFORMATICA - Cropa S.A.", value: -1 },
        asesor_responsable: { label: "Derek Esquivel", value: -1 },
        tipo: { label: "", value: -1 },
        pais: { label: "", value: -1 },
        estacion: { label: "", value: -1 },
        fecha_programada: null,
        asunto: "",
        asesor_cliente: "",
        cliente: { label: "", value: -1 },
        contacto: { label: "", value: -1 },
      });
    } else {
      setData({
        departamento: { label: "INFORMATICA - Cropa S.A.", value: -1 },
        asesor_responsable: { label: "Derek Esquivel", value: -1 },
        tipo: { label: "", value: -1 },
        pais: { label: "", value: -1 },
        estacion: { label: "", value: -1 },
        fecha_programada: null,
        asunto: "",
        asesor_cliente: "",
        cliente: { label: "", value: -1 },
        contacto: { label: "", value: -1 },
      });
    }
  }, []);

  useEffect(() => {
    setData((data) => ({
      ...data,
      cliente: { label: "", value: -1 },
      contacto: { label: "", value: -1 },
      pais: { label: "", value: -1 },
    }));
  }, [data?.tipo]);

  const inputs = useMemo(
    () => [
      {
        id: "departamento",
        label: "Departamento",
        val: {
          label: data && "departamento" in data ? data.departamento.label : "INFORMATICA - Cropa S.A.",
          value: data && "departamento" in data ? data.departamento.value : -1,
        },
        tipo: "select",
        size: 6,
        options: [],
        readonly: true,
      },
      {
        id: "asesor_responsable",
        label: "Asesor Responsable",
        val: {
          label: data && "asesor_responsable" in data ? data.asesor_responsable.label : "Derek Esquivel",
          value: data && "asesor_responsable" in data ? data.asesor_responsable.value : -1,
        },
        tipo: "select",
        size: 6,
        options: [],
        readonly: true,
      },
      {
        id: "tipo",
        label: "Tipo Actividad",
        val: {
          label: data && "tipo" in data ? data.tipo.label : "",
          value: data && "tipo" in data ? data.tipo.value : -1,
        },
        tipo: "select",
        size: 6,
        options: tipos_,
        readonly: readOnlyInput,
      },
      {
        tipo: "select",
        id: "pais",
        val: {
          label: data && "pais" in data ? data.pais.label : "",
          value: data && "pais" in data ? data.pais.value : -1,
        },
        label: "Pais",
        size: 6,
        readonly: activeInput("pais"),
        options: paises_,
        multiple: false,
      },

      {
        id: "estacion",
        label: "Estación",
        val: {
          label: data && "estacion" in data ? data.estacion.label : "",
          value: data && "estacion" in data ? data.estacion.value : -1,
        },
        tipo: "select",
        size: 6,
        options: [],
        readonly: true,
      },

      {
        tipo: "date",
        id: "fecha_programada",
        label: "Fecha Programada",
        size: 5,
        val: data?.fecha_programada || null,
        readonly: readOnlyInput,
      },
      {
        tipo: "textarea",
        id: "asunto",
        size: 6,
        val: data?.asunto || "",
        label: "Asunto de actividad",
        readonly: readOnlyInput,
      },
      {
        tipo: "text",
        id: "asesor_cliente",
        val: data?.asesor_cliente || "",
        label: "Asesor por Cliente",
        readonly: activeInput("asesor"),
        size: 6,
      },
    ],
    [data, tipos_, paises_]
  );

  const validateFormData = (data) => {
    let errors = {};
    if (isNaN(data.cod_impuesto) || data.cod_impuesto === "" || data.cod_impuesto === -1) errors.cod_impuesto = true;
    if (data.nom_impuesto === undefined || data.nom_impuesto === "") errors.nom_impuesto = true;
    return errors;
  };

  const handleSubmitPost = async () => {
    console.log("SEND", data);
  };

  const handleSubmitUpdate = () => {
    console.log("SEND", data);
  };

  return (
    <Grid sx={{ p: 1, m: 0 }}>
      {data && dataGet && (
        <Grid display="flex" flexDirection="column">
          <FormularioComponent
            inputs={inputs}
            onInput={({ id, val }) => {
              setData((inp) => ({ ...inp, [id]: val }));
            }}
            botones={{
              // agregar_cliente: {
              //   texto: <>
              //     <Icon className="c-cliente" sx={{mr:1}}/>
              //     Crear Cliente
              //   </>,
              //   color: "success",
              //   visible: true,
              //   onClick: null,
              // },
              // agregar_contacto: {
              //   texto: <>
              //     <Icon className="c-perfil-usuario" sx={{mr:1}}/>
              //     Crear Contacto
              //   </>,
              //   color: "secondary",
              //   visible: true,
              //   onClick: null,
              // },
              guardar_actividad: {
                texto: (
                  <>
                    <Icon className=" c-suma" sx={{ mr: 1 }} />
                    Guardar Actividad
                  </>
                ),
                visible: true,
                onClick: handleSubmitUpdate,
              },
              agregar: { visible: false, onClick: null },
              cancelar: { visible: false, onClick: null },
              guardar: { visible: false, onClick: null },
              filtrar: { visible: false, onClick: null },
            }}
          />
        </Grid>
      )}
      {!dataGet && (
        <Grid>
          <FormularioComponent
            inputs={inputs}
            onInput={({ id, val }) => {
              setData((inp) => ({ ...inp, [id]: val }));
            }}
            botones={{
              agregar_cliente: {
                texto: (
                  <>
                    <Icon className="c-cliente" sx={{ mr: 1 }} />
                    Crear Cliente
                  </>
                ),
                color: "success",
                visible: true,
                onClick: null,
              },
              agregar_contacto: {
                texto: (
                  <>
                    <Icon className="c-perfil-usuario" sx={{ mr: 1 }} />
                    Crear Contacto
                  </>
                ),
                color: "secondary",
                visible: true,
                onClick: null,
              },
              agregar_actividad: {
                texto: (
                  <>
                    <Icon className=" c-suma" sx={{ mr: 1 }} />
                    Crear Actividad
                  </>
                ),
                visible: true,
                onClick: handleSubmitPost,
              },

              agregar: { visible: false, onClick: null },
              cancelar: { visible: false, onClick: null },
              guardar: { visible: false, onClick: null },
              filtrar: { visible: false, onClick: null },
            }}
          />
        </Grid>
      )}
    </Grid>
  );
};
