import React, { useEffect, useState, useMemo } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

export const FormularioDepartamento = (props) => {
  const { currentPais, dataGet, setUpdateData, updateData, enableBtn, setEnableBtn, readOnlyInput } = props;
  const [estados, setEstados] = useState(null);
  const [data, setData] = useState(null);
  const [errorsInputs, setErrorsInputs] = useState({});
  const navigate = useNavigate();

  const createRecord = async (data) => {
    try {
      const response = await api.post("/api/appweb/insertar-depto-x-pais", data);
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
      const response = await api.post("/api/appweb/actualizar-depto-x-pais", data);
      if (response.data.data.mensaje === "Departamento actualizado correctamente") {
        const emp = response.data.data.cod_empresa;
      } else if (response.data.data.mensaje === "faltan parametros requeridos, verifique") console.error("Error en el nuevo registro");
    } catch (error) {
      console.error(error);
    }
    setUpdateData(updateData + 1);
  };

  useEffect(() => {
    const fetchData = async () => {
      await api.get("api/appweb/listaestados").then((res) => { setEstados(res.data.data) })
    }
    fetchData()
  }, [data])

  useEffect(() => {
    

    if (dataGet) {
      setData({
        cod_depto: dataGet.cod_depto,
        nombre_depto: dataGet.nombre_depto,
        num_depto: dataGet.num_depto,
        pais: dataGet.pais,
        estado: dataGet.estado,
      });
    } else {
      setData({
        cod_depto: -1,
        num_depto: "",
        nombre_depto: "",
        pais: currentPais ? currentPais : { label: "", value: -1 },
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

  const inputs = useMemo(
    () => [
      {
        tipo: "text",
        id: "nombre_depto",
        val: data?.nombre_depto,
        label: "Departamento",
        readonly: readOnlyInput,
      },
      {
        tipo: "text",
        id: "num_depto",
        val: data?.num_depto,
        label: "Numero Departamento",
        readonly: readOnlyInput,
      },
      {
        tipo: "select",
        id: "pais",
        val: currentPais ? currentPais: { 
          label: data && "pais" in data ? data.pais.label : "", 
          value: data && "pais" in data ? data.pais.value : -1 },
        label: "Pais",
        readonly: true,
        options: currentPais ? [currentPais] : [],
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
    [data, estados_]
  );

  const inputsNewEmp = useMemo(
    () => [
        {
            tipo: "text",
            id: "nombre_depto",
            val: data?.nombre_depto,
            label: "Departamento",
            readonly: readOnlyInput,
          },
          {
            tipo: "text",
            id: "num_depto",
            val: data?.num_depto,
            label: "Numero Departamento",
            readonly: readOnlyInput,
          },
          {
            tipo: "select",
            id: "pais",
            val: currentPais ? currentPais: { 
                label: data && "pais" in data ? data.pais.label : "", 
                value: data && "pais" in data ? data.pais.value : -1 },
            label: "Pais",
            readonly: true,
            options: currentPais ? [currentPais] : [],
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
    [data, estados_, errorsInputs]
  );

  const validateFormData = (data) => {
    let errors = {};
    if (isNaN(data.cod_pais) || data.cod_pais === "" || data.cod_pais === -1) errors.cod_pais = true;
    if (data.nombre_depto === undefined || data.nombre_depto === "") errors.nombre_depto = true;
    if (isNaN(data.num_depto) || data.num_depto === "" || data.num_depto === -1) errors.num_depto = true;
    if (isNaN(data.cod_estado) || data.cod_estado === "" || data.cod_estado === -1) errors.cod_estado = true;

    return errors;
  };

  const handleSubmitPost = async () => {
    const dataSend = {
      cod_depto: Number(data.cod_depto),
      cod_pais: Number(data.pais.value),
      num_depto: Number(data.num_depto),
      nombre_depto: data?.nombre_depto,
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
      cod_depto: Number(data.cod_depto),
      cod_pais: Number(data.pais.value),
      num_depto: Number(data.num_depto),
      nombre_depto: data?.nombre_depto,
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
              guardar: { visible: !readOnlyInput, onClick: handleSubmitUpdate, readonly: false },
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
