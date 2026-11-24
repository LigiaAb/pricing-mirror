import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, Grid, Button, Icon, CircularProgress } from "@mui/material";
import { useParams } from "react-router-dom";
import { api } from "../../api";
import { decryptId } from "../../api/encryptDecrypt";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { FormularioMunicipio } from "../../views/Municipio/FormularioMunicipio";

export const VistaMunicipios = (props) => {
  const { currentCategoria } = useSelector((state) => state.menu);
  const { currentPais, vistaId, updateData, setUpdateData } = props;

  let location = useLocation();
  const [data, setData] = useState(null);
  const [initialData, setInitialData] = useState(null);
  const [city, setCity] = useState(null);

  const [estados, setEstados] = useState(null);
  const [paises, setPaises] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);

  const [newDepto, setNewDepto] = useState(false);
  const [enableBtn, setEnableBtn] = useState(true);
  const [inGeo, setInGeo] = useState(false);
  const [readOnlyInput, setReadOnlyInput] = useState(false);
  const [tab, setTab] = useState(1);
  const navigate = useNavigate();

  // let { encryptedId } = useParams();
  // let id = encryptedId ? decryptId(encryptedId) : -1;
  let { encryptedId } = useParams();
  let id = vistaId ? decryptId(vistaId) : encryptedId ? decryptId(encryptedId) : -1;

  const dispatch = useDispatch();

  useEffect(() => {
    let departamentos2 = [];

    api.get("api/appweb/listaestados").then((res) => {
      setEstados(res.data.data);
    });
    api.get("api/appweb/listapaises").then((res) => {
      departamentos2 = res.data.data;
      setPaises(res.data.data);
    });
    api.get("/api/appweb/lista-depto-x-pais").then((res) => {
      setDepartamentos(res.data.data);
    });
    setEnableBtn(false);

    if (id === "new") {
      setNewDepto(true);
      setData(null);
      return;
    } else {
      setNewDepto(false);
    }

    api.get("api/appweb/lista-municipios").then((res) => {
      const municipio = res.data.data.find((item) => {
        return item.cod_muni == id;
      });

      setData({
        cod_muni: municipio.cod_muni,
        nombre_muni: municipio.nombre_muni,
        departamento: { label: municipio.nombre_depto, value: municipio.cod_depto },
        estado: { label: municipio.estado_desc, value: municipio.cod_estado },
        // pais: pais ? { label: pais.nombre_pais, value: pais.cod_pais } : {label: "", value: -1},
        pais: { label: "", value: -1 },
      });
    });
  }, [city, updateData]);

  return (
    <Box sx={{ px: 2, m: 0 }}>
      {/* Boton para regresar a la lista */}

      {/* <Button color="primary" onClick={() => navigate(-1)}>
        <Icon className="c-derecha-arriba-izquierda" />
        Regresar a la lista
      </Button> */}

      <Grid container columns={{ xs: 4, md: 8 }}>
        <Grid size="grow">
          <Typography m={0} p={0} variant="h4">
            {data && "cod_muni" in data ? `Municipio: ${data.nombre_muni}` : "NUEVO MUNICIPIO"}
          </Typography>
        </Grid>
      </Grid>

      {!newDepto && (
        <Box sx={{ p: 1, m: 0 }}>
          <FormularioMunicipio
            dataGet={data}
            estados={estados}
            paises={paises}
            departamentos={departamentos}
            enableBtn={enableBtn}
            readOnlyInput={readOnlyInput}
            setUpdateData={setUpdateData}
            updateData={updateData}
            currentPais={currentPais}
          />
        </Box>
      )}

      {newDepto && (
        <Box sx={{ p: 1, m: 0 }}>
          <FormularioMunicipio
            dataGet={null}
            estados={estados}
            paises={paises}
            departamentos={departamentos}
            enableBtn={enableBtn}
            readOnlyInput={readOnlyInput}
            setUpdateData={setUpdateData}
            updateData={updateData}
            currentPais={currentPais}
          />
        </Box>
      )}
    </Box>
  );
};
