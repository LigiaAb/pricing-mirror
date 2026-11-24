import React, { useState, useEffect, useMemo } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { Box, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

export const FormularioImpuestos = (props) => {
  const { readOnly, dataGet, setUpdateData, updateData, enableBtn, setEnableBtn, readOnlyInput, paises = [] } = props;
  const [data, setData] = useState(null);
  const [errorsInputs, setErrorsInputs] = useState({});
  const navigate = useNavigate();

  const createRecord = async (data) => {
    try {
      const response = await api.post("/api/appweb/insertar-impuesto", data);
      if (response.data.data.mensaje === "Impuesto actualizado correctamente") {
      } else if (response.data.data.mensaje === "faltan parametros requeridos, verifique") console.error("Error en el nuevo registro");
    } catch (error) {
      console.error(error);
    }
    setUpdateData(updateData + 1);
  };

  const updateRecord = async (data) => {
    try {
      const response = await api.post("/api/appweb/actualizar-impuesto", data);
      if (response.data.data.mensaje === "Impuesto actualizado correctamente") {
      } else if (response.data.data.mensaje === "faltan parametros requeridos, verifique") console.error("Error en el nuevo registro");
    } catch (error) {
      console.error(error);
    }
    setUpdateData(updateData + 1);
  };

  useEffect(() => {
    if (dataGet) {
      setData({
        cod_impuesto: dataGet.cod_impuesto,
        nom_impuesto: dataGet.nom_impuesto,
      });
    } else {
      setData({
        cod_impuesto: 0,
        nom_impuesto: "",
      });
    }
  }, [dataGet]);

  const inputs = useMemo(
    () => [
      {
        tipo: "number",
        id: "cod_impuesto",
        val: data?.cod_impuesto,
        label: "Codigo",
        readonly: true,
      },
      {
        tipo: "text",
        id: "nom_impuesto",
        val: data?.nom_impuesto,
        label: "Nombre Impuesto",
        readonly: readOnlyInput,
      },
    ],
    [data]
  );

  const inputsNewImpuesto = useMemo(
    () => [
      {
        tipo: "number",
        id: "cod_impuesto",
        val: data?.cod_impuesto,
        label: "Codigo",
        readonly: true,
      },
      {
        tipo: "text",
        id: "nom_impuesto",
        val: data?.nom_impuesto,
        label: "Nombre Impuesto",
        readonly: readOnlyInput,
      },
    ],
    [data, errorsInputs]
  );

  const validateFormData = (data) => {
    let errors = {};
    if (isNaN(data.cod_impuesto) || data.cod_impuesto === "" || data.cod_impuesto === -1) errors.cod_impuesto = true;
    if (data.nom_impuesto === undefined || data.nom_impuesto === "") errors.nom_impuesto = true;
    return errors;
  };

  const handleSubmitPost = async () => {
    const cod_serv_banco = isNaN(data.cod_serv_banco) || data.cod_serv_banco == -1 ? null : Number(data.cod_serv_banco);
    const dataSend = {
      cod_impuesto: 0,
      nom_impuesto: data.nom_impuesto,
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
    const cod_serv_banco = isNaN(data.cod_serv_banco) || data.cod_serv_banco == -1 ? null : Number(data.cod_serv_banco);
    const dataSend = {
      cod_impuesto: Number(data.cod_impuesto),
      nom_impuesto: data.nom_impuesto,
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
    </Grid>
  );
};
