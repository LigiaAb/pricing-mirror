import React, { useState, useEffect, useMemo } from "react";
import { Box, Grid, Typography } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { encryptId } from "../../api/encryptDecrypt";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import { api } from "../../api";
import PropTypes from "prop-types";

export const TablaMonedas = (props) => {
  const { dataApi, paises = [], modalResume, viewBtn, reConsultar } = props;
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [headesRender, setHeadersRender] = useState([
    {
      name: "COD_MONEDA",
      label: "Codigo",
      campo: "cod_moneda",
    },
    {
      name: "NOM_MONEDA",
      label: "Moneda",
      campo: "nom_moneda",
    },
    {
      name: "SIMBOLO_MONEDA",
      label: "Simbolo",
      campo: "simbolo_moneda",
    },
    {
      name: "NOM_PAIS",
      label: "Pais",
      campo: "nom_pais",
    },
    {
      name: "COD_SERV_BANCO",
      label: "Codigo BANGUAT",
      campo: "cod_serv_banco",
    },
  ]);

  const navigate = useNavigate();

  useEffect(() => {
    if (modalResume) {
      setHeadersRender([
        {
          name: "COD_MONEDA",
          label: "Codigo",
          campo: "cod_moneda",
        },
      ]);
    }
  }, []);

  const datosWithPais = useMemo(() => {
    const paisMap = new Map(paises.map((pais) => [pais.cod_pais, pais.nombre_pais]));
    return dataApi.map((item) => ({
      ...item,
      nom_pais: paisMap.get(item.cod_pais) || "0",
    }));
  }, [dataApi, paises]);

  const eliminarFila = (fila) => {
    // console.log("fila", fila.content)
    api.post("/api/appweb/eliminar-moneda", { ...fila.content, cod_estado: 4 }).then((i) => reConsultar());
  };

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        titulo="Monedas"
        id="cod_moneda"
        encabezado={headesRender}
        datos={datosWithPais}
        select={false}
        eventosDeTabla={{
          add: (fila) => {
            if (fila) navigate(`${fila?.content.cod_pais}`);
          },
          view: (fila) => {
            // if (fila) navigate(`${fila?.content.cod_pais}`);
            if (fila) navigate(`${encryptId(fila?.content.cod_moneda)}`);
          },
          go: (fila) => console.log("go", fila),
          copy: (fila) => console.log("copy", fila),
          paste: (fila) => console.log("paste", fila),
          auth: (fila) => console.log("auth", fila),
          edit: (fila) => {
            if (fila) navigate(`${encryptId(fila?.content.cod_moneda)}`);
          },
          excel: (fila) => console.log("excel", fila),
          pdf: (fila) => console.log("pdf", fila),
          download: (fila) => console.log("download", fila),
          delete: (fila) => {
            setMostrarAlerta(true);
            setFilaSeleccionada(fila);
          },
        }}
        botones={
          viewBtn && {
            nuevo: { label: "nuevo", onClick: () => navigate(`${encryptId("new")}`), color: "primary" },
          }
        }
      />
      <ActionAlertComponent
        aceptar={() => {
          eliminarFila(filaSeleccionada);
          setMostrarAlerta(false);
        }}
        cancelar={() => {
          setMostrarAlerta(false);
        }}
        openDialog={mostrarAlerta}
        tipo="error"
        handleClose={() => {}}
        content={"¿Esta seguro que desea eliminar el registro?"}
      />
    </Box>
  );
};

TablaMonedas.propTypes = {
  reConsultar: PropTypes.func,
};
