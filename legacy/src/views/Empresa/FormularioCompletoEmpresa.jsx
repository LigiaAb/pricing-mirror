import React, { useEffect, useState, useMemo } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

export const FormularioCompletoEmpresa = (props) => {
  const { dataGet, dataCountry, currentCountry, setUpdateData, updateData, enableBtn, setEnableBtn, readOnlyInput } = props;
  const [data, setData] = useState(null);
  const [errorsInputs, setErrorsInputs] = useState({});
  const navigate = useNavigate();

  const createRecord = async (data) => {
    try {
      const response = await api.post("/api/appweb/insertarempresas", data);
      if (response.data.data.mensaje === "empresa creada correctamente") {
        const emp = response.data.data.cod_empresa;
        navigate(`../view/${emp}/${data.cod_pais}`);
      } else if (response.data.data.mensaje === "faltan parametros requeridos, verifique") console.error("Error en el nuevo registro");
    } catch (error) {
      console.error(error);
    }
  };

  const updateRecord = async (data) => {
    try {
      const response = await api.post("/api/appweb/actualizarempresas", data);
      if (response.data.data.mensaje === "empresa Actualiza correctamente") {
        setUpdateData(!updateData);
        navigate(`../edit/${data.cod_empresa}/${data.cod_pais}`);
      } else if (response.data.data.mensaje === "faltan parametros requeridos, verifique") {
        console.error("Error en el nuevo registro");
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (dataGet && currentCountry) {
      setData({
        nombre_emp: dataGet.nombre_emp,
        pais_emp: currentCountry.cod_pais,
        nit_emp: dataGet.nit_emp,
        direccion_emp: dataGet.direccion_emp,
        logo_emp: dataGet.logo_emp,
      });
    } else {
      setData(false);
    }
  }, [dataGet, currentCountry]);

  useEffect(() => {
    if (dataGet && data) {
      handleValidateBtn(data, dataGet);
    }
  }, [data]);

  const inputs = useMemo(
    () => [
      {
        tipo: "text",
        id: "nombre_emp",
        val: data?.nombre_emp,
        label: "Empresa",
        readonly: readOnlyInput,
      },
      {
        tipo: "text",
        id: "nit_emp",
        val: data?.nit_emp,
        label: "Nit",
        readonly: readOnlyInput,
      },
      {
        tipo: "text",
        id: "direccion_emp",
        val: data?.direccion_emp,
        label: "Direccion",
        readonly: readOnlyInput,
      },
      {
        tipo: "select",
        id: "pais_emp",
        val: { label: currentCountry?.nombre_pais, value: currentCountry?.cod_pais },
        label: "Pais",
        readonly: readOnlyInput,
        options: dataCountry,
        multiple: false,
      },
      {
        tipo: "text",
        id: "logo_emp",
        val: data?.logo_emp,
        label: "Logo",
        readonly: readOnlyInput,
      },
    ],
    [data]
  );

  const inputsNewEmp = useMemo(
    () => [
      {
        tipo: "text",
        id: "nombre_emp",
        val: "",
        label: "Empresa",
        requerido: errorsInputs.nombre_emp,
      },
      {
        tipo: "text",
        id: "nit_emp",
        val: "",
        label: "Nit",
        requerido: errorsInputs.nit_emp,
      },
      {
        tipo: "select",
        id: "pais_emp",
        val: { label: "", value: "" },
        label: "Pais",
        options: dataCountry,
        multiple: false,
        requerido: errorsInputs.cod_pais,
      },
      {
        tipo: "text",
        id: "logo_emp",
        val: "",
        label: "logo",
        requerido: errorsInputs.logo_emp,
      },
      {
        tipo: "text",
        id: "direccion_emp",
        val: "",
        label: "Direccion",
        requerido: errorsInputs.direccion_emp,
      },
    ],
    [data, errorsInputs]
  );

  const validateFormData = (data) => {
    let errors = {};

    if (data.nombre_emp === undefined || data.nombre_emp === "") errors.nombre_emp = true;
    if (isNaN(data.cod_pais) || data.cod_pais === "") errors.cod_pais = true;
    if (data.nit_emp === undefined || data.nit_emp === "") errors.nit_emp = true;
    if (data.direccion_emp === undefined || data.direccion_emp === "") errors.direccion_emp = true;
    if (data.logo_emp === undefined || data.logo_emp === "") errors.logo_emp = true;

    return errors;
  };

  const handleValidateBtn = (dataForUpdate, infoCompare) => {
    if (typeof setEnableBtn == "function") {
      const props = [];
      for (const item in dataForUpdate) {
        props.push(item);
      }
      const exam = props.some((nameProp) => {
        return dataForUpdate[nameProp] != infoCompare[nameProp];
      });
      setEnableBtn(!exam);
    }
  };

  const handleSubmitPost = async () => {
    const dataSend = {
      nombre_emp: data?.nombre_emp,
      cod_pais: Number(data.pais_emp?.value),
      nit_emp: data?.nit_emp,
      direccion_emp: data?.direccion_emp,
      logo_emp: data?.LOGO_EMP,
    };
    const handleErrors = validateFormData(dataSend);

    if (Object.keys(handleErrors).length > 0) {
      setErrorsInputs(handleErrors);
      return null;
    }
    createRecord(dataSend);
  };

  const handleSubmitUpdate = () => {
    const dataSend = {
      nombre_emp: data.nombre_emp,
      cod_pais: Number(data.pais_emp.value) || data.pais_emp,
      nit_emp: data.nit_emp,
      direccion_emp: data.direccion_emp,
      logo_emp: data.logo_emp,
      cod_empresa: dataGet.cod_empresa,
    };
    updateRecord(dataSend);
  };

  return (
    <Box sx={{ p: 1, m: 0 }}>
      {data && dataGet && (
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
              filtrar: { visible: false, onClick: null },
            }}
          />
        </Box>
      )}
    </Box>
  );
};
