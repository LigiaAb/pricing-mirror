import React, { useState, useEffect, useMemo } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { Box, Grid } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { decryptId } from "../../api/encryptDecrypt";
import { api } from "../../api";
import moment from "moment";

export const FormularioImpuestoPais = (props) => {
  const { readOnly, dataGet, setUpdateData, updateData, enableBtn, setEnableBtn, readOnlyInput, paises = [], estados = [] } = props;
  const [data, setData] = useState(null);
  const [errorsInputs, setErrorsInputs] = useState({});
  const navigate = useNavigate();

  let { encryptedId } = useParams();
  let id = encryptedId ? decryptId(encryptedId) : -1;

  const createRecord = async (data) => {
    try {
      const response = await api.post("/api/appweb/insertar-impuesto-x-pais", data);
      if (response.data.data.mensaje === "Impuesto por pais actualizado correctamente") {
      } else if (response.data.data.mensaje === "faltan parametros requeridos, verifique") console.error("Error en el nuevo registro");
    } catch (error) {
      console.error(error);
    }
    setUpdateData(updateData + 1);
    setData({
      cod_impuesto_pais: 0,
      cod_impuesto: id,
      pais: { label: "", value: -1 },
      porcentaje_impuesto: 0,
      fecha_inicio_impuesto: "",
      fecha_fin_impuesto: "",
    });
  };

  const updateRecord = async (data) => {
    try {
      const response = await api.post("/api/appweb/actualizar-impuesto-x-pais", data);
      if (response.data.data.mensaje === "Impuesto por pais actualizado correctamente") {
      } else if (response.data.data.mensaje === "faltan parametros requeridos, verifique") console.error("Error en el nuevo registro");
    } catch (error) {
      console.error(error);
    }
    setUpdateData(updateData + 1);
    setData({
      cod_impuesto_pais: 0,
      cod_impuesto: id,
      pais: { label: "", value: -1 },
      porcentaje_impuesto: 0,
      fecha_inicio_impuesto: "",
      fecha_fin_impuesto: "",
    });
  };

  const paises_ = useMemo(
    () =>
      paises?.map((item) => ({
        value: item.cod_pais.toString(),
        label: item.nombre_pais,
      })),
    [paises]
  );

  const estados_ = useMemo(
    () =>
      estados?.map((item) => ({
        value: item.cod_estado.toString(),
        label: item.estado_desc,
      })),
    [estados]
  );

  useEffect(() => {
    if (dataGet) {
      setData({
        cod_impuesto_pais: dataGet.cod_impuesto_pais,
        cod_impuesto: dataGet.cod_impuesto,
        pais: { label: dataGet.nombre_pais, value: dataGet.cod_pais },
        estado: { label: dataGet.estado_desc, value: dataGet.estado_id },
        porcentaje_impuesto: dataGet.porcentaje_impuesto,
        fecha_inicio_impuesto: dataGet.fecha_inicio_impuesto ? moment(dataGet.fecha_inicio_impuesto) : moment(),
        fecha_fin_impuesto: dataGet.fecha_fin_impuestohyhhh ? moment(dataGet.fecha_fin_impuesto) : moment(),
      });
    } else {
      setData({
        cod_impuesto_pais: 0,
        cod_impuesto: id,
        pais: { label: "", value: -1 },
        porcentaje_impuesto: 0,
        fecha_inicio_impuesto: moment(),
        fecha_fin_impuesto: moment(),
      });
    }
  }, [dataGet]);

  const inputs = useMemo(
    () => [
      {
        tipo: "select",
        id: "pais",
        val: {
          label: data && "pais" in data ? data.pais.label : "",
          value: data && "pais" in data ? data.pais.value : -1,
        },
        label: "Pais",
        readonly: readOnlyInput,
        options: paises_,
        multiple: false,
      },
      {
        id: "estado",
        label: "Estado",
        val: {
          label: data && "estado" in data ? data.estado.label : "",
          value: data && "estado" in data ? data.estado.value : -1,
        },
        tipo: "select",
        options: estados_,
        readonly: readOnlyInput,
      },
      {
        tipo: "number",
        id: "porcentaje_impuesto",
        val: data?.porcentaje_impuesto,
        label: "Porcentaje",
        readonly: readOnlyInput,
      },
      {
        tipo: "date",
        id: "fecha_inicio_impuesto",
        val: data?.fecha_inicio_impuesto ? data.fecha_fin_impuesto.toDate() : null,
        label: "fecha inicio impuesto*",
        readonly: readOnlyInput,
      },
      {
        tipo: "date",
        id: "fecha_fin_impuesto",
        val: data?.fecha_fin_impuesto ? data.fecha_fin_impuesto.toDate() : null,
        label: "fecha fin impuesto*",
        readonly: readOnlyInput,
      },
    ],
    [data, paises, estados]
  );

  const inputsNewImpuesto = useMemo(
    () => [
      {
        tipo: "select",
        id: "pais",
        val: {
          label: data && "pais" in data ? data.pais.label : "",
          value: data && "pais" in data ? data.pais.value : -1,
        },
        label: "Pais",
        readonly: readOnlyInput,
        options: paises_,
        multiple: false,
      },
      {
        id: "estado",
        label: "Estado",
        val: {
          label: data && "estado" in data ? data.estado.label : "",
          value: data && "estado" in data ? data.estado.value : -1,
        },
        tipo: "select",
        options: estados_,
        readonly: readOnlyInput,
      },
      {
        tipo: "number",
        id: "porcentaje_impuesto",
        val: data?.porcentaje_impuesto,
        label: "Porcentaje",
        readonly: readOnlyInput,
      },
      {
        tipo: "date",
        id: "fecha_inicio_impuesto",
        val: data?.fecha_inicio_impuesto,
        label: "fecha inicio impuesto*",
        readonly: readOnlyInput,
      },
      {
        tipo: "date",
        id: "fecha_fin_impuesto",
        val: data?.fecha_fin_impuesto,
        label: "fecha fin impuesto*",
        readonly: readOnlyInput,
      },
    ],
    [data, paises, estados, errorsInputs]
  );

  const validateFormData = (data) => {
    let errors = {};
    if (isNaN(data.porcentaje_impuesto) || data.porcentaje_impuesto === "" || data.porcentaje_impuesto < 0) errors.porcentaje_impuesto = true;
    if (isNaN(data.cod_pais) || data.cod_pais === "" || data.cod_pais < 0) errors.cod_pais = true;
    if (isNaN(data.cod_estado) || data.cod_estado === "" || data.cod_estado < 0) errors.cod_estado = true;
    if (isNaN(data.porcentaje_impuesto) || data.porcentaje_impuesto === "" || data.porcentaje_impuesto < 0) errors.porcentaje_impuesto = true;
    if (data.fecha_fin_impuesto === undefined || data.fecha_fin_impuesto === "") errors.fecha_fin_impuesto = true;
    if (data.fecha_inicio_impuesto === undefined || data.fecha_inicio_impuesto === "") errors.fecha_inicio_impuesto = true;
    return errors;
  };

  const handleSubmitPost = async () => {
    const dataSend = {
      cod_impuesto_pais: data.cod_impuesto_pais,
      cod_impuesto: data.cod_impuesto,
      cod_pais: data.pais.value,
      cod_estado: data.estado.value,
      porcentaje_impuesto: data.porcentaje_impuesto,
      fecha_fin_impuesto: data.fecha_fin_impuesto.toISOString(),
      fecha_inicio_impuesto: data.fecha_inicio_impuesto.toISOString(),
    };
    const handleErrors = validateFormData(dataSend);
    if (Object.keys(handleErrors).length > 0) {
      setErrorsInputs(handleErrors);
      console.log(handleErrors);
      return null;
    }
    console.log("SEND", dataSend);
    createRecord(dataSend);
  };

  const handleSubmitUpdate = () => {
    const dataSend = {
      cod_impuesto_pais: data.cod_impuesto_pais,
      cod_impuesto: data.cod_impuesto,
      cod_pais: data.pais.value,
      cod_estado: data.estado.value,
      porcentaje_impuesto: data.porcentaje_impuesto,
      fecha_fin_impuesto: data.fecha_fin_impuesto.toISOString(true),
      fecha_inicio_impuesto: data.fecha_inicio_impuesto.toISOString(true),
    };
    const handleErrors = validateFormData(dataSend);
    if (Object.keys(handleErrors).length > 0) {
      setErrorsInputs(handleErrors);
      console.log("errors", handleErrors);
      return null;
    }
    console.log("SEND", dataSend);
    updateRecord(dataSend);
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
              agregar: { visible: false, onClick: null },
              cancelar: { visible: false, onClick: null },
              guardar: { visible: !readOnlyInput, onClick: handleSubmitUpdate, readonly: !enableBtn },
              filtrar: { visible: false, onClick: null },
            }}
          />
        </Grid>
      )}
      {!dataGet && (
        <Grid>
          <FormularioComponent
            inputs={inputsNewImpuesto}
            onInput={({ id, val }) => {
              setData((inp) => ({ ...inp, [id]: val }));
            }}
            botones={{
              agregar: {
                visible: true,
                onClick: handleSubmitPost,
              },
              cancelar: { visible: false, onClick: null },
              guardar: { visible: false, onClick: null },
              filtrar: { visible: false, onClick: null },
            }}
          />
        </Grid>
      )}
      <h3>* Fechas deberán estar en formato DD-MM-YYYY</h3>
    </Grid>
  );
};
