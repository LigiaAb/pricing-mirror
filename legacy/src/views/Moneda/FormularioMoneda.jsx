import React, { useEffect, useState, useMemo } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

export const FormularioMoneda = (props) => {
  const { dataGet, paises=[], enableBtn, readOnlyInput, setUpdateData, updateData, } = props;
  const [data, setData] = useState(null);
  const [state, setState] = useState(0)
  const [errorsInputs, setErrorsInputs] = useState({});
  const navigate = useNavigate();

  const createRecord = async (data) => {
    try {
      const response = await api.post("/api/appweb/insertar-moneda", data);
      if (response.data.data.mensaje === "Moneda actualizada correctamente") {
      } else if (response.data.data.mensaje === "faltan parametros requeridos, verifique") console.error("Error en el nuevo registro");
    } catch (error) {
      console.error(error);
    }
    setUpdateData(updateData + 1)
  };

  const updateRecord = async (data) => {
    try {
        const response = await api.post("/api/appweb/actualizar-moneda", data);
        if (response.data.data.mensaje === "Moneda actualizada correctamente") {
        } else if (response.data.data.mensaje === "faltan parametros requeridos, verifique") console.error("Error en el nuevo registro");
    } catch (error) {
        console.error(error);
    }
    setUpdateData(updateData + 1)
  };

  useEffect(() => {
    if (dataGet) {
      let pais = { nombre_pais: "", cod_pais: -1 }
      if(paises){
        pais = paises.find(item => item.cod_pais === dataGet.cod_pais)
      }
      setData({
          cod_moneda: dataGet.cod_moneda,
          nom_moneda: dataGet.nom_moneda,
          simbolo_moneda: dataGet.simbolo_moneda,
          pais: { label: pais.nombre_pais, value: pais.cod_pais },
          cod_serv_banco: dataGet.cod_serv_banco
      });

    } else {
        setData({
            cod_moneda: 0,
            nom_moneda: "",
            simbolo_moneda: "",
            pais: { label: "", value: -1 },
            cod_serv_banco: 0
        });
    }
  }, [dataGet]);

  const paises_ = useMemo(() => 
      paises?.map(item => ({
          value: item.cod_pais.toString(),
          label: item.nombre_pais
      })), 
      [paises]
  );

    // const paises_ = []

  const inputs = useMemo(
    () => [
      {
        tipo: "number",
        id: "cod_moneda",
        val: data?.cod_moneda|| "",
        label: "Codigo",
        readonly: readOnlyInput,
      },
      {
        tipo: "text",
        id: "nom_moneda",
        val:data?.nom_moneda|| "",
        label: "Moneda",
        readonly: readOnlyInput,
      },
      {
        tipo: "text",
        id: "simbolo_moneda"|| "",
        val: data?.simbolo_moneda,
        label: "Simbolo",
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
        tipo: "number",
        id: "cod_serv_banco",
        val: data?.cod_serv_banco,
        label: "Codigo BANGUAT",
        readonly: readOnlyInput,
      },
    ],
    [data, paises_]
  );

  const inputsNewEmp = useMemo(
    () => [
        {
          tipo: "number",
          id: "cod_moneda",
          val: data?.cod_moneda|| "",
          label: "Codigo",
          readonly: readOnlyInput,
        },
        {
          tipo: "text",
          id: "nom_moneda",
          val:data?.nom_moneda|| "",
          label: "Moneda",
          readonly: readOnlyInput,
        },
        {
            tipo: "text",
            id: "simbolo_moneda",
            val: data?.simbolo_moneda|| "",
            label: "Simbolo",
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
            tipo: "number",
            id: "cod_serv_banco",
            val: data?.cod_serv_banco,
            label: "Codigo BANGUAT",
            readonly: readOnlyInput,
        },
    ],
    [data, paises_, errorsInputs]
  );

  const validateFormData = (data) => {
    let errors = {};
    if (isNaN(data.cod_moneda) || data.cod_moneda === "" || data.cod_moneda === -1) errors.cod_moneda = true;
    if (isNaN(data.cod_pais) || data.cod_pais === "" || data.cod_pais === -1)errors.cod_pais = true;
    if (data.nom_moneda === undefined || data.nom_moneda === "") errors.nom_moneda = true;
    if (data.simbolo_moneda === undefined || data.simbolo_moneda === "") errors.simbolo_moneda = true;
    return errors;
  };

  const handleSubmitPost = async () => {
    const cod_serv_banco = (isNaN(data.cod_serv_banco) || data.cod_serv_banco == -1) ? null : Number(data.cod_serv_banco)
    const dataSend = {
        cod_moneda: 0,
        nom_moneda: data.nom_moneda,
        simbolo_moneda: data.simbolo_moneda,
        cod_pais: Number(data.pais.value),
        cod_serv_banco: cod_serv_banco
    };
    const handleErrors = validateFormData(dataSend);
    if (Object.keys(handleErrors).length > 0) {
        setErrorsInputs(handleErrors);
        console.log(handleErrors)
        return null;
    }
    console.log("SEND", dataSend)
    createRecord(dataSend);
  };

  const handleSubmitUpdate = () => {

    const cod_serv_banco = (isNaN(data.cod_serv_banco) || data.cod_serv_banco == -1) ? null : Number(data.cod_serv_banco)
    const dataSend = {
        cod_moneda: Number(data.cod_moneda),
        nom_moneda: data.nom_moneda,
        simbolo_moneda: data.simbolo_moneda,
        cod_pais: Number(data.pais.value),
        cod_serv_banco: cod_serv_banco
    };
    const handleErrors = validateFormData(dataSend);
    if (Object.keys(handleErrors).length > 0) {
        setErrorsInputs(handleErrors);
        console.log("errors", handleErrors)
        return null;
    }
    console.log("SEND", dataSend)
    updateRecord(dataSend);
  };

  return (
    <Box sx={{ p: 1, m: 0 }}>
      {dataGet && (
        <Box display="flex" flexDirection="column">
          <FormularioComponent
            inputs={inputs}
            onInput={({ id, val }) => {
                setState(1)
                setData((inp) => ({ ...inp, [id]: val }));
            }}
            botones={{
              agregar: { visible: false, onClick: null },
              cancelar: { visible: false, onClick: null },
              guardar: { visible: !readOnlyInput, onClick: handleSubmitUpdate, readonly: !enableBtn },
              filtrar: { visible: false, onClick: null },
            }}
          />
          <Typography m={0} p={0} color="red" textAlign="left">
              En caso de que el CODIGO BANGUAT no aplica escribir -1
          </Typography>
        </Box>
      )}
      {!dataGet && (
        <Box>
          <FormularioComponent
            inputs={inputsNewEmp}
            onInput={({ id, val }) => {
                setState(1)
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
