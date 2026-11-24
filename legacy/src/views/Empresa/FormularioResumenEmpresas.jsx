import React, { useMemo, useState } from "react";
import { Box, Stack } from "@mui/material";
import { api } from "../../api";
import FormularioComponent from "../../components/Formulario/FormularioComponent";

export const FormularioResumenEmpresas = (props) => {
  const { setUpdateData, updateData, idCountry } = props;
  const [errorsInputs, setErrorsInputs] = useState({});
  const [data, setData] = useState({
    NIT_EMP: "",
    NOMBRE_EMP: "",
    DIRECCION_EMP: "",
  });

  const createRecord = async (data) => {
    try {
      const response = await api.post("/api/appweb/insertarempresas", data);
      if (response.data.data.mensaje === "empresa creada correctamente") {
        const emp = response.data.data.cod_empresa;
        setUpdateData(!updateData);
      } else if (response.data.data.mensaje === "faltan parametros requeridos, verifique") console.error("Error en el nuevo registro");
    } catch (error) {
      console.error(error);
    }
  };

  const validateFormData = (data) => {
    let errors = {};

    if (data.nombre_emp === undefined || data.nombre_emp === "") errors.nombre_emp = true;
    if (data.nit_emp === undefined || data.nit_emp === "") errors.nit_emp = true;
    if (data.direccion_emp === undefined || data.direccion_emp === "") errors.direccion_emp = true;

    return errors;
  };

  const inputs = useMemo(
    () => [
      {
        tipo: "text",
        id: "nombre_emp",
        val: data.nombre_emp,
        label: "Empresa",
        requerido: errorsInputs.nombre_emp,
      },
      {
        tipo: "text",
        id: "nit_emp",
        val: data.nit_emp,
        label: "Nit",
        requerido: errorsInputs.nit_emp,
      },
      {
        tipo: "text",
        id: "direccion_emp",
        val: data.direccion_emp,
        label: "Direccion",
        requerido: errorsInputs.direccion_emp,
      },
    ],
    [errorsInputs, data]
  );

  const handleSubmitPost = async () => {
    const dataSend = {
      nombre_emp: data?.nombre_emp,
      cod_pais: Number(idCountry),
      nit_emp: data?.nit_emp,
      direccion_emp: data?.direccion_emp,
      logo_emp: "logo",
    };
    const handleErrors = validateFormData(dataSend);

    if (Object.keys(handleErrors).length > 0) {
      setErrorsInputs(handleErrors);
      return null;
    }
    createRecord(dataSend);
  };

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <Stack direction="column" alignItems="center" useFlexGap justifyContent="center" spacing={2} flexWrap="wrap">
        <FormularioComponent
          inputs={inputs}
          onInput={({ id, val }) => {
            setData((inp) => ({ ...inp, [id]: val }));
          }}
          botones={{
            agregar: { visible: true, onClick: handleSubmitPost },
          }}
        />
      </Stack>
    </Box>
  );
};
