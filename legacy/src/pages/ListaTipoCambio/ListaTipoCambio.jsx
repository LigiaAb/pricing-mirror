import React, { useCallback, useEffect, useMemo, useState } from "react";
import TablaDocumentacion from "../../views/Documentacion/TablaDocumentacion";
import { Box, /* Grid, */ Typography } from "@mui/material";
import { api } from "../../api";
import { useParams } from "react-router-dom";
import { decryptId } from "../../api/encryptDecrypt";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useDispatch } from "react-redux";
import { TablaTipoCambio } from "../../views/TipoCambio/TablaTipoCambio";

const ListaTipoCambio = (props) => {
  const { monedas } = props;

  let { encryptedId } = useParams();
  let id = encryptedId ? decryptId(encryptedId) : -1;

  const dispatch = useDispatch();
  const [tipos, setTipos] = useState([]);
  const [valores, setValores] = useState({ value: 0, label: "" });
  const [tasas, setTasas] = useState([]);
  // const [paises, setPaises] = useState([]);
  

  useEffect(() => {
    api.get("/api/appweb/lista-tipo-cambio", {
      params: {
        cod_pais_origen: id,
        historico: true,
        cod_pais_destino: valores ? valores.value : null
      }
    }).then((res) => {  
      setTasas(res.data.data)
    });

  }, [valores]);

  const monedas_ = useMemo(() => 
    monedas
      ?.filter(item => item.cod_moneda != id)
      .map(item => ({
          value: item.cod_moneda.toString(),
          label: item.nom_moneda
      })), 
      [monedas]
  );

  const inputs = useMemo(
    () => [
      {
        tipo: "select",
        label: "Filtro",
        id: "filtro",
        val: { 
          label: valores ? valores?.label : "", 
          value: valores ? valores?.value : -1 
        },
        options: monedas_,
      },
    ],
    [valores, tipos]
  );


  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* FILTRO DE DATOS */}
      <Box sx={{ p: 1, m: 0, my: 0 }}>
        <FormularioComponent
          inputs={inputs}
          onInput={({ id, val }) => {
            setValores(val)
          }}
          botones={{ agregar: { visible: false } }}
        />
      </Box>

      <TablaTipoCambio dataApi={tasas} />
    </Box>
  );
};

export default ListaTipoCambio;
