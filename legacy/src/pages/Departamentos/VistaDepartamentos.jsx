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
import { FormularioDepartamento } from "../../views/Departamento/FormularioDepartamento";

export const VistaDepartamentos = (props) => {
  const { currentCategoria } = useSelector((state) => state.menu);
  const { currentPais, vistaId, updateData, setUpdateData } = props;

  let location = useLocation();
  const [data, setData] = useState(null);
  const [city, setCity] = useState(null);
  const [estados, setEstados] = useState(null);
  const [newDepto, setNewDepto] = useState(false);
  const [enableBtn, setEnableBtn] = useState(true);
  const [readOnlyInput, setReadOnlyInput] = useState(false);
  const navigate = useNavigate();

  let { encryptedId } = useParams();
  let id = vistaId ? decryptId(vistaId) : encryptedId ? decryptId(encryptedId) : -1;

  const dispatch = useDispatch();

  useEffect(() => {
    if (id === "new") {
      setNewDepto(true);
    } else {
      setNewDepto(false);
    }

    api.get("api/appweb/lista-depto-x-pais").then((res) => {
      console.log("here", res.data.data);
      const depto = res.data.data.find((item) => {
        return item.cod_depto == id;
      });
      setData({
        cod_depto: depto.cod_depto,
        nombre_depto: depto.nombre_depto,
        num_depto: depto.num_depto,
        pais: { label: depto.nombre_pais, value: depto.cod_pais },
        estado: { label: depto.estado_desc, value: depto.cod_estado },
      });
    });
  }, [city, updateData]);

  return (
    <Box sx={{ px: 2, m: 0 }}>
      <Grid container columns={{ xs: 4, md: 8 }}>
        <Grid size="grow">
          <Typography m={0} p={0} variant="h4">
            {data && "cod_depto" in data ? `Departamento: ${data.nombre_depto}` : "NUEVO DEPARTAMENTO"}
          </Typography>
        </Grid>
      </Grid>

      {!newDepto && (
        <Box sx={{ p: 1, m: 0 }}>
          <FormularioDepartamento
            dataGet={data}
            estados={estados}
            // dataCountry={paises}
            currentPais={currentPais}
            setUpdateData={setUpdateData}
            updateData={updateData}
            setEnableBtn={setEnableBtn}
            enableBtn={enableBtn}
            readOnlyInput={readOnlyInput}
          />
        </Box>
      )}

      {newDepto && (
        <Box sx={{ p: 1, m: 0 }}>
          <FormularioDepartamento
            dataGet={null}
            estados={estados}
            // dataCountry={paises}
            currentPais={currentPais}
            setUpdateData={setUpdateData}
            updateData={updateData}
            setEnableBtn={setEnableBtn}
            enableBtn={enableBtn}
            readOnlyInput={readOnlyInput}
          />
        </Box>
      )}
    </Box>
  );
};
