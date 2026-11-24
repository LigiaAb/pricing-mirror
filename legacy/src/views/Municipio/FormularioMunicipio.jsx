import React, { useEffect, useState, useMemo } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

export const FormularioMunicipio = (props) => {
  const { currentPais, dataGet, paises, estados, departamentos, enableBtn, readOnlyInput, updateData, setUpdateData } = props;
  const [data, setData] = useState(null);
  const [state, setState] = useState(0);
  const [errorsInputs, setErrorsInputs] = useState({});
  const navigate = useNavigate();

  const createRecord = async (data) => {
    try {
      const response = await api.post("/api/appweb/insertar-municipios", data);
      if (response.data.data.mensaje === "Municipio actualizado correctamente") {
        const emp = response.data.data.cod_empresa;
      } else if (response.data.data.mensaje === "faltan parametros requeridos, verifique") console.error("Error en el nuevo registro");
    } catch (error) {
      console.error(error);
    }
    setUpdateData(updateData + 1);
  };

  const updateRecord = async (data) => {
    try {
      const response = await api.post("api/appweb/actualizar-municipios", data);
      if (response.data.data.mensaje === "Municipio actualizado correctamente") {
        const emp = response.data.data.cod_empresa;
      } else if (response.data.data.mensaje === "faltan parametros requeridos, verifique") console.error("Error en el nuevo registro");
    } catch (error) {
      console.error(error);
    }
    setUpdateData(updateData + 1);
  };

  useEffect(() => {
    if (dataGet) {
      const departamento = departamentos.find((item) => item.cod_depto === dataGet.departamento.value);
      const pais = paises.find((item) => item.cod_pais === departamento.cod_pais);

      setData({
        cod_muni: dataGet.cod_muni,
        nombre_muni: dataGet.nombre_muni,
        departamento: dataGet.departamento,
        pais: { label: pais.nombre_pais, value: pais.cod_pais },
        estado: dataGet.estado,
      });
    } else {
      setData({
        cod_muni: -1,
        nombre_muni: "",
        departamento: { label: "", value: -1 },
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

  const paises_ = useMemo(
    () =>
      paises.map((item) => ({
        value: item.cod_pais.toString(),
        label: item.nombre_pais,
      })),
    [paises]
  );

  const departamentos_ = useMemo(
    () =>
      departamentos
        .filter((item) => item.cod_pais == (data && "pais" in data ? data.pais.value : -1))
        .map((item) => ({
          value: item.cod_depto.toString(),
          label: item.nombre_depto,
        })),
    [departamentos, data?.pais]
  );

  useEffect(() => {
    if (state > 0) {
      setData({
        ...data,
        departamento: { value: -1, label: "" },
      });
    }
  }, [data?.pais, currentPais]);

  const inputs = useMemo(
    () => [
      {
        tipo: "text",
        id: "nombre_muni",
        val: data && "nombre_muni" in data ? data.nombre_muni : "",
        label: "Municipio",
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
        options: paises_,
        multiple: false,
      },
      {
        tipo: "select",
        id: "departamento",
        val: {
          label: data && "departamento" in data ? data.departamento.label : "",
          value: data && "departamento" in data ? data.departamento.value : -1,
        },
        label: "Departamento",
        readonly: true,
        options: departamentos_,
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
        multiple: false,
      },
    ],
    [data]
  );

  const inputsNewEmp = useMemo(
    () => [
      {
        tipo: "text",
        id: "nombre_muni",
        val: data?.nombre_muni,
        label: "Municipio",
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
        options: paises_,
        multiple: false,
      },
      {
        tipo: "select",
        id: "departamento",
        val: {
          label: data && "departamento" in data ? data.departamento.label : "",
          value: data && "departamento" in data ? data.departamento.value : -1,
        },
        label: "Departamento",
        readonly: readOnlyInput,
        options: departamentos_,
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
        multiple: false,
      },
    ],
    [data, errorsInputs]
  );

  const validateFormData = (data) => {
    let errors = {};
    if (isNaN(data.cod_muni) || data.cod_muni === "" || data.cod_muni === -1) errors.cod_muni = true;
    if (isNaN(data.cod_depto) || data.cod_depto === "" || data.cod_depto === -1) errors.cod_depto = true;
    if (isNaN(data.cod_estado) || data.cod_estado === "" || data.cod_estado === -1) errors.cod_estado = true;
    if (data.nombre_muni === undefined || data.nombre_muni === "") errors.nombre_muni = true;

    return errors;
  };

  const handleSubmitPost = async () => {
    const dataSend = {
      cod_muni: 0,
      cod_depto: Number(data.departamento.value),
      nombre_muni: data.nombre_muni,
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
    const dataSend = {
      cod_muni: Number(data.cod_muni),
      cod_depto: Number(data.departamento.value),
      nombre_muni: data.nombre_muni,
      cod_estado: Number(data.estado.value),
    };
    const handleErrors = validateFormData(dataSend);
    if (Object.keys(handleErrors).length > 0) {
      setErrorsInputs(handleErrors);
      console.log(handleErrors);
      return null;
    }
    console.log("SEND", dataSend);
    updateRecord(dataSend);
  };

  return (
    <Box sx={{ p: 1, m: 0 }}>
      {dataGet && (
        <Box display="flex" flexDirection="column">
          <FormularioComponent
            inputs={inputs}
            onInput={({ id, val }) => {
              setState(1);
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
              setState(1);
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
