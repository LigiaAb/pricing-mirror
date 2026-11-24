import React, { useEffect, useState, useMemo } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

export const FormularioCiudad = (props) => {
  const { currentPais, dataGet, dataCountry, estados, setUpdateData, updateData, enableBtn, setEnableBtn, readOnlyInput } = props;
  const [data, setData] = useState(null);
  const [errorsInputs, setErrorsInputs] = useState({});
  const navigate = useNavigate();

  const createRecord = async (data) => {
    try {
      const response = await api.post("/api/appweb/insertar-ciudad", data);
      if (response.data.data.mensaje === "Ciudad actualizada correctamente") {
        const emp = response.data.data.cod_empresa;
      } else if (response.data.data.mensaje === "faltan parametros requeridos, verifique") console.error("Error en el nuevo registro");
    } catch (error) {
      console.error(error);
    }
    setUpdateData(updateData + 1);
  };

  const updateRecord = async (data) => {
    try {
      const response = await api.post("/api/appweb/actualizar-ciudad", data);
      if (response.data.data.mensaje === "Ciudad actualizada correctamente") {
        const emp = response.data.data.cod_empresa;
        setUpdateData(updateData + 1);
      } else if (response.data.data.mensaje === "faltan parametros requeridos, verifique") console.error("Error en el nuevo registro");
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (dataGet) {
      console.log("here");
      setData({
        cod_ciudad: dataGet.cod_ciudad,
        nombre_ciudad: dataGet.nombre_ciudad,
        siglas_ciudad: dataGet.siglas_ciudad,
        pais: dataGet.pais,
        estado: dataGet.estado,
      });
    } else {
      setData({
        cod_ciudad: -1,
        nombre_ciudad: "",
        siglas_ciudad: "",
        pais: { label: "", value: -1 },
        estado: { label: "", value: -1 },
      });
    }
  }, [dataGet]);

  const estados_ = useMemo(
    () =>
      estados?.map((item) => ({
        value: item.cod_estado.toString(),
        label: item.estado_desc,
      })),
    [estados]
  );

  const paises_ = useMemo(
    () =>
      dataCountry?.map((item) => ({
        value: item.cod_pais.toString(),
        label: item.nombre_pais,
      })),
    [dataCountry]
  );

  const inputs = useMemo(
    () => [
      {
        tipo: "text",
        id: "nombre_ciudad",
        val: data?.nombre_ciudad,
        label: "Ciudad",
        readonly: readOnlyInput,
      },
      {
        tipo: "text",
        id: "siglas_ciudad",
        val: data?.siglas_ciudad,
        label: "Siglas",
        readonly: readOnlyInput,
      },
      {
        tipo: "select",
        id: "pais_emp",
        val: currentPais ? currentPais : { 
          label: data && "pais" in data ? data.pais.label : "", 
          value: data && "pais" in data ? data.pais.value : -1 },
        label: "Pais",
        readonly: true,
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
    ],
    [data]
  );

  const inputsNewEmp = useMemo(
    () => [
        {
            tipo: "text",
            id: "nombre_ciudad",
            val: data?.nombre_ciudad,
            label: "Ciudad",
            readonly: readOnlyInput,
          },
          {
            tipo: "text",
            id: "siglas_ciudad",
            val: data?.siglas_ciudad,
            label: "Siglas",
            readonly: readOnlyInput,
          },
          {
            tipo: "select",
            id: "pais",
            val: { 
                label: data && "pais" in data ? data.pais.label : "", 
                value: data && "pais" in data ? data.pais.value : -1 },
            label: "Pais",
            readonly: readOnlyInput,
            options: paises_,
            multiple: false,
          },
          {
            id: "estado",
            label: "Estado",
            tipo: "select",
            val: {
                label: data && "estado" in data ? data.estado.label : "", 
                value: data && "estado" in data ? data.estado.value : -1 },
            options: estados_,
            readonly: readOnlyInput,
          },
    ],
    [data, errorsInputs]
  );

  const validateFormData = (data) => {
    let errors = {};

    if (isNaN(data.cod_pais) || data.cod_pais === "" || data.cod_pais === -1) errors.cod_pais = true;
    if (data.nombre_ciudad === undefined || data.nombre_ciudad === "") errors.nombre_ciudad = true;
    if (data.siglas_ciudad === undefined || data.siglas_ciudad === "") errors.siglas_ciudad = true;
    if (isNaN(data.cod_estado) || data.cod_estado === "" || data.cod_estado === -1) errors.cod_estado = true;

    return errors;
  };

  const handleSubmitPost = async () => {
    console.log("data", data);
    const dataSend = {
      cod_pais: Number(data.pais.value),
      nombre_ciudad: data?.nombre_ciudad,
      siglas_ciudad: data?.siglas_ciudad,
      cod_estado: Number(data.estado.value),
    };
    const handleErrors = validateFormData(dataSend);

    if (Object.keys(handleErrors).length > 0) {
      setErrorsInputs(handleErrors);
      console.log(handleErrors);
      return null;
    }
    createRecord(dataSend);
  };

  const handleSubmitUpdate = () => {
    console.log("data", data);
    const dataSend = {
      cod_ciudad: Number(data.cod_ciudad),
      cod_pais: Number(data.pais.value),
      nombre_ciudad: data?.nombre_ciudad,
      siglas_ciudad: data?.siglas_ciudad,
      cod_estado: Number(data.estado.value),
    };
    const handleErrors = validateFormData(dataSend);
    if (Object.keys(handleErrors).length > 0) {
      setErrorsInputs(handleErrors);
      console.log(handleErrors);
      return null;
    }
    updateRecord(dataSend);
  };

  return (
    <Box sx={{ p: 1, m: 0 }}>
      {dataGet && (
        <Box display="flex" flexDirection="column">
          <FormularioComponent
            inputs={inputs}
            onInput={({ id, val }) => {
              setData((inp) => ({ ...inp, [id]: val }));
            }}
            botones={{
              agregar: { visible: false, onClick: null },
              cancelar: { visible: false, onClick: null },
              guardar: { visible: !readOnlyInput, onClick: handleSubmitUpdate, readonly: enableBtn },
              filtrar: { visible: false, onClick: null },
            }}
          />
        </Box>
      )}
      {!dataGet && (
        <Box>
          <FormularioComponent
            inputs={inputsNewEmp}
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
            }}
          />
        </Box>
      )}
    </Box>
  );
};
