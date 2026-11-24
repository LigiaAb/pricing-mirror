import React, { useCallback, useEffect, useMemo, useState } from "react";
import TabComponent from "../../components/Tabs/TabComponent";
import { Box, Typography, Grid, Button, Icon, CircularProgress } from "@mui/material";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FormularioCompletoEmpresa } from "../../views/Empresa/FormularioCompletoEmpresa";
import { FormularioCompletoPaises } from "../../views/Paises/FormularioCompletoPaises";
import { ModalEmpresa } from "./ModalEmpresa";
import { api } from "../../api";
import ListaCentroCosto from "../CentroCosto/ListaCentroCosto";
import TablaCentroCosto from "../../views/CentroCosto/TablaCentroCosto";

export const VistaEmpresa = () => {
  let { emp, country } = useParams();
  let location = useLocation();
  const [data, setData] = useState(null);
  const [dataCountry, setDataCountry] = useState(null);
  const [updateData, setUpdateData] = useState(false);
  const [enableBtn, setEnableBtn] = useState(false);
  const [readOnlyInput, setReadOnlyInput] = useState(false);
  const navigate = useNavigate();
  const [newCompany, setNewCompany] = useState(false);
  const [centrosCosto, setCentrosCosto] = useState([]);

  useEffect(() => {
    api.get("/api/appweb/listaempresas").then((res) => setData(res.data.data));
    api.get("/api/appweb/listapaises").then((res) => setDataCountry(res.data.data));
  }, [emp, country, updateData]);

  useEffect(() => {
    if (location.pathname.includes("new")) {
      setNewCompany(true);
    } else {
      setNewCompany(false);
    }
    if (location.pathname.includes("edit")) {
      setEnableBtn(true);
    } else {
      setEnableBtn(false);
    }
    if (location.pathname.includes("view")) {
      setReadOnlyInput(true);
    } else {
      setReadOnlyInput(false);
    }
  }, [emp, country]);

  const searchItem = useMemo(() => {
    if (emp && data)
      return data.find((item) => {
        return item.cod_empresa == emp;
      });
  }, [data, emp]);

  const searchCountry = useMemo(() => {
    if (country && dataCountry)
      return dataCountry.find((item) => {
        return item.cod_pais == country;
      });
  }, [dataCountry, country]);

  const countriesValues = useMemo(() => {
    if (dataCountry)
      return dataCountry.map((item) => {
        return {
          label: item.nombre_pais,
          value: item.cod_pais.toString(),
        };
      });
  }, [dataCountry]);

  const obtenerDatos = useCallback(async () => {
    await api
      .get("api/appweb/lista-rol")
      .then(({ data }) => setCentrosCosto(data.data))
      .catch((e) => console.error(e));
  }, []);

  const blackPage = () => navigate("configuracion/organizacion/empresa");

  return data ? (
    <Box sx={{ p: 1, m: 0 }}>
      <Grid container direction="column" columns={{ xs: 4, md: 8 }} margin={2}>
        <Grid size="grow">
          <Button color="primary" onClick={blackPage}>
            <Icon className="c-derecha-arriba-izquierda" />
            Regresar a la lista
          </Button>
        </Grid>
        <Grid size="grow">
          <Typography variant="h6">{searchItem ? searchItem.NOMBRE_EMP : "NUEVA EMPRESA"}</Typography>
        </Grid>
      </Grid>
      {!newCompany && countriesValues && (
        <TabComponent
          opciones={[
            {
              id: 1,
              label: "Informacion",
              content: (
                <Box sx={{ p: 1, m: 0 }}>
                  <FormularioCompletoEmpresa
                    dataGet={searchItem}
                    dataCountry={countriesValues}
                    currentCountry={searchCountry}
                    setUpdateData={setUpdateData}
                    updateData={updateData}
                    enableBtn={enableBtn}
                    readOnlyInput={readOnlyInput}
                    setEnableBtn={setEnableBtn}
                  />
                </Box>
              ),
            },
            {
              id: 2,
              label: "Informacion de paises",
              content: (
                <Box sx={{ p: 1, m: 0 }}>
                  <FormularioCompletoPaises readOnly={true} dataGet={searchCountry} readOnlyInput={true} />
                </Box>
              ),
            },
            {
              id: 3,
              label: "Centros de Costo",
              content: (
                <Box sx={{ p: 1, m: 0 }}>
                  <TablaCentroCosto dataApi={centrosCosto} />
                </Box>
              ),
            },
            {
              id: 4,
              label: "Modal",
              content: (
                <Box sx={{ p: 1, m: 0 }}>
                  <ModalEmpresa data={data} idCountry={country} setUpdateData={setUpdateData} updateData={updateData} />
                </Box>
              ),
            },
          ]}
        />
      )}
      {newCompany && countriesValues && (
        <TabComponent
          opciones={[
            {
              id: 1,
              label: "Nueva empresa",
              content: (
                <Box sx={{ p: 1, m: 0 }}>
                  <FormularioCompletoEmpresa dataGet={searchItem} dataCountry={countriesValues} />
                </Box>
              ),
            },
          ]}
        />
      )}
    </Box>
  ) : (
    <Box sx={{ display: "flex", width: "90vw", height: "85vh", justifyContent: "center", alignItems: "center", color: "primary" }}>
      <CircularProgress />
    </Box>
  );
};
