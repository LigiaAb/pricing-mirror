import React, { useState, useEffect, useMemo } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { Box, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

export const FormularioCompletoPaises = (props) => {
  const { readOnly, dataGet, setUpdateData, updateData, enableBtn, setEnableBtn, readOnlyInput } = props;
  const [data, setData] = useState(null);
  const [errorsInputs, setErrorsInputs] = useState({});
  const navigate = useNavigate();

  const createRecord = async (data) => {
    try {
      const response = await api.post("/api/appweb/insertarpaises", data);
      if (response.data.data.mensaje === "pais creado correctamente") {
        const pais = response.data.data.cod_pais;
        navigate(`../${pais}`);
      } else if (response.data.data.mensaje === "faltan parametros requeridos, verifique") console.error("Error en el nuevo registro");
    } catch (error) {
      console.error(error);
    }
  };

  const updateRecord = async (data) => {
    try {
      const response = await api.post("/api/appweb/actualizarpaises", data);
      if (response.data.data.mensaje === "pais actualizado correctamente") {
        setUpdateData(!updateData);
        navigate(0);
      }
      console.log("registro actualizado", response);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (dataGet) {
      setData({
        nombre_pais: dataGet.nombre_pais,
        ref_pais: dataGet.ref_pais,
      });
    } else {
      setData({
        nombre_pais: "",
        ref_pais: "",
      });
    }
  }, [dataGet]);

  useEffect(() => {
    if (dataGet && data) {
      handleValidateBtn(data, dataGet);
    }
  }, [data]);

  const inputs = useMemo(
    () => [
      {
        tipo: "text",
        id: "nombre_pais",
        val: data?.nombre_pais,
        label: "Pais",
        readonly: readOnlyInput,
      },
      {
        tipo: "text",
        id: "ref_pais",
        val: data?.ref_pais,
        label: "Referencia",
        readonly: readOnlyInput,
      },
    ],
    [data]
  );

  const inputsNewPais = useMemo(
    () => [
      {
        tipo: "text",
        id: "nombre_pais",
        val: data?.nombre_pais,
        label: "Pais",
        requerido: errorsInputs.nom_pais,
      },
      {
        tipo: "text",
        id: "ref_pais",
        val: data?.ref_pais,
        label: "Referencia",
        requerido: errorsInputs.ref_pais,
      },
    ],
    [data, errorsInputs]
  );

  const handleValidateBtn = (dataForUpdate, infoCompare) => {
    if (typeof setEnableBtn == "function") {
      const props = [];
      for (const item in dataForUpdate) {
        props.push(item);
      }
      const exam = props.some((nameProp) => {
        return dataForUpdate[nameProp] != infoCompare[nameProp];
      });
      setEnableBtn(exam);
    }
  };

  const validateFormData = (data) => {
    let errors = {};

    if (data.nom_pais === undefined || data.nom_pais === "") errors.nom_pais = true;
    if (data.ref_pais === undefined || data.ref_pais === "") errors.ref_pais = true;

    return errors;
  };

  const handleSubmitPost = () => {
    const dataSend = {
      nom_pais: data.nombre_pais?.toUpperCase(),
      ref_pais: data.ref_pais?.toUpperCase(),
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
      nom_pais: data.nombre_pais.toUpperCase(),
      ref_pais: data.ref_pais.toUpperCase(),
      cod_pais: dataGet.cod_pais.toString(),
    };
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
            inputs={inputsNewPais}
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
