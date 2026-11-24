import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Icon, CircularProgress, Typography, Grid } from "@mui/material";
import { TablaPaises } from "../../views/Paises/TablaPaises";
import { api } from "../../api";
import { TablaMonedas } from "../../views/Moneda/TablaMonedas";
import { useSelector } from "react-redux";

export const ListaMoneda = () => {
  const { currentPais, currentEmpresa, currentMenu, currentCategoria } = useSelector((state) => state.menu);
  const { json } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const blackPage = () => navigate("/configuracion/organizacion/pais");

  const [data, setData] = useState(null);
  const [paises, setPaises] = useState([]);
  const [accionesDeTabla, setAccionesDeTabla] = useState({
    add: false,
    view: true,
    go: false,
    copy: false,
    paste: false,
    auth: false,
    edit: true,
    excel: false,
    pdf: false,
    download: false,
    delete: true,
  });
  const [newBtn, setNewBtn] = useState(false);

  const checkPermisos = () => {
    const puesto = json?.configuracion.puesto_default;
    const pais = currentPais?.cod_pais;
    const empresa = currentEmpresa?.cod_empresa;
    const permisosPaises = json?.permisos.paises;

    const opciones =
      permisosPaises[pais]["empresas"][empresa]["centrosCosto"][puesto.cod_cc]["modulos"][currentMenu.cod_modulo]["menus"][currentMenu.cod_menu]["categorias"][currentCategoria.cod_categoria][
        "opciones"
      ];

    for (const opcion in opciones) {
      if (opciones[opcion].nom_opcion == "Lista") {
        const acciones = opciones[opcion]["acciones"];
        for (const accion in acciones) {
          if (accion == 1) accionesDeTabla.view = true;
          if (accion == 2) accionesDeTabla.edit = true;
          if (accion == 3) setNewBtn(true);
          // if(accion == 4)
          if (accion == 5) accionesDeTabla.delete = true;
        }
        setAccionesDeTabla({
          ...accionesDeTabla,
        });
      }
    }
  };

  const getDataApi = async () => {
    const dataApi = await api.get("/api/appweb/lista-moneda");
    if (dataApi.status !== 200) throw new Error();
    const dataSetProperties = dataAddProperty(dataApi.data.data);
    editProperties(dataSetProperties, 1001, { add: false, go: false, excel: false, pdf: false, download: false }, "COD_PAIS");
  };

  const getPaisesApi = async () => {
    const dataApi = await api.get("/api/appweb/listapaises");
    if (dataApi.status !== 200) throw new Error();
    setPaises(dataApi.data.data);
  };

  useEffect(() => {
    getDataApi();
    getPaisesApi();
    // checkPermisos();
  }, []);

  const editProperties = (arr, id, newProperties, code) => {
    const array = arr.map((item) => {
      if (item[code] == id) {
        return {
          ...item,
          accionesDeTabla: {
            ...item.accionesDeTabla,
            ...newProperties,
          },
        };
      }
      return item;
    });
    setData(array);
  };

  const dataAddProperty = (arrData) => {
    const dataApi = arrData.map((item) => {
      return {
        ...item,
        accionesDeTabla: accionesDeTabla,
        deleted: false,
      };
    });
    return dataApi;
  };

  return data ? (
    <Grid sx={{ px: 2, m: 0 }}>
      <Grid>
        <TablaMonedas reDirect={true} dataApi={data} paises={paises} viewBtn={true} reConsultar={getDataApi} />
      </Grid>
    </Grid>
  ) : (
    <Box sx={{ display: "flex", width: "90vw", height: "85vh", justifyContent: "center", alignItems: "center", color: "primary" }}>
      <CircularProgress />
    </Box>
  );
};
