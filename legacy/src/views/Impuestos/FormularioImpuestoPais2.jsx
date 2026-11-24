import React, { useState, useEffect, useMemo } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { Box, Grid } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { decryptId } from "../../api/encryptDecrypt";
import { api } from "../../api";
import moment from "moment";

export const FormularioImpuestoPais2 = (props) => {
  const { currentPais, setUpdateData, updateData, readOnlyInput, impuestos = [], estados = [] } = props;
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
    setData({
      cod_impuesto_pais: 0,
      cod_impuesto: id,
      pais: id,
      porcentaje_impuesto: 0,
      fecha_inicio_impuesto: "",
      fecha_fin_impuesto: "",
    });
    setUpdateData(updateData + 1);
  };

  const impuestos_ = useMemo(
    () =>
      impuestos?.map((item) => ({
        value: item.cod_impuesto.toString(),
        label: item.nom_impuesto,
      })),
    [impuestos]
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
    setData({
      cod_impuesto_pais: 0,
      impuesto: { label: "", value: 0 },
      estado: { label: "", value: -1 },
      porcentaje_impuesto: 0,
      fecha_inicio_impuesto: moment(),
      fecha_fin_impuesto: moment(),
      pais: id,
    });
  }, []);

  const inputsNewImpuesto = useMemo(
    () => [
      {
        id: "impuesto",
        label: "Impuesto",
        val: {
          label: data && "impuesto" in data ? data.impuesto.label : "",
          value: data && "impuesto" in data ? data.impuesto.value : -1,
        },
        tipo: "select",
        options: impuestos_,
        readonly: readOnlyInput,
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
    [data, impuestos, estados, errorsInputs]
  );

  function parseDateString(dateString) {
    try {
      const [day, month, year] = dateString.split("-");
      const date = new Date(year, month - 1, day);
      return date.toISOString();
    } catch (error) {
      console.error(error);
      return "";
    }
  }

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
      cod_impuesto: data.impuesto.value,
      cod_pais: data.pais,
      cod_estado: data.estado.value,
      porcentaje_impuesto: data.porcentaje_impuesto,
      fecha_fin_impuesto: data.fecha_fin_impuesto.toISOString(),
      fecha_inicio_impuesto: data.fecha_inicio_impuesto.toISOString(),
    };
    console.log("SEND", dataSend);

    const handleErrors = validateFormData(dataSend);
    if (Object.keys(handleErrors).length > 0) {
      setErrorsInputs(handleErrors);
      console.log(handleErrors);
      return null;
    }
    createRecord(dataSend);
  };

  return (
    <Grid sx={{ p: 1, m: 0 }}>
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
      <h3>* Fechas deberán estar en formato DD-MM-YYYY</h3>
    </Grid>
  );
};
