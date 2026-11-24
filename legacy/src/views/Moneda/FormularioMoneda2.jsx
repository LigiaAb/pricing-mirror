import React, { useState, useEffect, useMemo } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { Box, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";

export const FormularioMoneda2 = (props) => {
  const { dataGet, setDataGet, setUpdateData, updateData, enableBtn, setEnableBtn, paises = [] } = props;
  const readOnlyInput = false;
  const [data, setData] = useState(
    dataGet || {
      cod_moneda: null,
      nom_moneda: "",
      simbolo_moneda: "",
      pais: null,
      cod_serv_banco: null,
    }
  );
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
    setUpdateData(updateData + 1);
  };

  const updateRecord = async (data) => {
    try {
      const response = await api.post("/api/appweb/actualizar-moneda", data);
      if (response.data.data.mensaje === "Moneda actualizada correctamente") {
      } else if (response.data.data.mensaje === "faltan parametros requeridos, verifique") console.error("Error en el nuevo registro");
    } catch (error) {
      console.error(error);
    }
    setUpdateData(updateData + 1);
  };

  useEffect(() => {
    if (dataGet) {
      setData(dataGet);
    } else {
      setData({
        cod_moneda: null,
        nom_moneda: "",
        simbolo_moneda: "",
        pais: { label: "", value: -1 },
        cod_serv_banco: null,
      });
    }
  }, [dataGet]);

  const paises_ = useMemo(() => {
    return paises?.map((item) => ({
      value: item.cod_pais.toString(),
      label: item.nombre_pais,
    }));
  }, [paises]);

  const inputs = useMemo(
    () => [
      {
        tipo: "number",
        id: "cod_moneda",
        val: data?.cod_moneda || "",
        label: "Codigo",
        readonly: readOnlyInput,
      },
      {
        tipo: "text",
        id: "nom_moneda",
        val: data?.nom_moneda || "",
        label: "Moneda",
        readonly: readOnlyInput,
      },
      {
        tipo: "text",
        id: "simbolo_moneda",
        val: data?.simbolo_moneda || "",
        label: "Simbolo",
        readonly: readOnlyInput,
      },
      {
        tipo: "select",
        id: "pais",
        val: data.pais || null,
        label: "Pais",
        readonly: readOnlyInput,
        options: paises_,
        multiple: false,
      },
      {
        tipo: "number",
        id: "cod_serv_banco",
        val: data?.cod_serv_banco || "",
        label: "Codigo BANGUAT",
        readonly: readOnlyInput,
      },
      {
        tipo: "radio",
        label: "Es Operativa",
        id: "es_operativa",
        val: data?.es_operativa,
        options: [
          { label: "Si", value: true },
          { label: "No", value: false },
        ],
        readonly: readOnlyInput,
      },
    ],
    [data, paises_]
  );

  const inputsNewPais = useMemo(
    () => [
      {
        tipo: "number",
        id: "cod_moneda",
        val: data?.cod_moneda || "",
        label: "Codigo",
        readonly: readOnlyInput,
      },
      {
        tipo: "text",
        id: "nom_moneda",
        val: data?.nom_moneda || "",
        label: "Moneda",
        readonly: readOnlyInput,
      },
      {
        tipo: "text",
        id: "simbolo_moneda",
        val: data?.simbolo_moneda || "",
        label: "Simbolo",
        readonly: readOnlyInput,
      },
      {
        tipo: "select",
        id: "pais",
        val: data?.pais || null,
        label: "Pais",
        readonly: readOnlyInput,
        options: paises_,
        multiple: false,
      },
      {
        tipo: "number",
        id: "cod_serv_banco",
        val: data?.cod_serv_banco || "",
        label: "Codigo BANGUAT",
        readonly: readOnlyInput,
      },
      {
        tipo: "radio",
        label: "Es Operativa",
        id: "es_operativa",
        // val: "S",
        options: [
          { label: "Si", value: true },
          { label: "No", value: false },
        ],
        readonly: readOnlyInput,
      },
    ],
    [data, paises_, errorsInputs]
  );

  const validateFormData = (data) => {
    let errors = {};
    if (isNaN(data.cod_moneda) || data.cod_moneda === "" || data.cod_moneda === -1) errors.cod_moneda = true;
    if (isNaN(data.cod_pais) || data.cod_pais === "" || data.cod_pais === -1) errors.cod_pais = true;
    if (data.nom_moneda === undefined || data.nom_moneda === "") errors.nom_moneda = true;
    if (data.simbolo_moneda === undefined || data.simbolo_moneda === "") errors.simbolo_moneda = true;
    return errors;
  };

  const handleSubmitPost = async () => {
    const cod_serv_banco = isNaN(data.cod_serv_banco) || data.cod_serv_banco == -1 ? null : Number(data.cod_serv_banco);
    const dataSend = {
      cod_moneda: 0,
      nom_moneda: data.nom_moneda,
      simbolo_moneda: data.simbolo_moneda,
      cod_pais: Number(data.pais.value),
      cod_serv_banco: cod_serv_banco,
      es_operativa: data.es_operativa,
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
    const cod_serv_banco = !data?.cod_serv_banco || isNaN(data.cod_serv_banco) || data.cod_serv_banco == -1 ? 0 : Number(data.cod_serv_banco);
    const dataSend = {
      cod_moneda: Number(data.cod_moneda),
      nom_moneda: data.nom_moneda,
      simbolo_moneda: data.simbolo_moneda,
      cod_pais: Number(data.pais.value),
      cod_serv_banco: cod_serv_banco,
      es_operativa: data.es_operativa,
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
      {dataGet && (
        <Grid display="flex" flexDirection="column">
          <FormularioComponent
            inputs={inputs}
            onInput={({ id, val }) => {
              setData((inp) => ({ ...inp, [id]: val }));
            }}
            botones={{
              agregar: { visible: false, onClick: null },
              cancelar: { visible: false, onClick: null },
              guardar: { visible: !readOnlyInput, onClick: handleSubmitUpdate, readonly: readOnlyInput },
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
              // setDataGet({...dataGet, [id]: val});
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

      {/* <Grid display="flex" flexDirection="column">
        <FormularioComponent
          inputs={inputs}
          onInput={({ id, val }) => {
            console.log("input")
            setData((inp) => ({ ...inp, [id]: val }));
          }}
          botones={{
            agregar: { visible: false, onClick: null },
            cancelar: { visible: false, onClick: null },
            guardar: { visible: !readOnlyInput, onClick: handleSubmitUpdate, readonly: readOnlyInput },
            filtrar: { visible: false, onClick: null },
          }}
        />
      </Grid> */}
    </Grid>
  );
};
