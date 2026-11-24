import React, { useEffect, useState, useMemo, useCallback } from "react";
import TabComponent from "../../components/Tabs/TabComponent";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, Grid, Button, Icon, CircularProgress } from "@mui/material";
import { useParams } from "react-router-dom";
import { FormularioCompletoPaises } from "../../views/Paises/FormularioCompletoPaises";
// import { ModalPaises } from "./ModalPaises";
import { api } from "../../api";
import { decryptId } from "../../api/encryptDecrypt";
import { useSelector } from "react-redux";
import { TablaPaisMoneda } from "../../views/PaisMoneda/TablaPaisMoneda";
import { TablaPaisImpuestos } from "../../views/PaisImpuestos/TablaPaisImpuestos";
import { TablaPaisCiudades } from "../../views/PaisCiudades/TablaPaisCiudades";
import { FormularioCiudad } from "../../views/Ciudad/FormularioCiudad";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import { useDispatch } from "react-redux";

export const VistaCiudades = (props) => {
  const { currentPais, currentEmpresa, currentMenu, currentCategoria } = useSelector((state) => state.menu);
  const { json } = useSelector((state) => state.auth);

  const { vistaId, updateData, setUpdateData } = props;

  let location = useLocation();
  const [data, setData] = useState(null);
  const [city, setCity] = useState(null);

  const [estados, setEstados] = useState(null);
  const [paises, setPaises] = useState(null);

  const [newCity, setNewCity] = useState(false);
  // const [updateData, setUpdateData] = useState(false);
  const [enableBtn, setEnableBtn] = useState(false);
  const [readOnlyInput, setReadOnlyInput] = useState(false);
  const navigate = useNavigate();

  let { encryptedId } = useParams();
  let id = vistaId ? decryptId(vistaId) : encryptedId ? decryptId(encryptedId) : -1;

  useEffect(() => {
    api.get("api/appweb/listaestados").then((res) => {
      setEstados(res.data.data);
    });
    api.get("api/appweb/listapaises").then((res) => {
      setPaises(res.data.data);
    });

    if (id === "new") {
      setNewCity(true);
    } else {
      setNewCity(false);
    }

    api.get("api/appweb/lista-ciudad").then((res) => {
      const city = res.data.data.find((item) => {
        return item.cod_ciudad == id;
      });
      setData({
        cod_ciudad: city.cod_ciudad,
        nombre_ciudad: city.nombre_ciudad,
        siglas_ciudad: city.siglas_ciudad,
        pais: { label: city.nombre_pais, value: city.cod_pais },
        estado: { label: city.estado_desc, value: city.cod_estado },
      });
    });

    setEnableBtn(false);
  }, [city, updateData]);

  return (
    <Box sx={{ px: 2, m: 0 }}>
      {/* Boton para regresar a la lista */}

      {/* <Button color="primary" onClick={() => navigate(-1)}>
        <Icon className="c-derecha-arriba-izquierda" />
        Regresar
      </Button> */}

      <Grid container columns={{ xs: 4, md: 8 }}>
        <Grid size="grow">
          <Typography m={0} p={0} variant="h4">
            {data && "nombre_ciudad" in data ? `Ciudad: ${data.nombre_ciudad}` : "NUEVA CIUDAD"}
          </Typography>
        </Grid>
      </Grid>

      {!newCity && (
        <Box sx={{ p: 1, m: 0 }}>
          <FormularioCiudad
            dataGet={data}
            estados={estados}
            dataCountry={paises}
            setUpdateData={setUpdateData}
            updateData={updateData}
            setEnableBtn={setEnableBtn}
            enableBtn={enableBtn}
            readOnlyInput={readOnlyInput}
            currentPais={currentPais}
          />
        </Box>
      )}

      {newCity && (
        <Box sx={{ p: 1, m: 0 }}>
          <FormularioCiudad
            dataGet={null}
            estados={estados}
            dataCountry={paises}
            setUpdateData={setUpdateData}
            updateData={updateData}
            setEnableBtn={setEnableBtn}
            enableBtn={enableBtn}
            readOnlyInput={readOnlyInput}
            currentPais={currentPais}
          />
        </Box>
      )}
    </Box>
  );
};
