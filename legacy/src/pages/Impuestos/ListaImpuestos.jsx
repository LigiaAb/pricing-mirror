import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Icon, CircularProgress, Typography, Grid } from "@mui/material";
import { api } from "../../api";
import { TablaImpuestos } from "../../views/Impuestos/TablaImpuestos";
import { useSelector } from "react-redux";

export const ListaImpuestos = () => {
  const { currentPais, currentEmpresa, currentMenu, currentCategoria } = useSelector((state) => state.menu);
  const { json } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [updateData, setUpdateData] = useState(null);
  const [data, setData] = useState(null);
  const [newBtn, setNewBtn] = useState(false);
  const [accionesDeTabla, setAccionesDeTabla] = useState({
    add: false,
    view: true,
    go: false,
    copy: false,
    paste: false,
    auth: false,
    edit: false,
    excel: false,
    pdf: false,
    download: false,
    delete: true,
  });

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
    const dataApi = await api.get("/api/appweb/lista-impuesto");
    console.log(dataApi.data.data);
    if (dataApi.status !== 200) throw new Error();
    setData(dataAddProperty(formatDate(dataApi.data.data)));
  };

  useEffect(() => {
    getDataApi();
    // checkPermisos();
  }, [updateData]);

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

  function formatDate(data) {
    return data.map((item) => ({
      ...item,
      fecha_inicio_impuesto: new Date(item.fecha_inicio_impuesto).toLocaleDateString("en-GB").replace(/\//g, "-"),
      fecha_fin_impuesto: new Date(item.fecha_fin_impuesto).toLocaleDateString("en-GB").replace(/\//g, "-"),
    }));
  }

  return data ? (
    <Grid sx={{ px: 2, m: 0 }}>
      <Grid>
        <TablaImpuestos reDirect={true} dataApi={data} viewBtn={true} newBtn={newBtn} updateData={updateData} setUpdateData={setUpdateData} />
      </Grid>
    </Grid>
  ) : (
    <Box sx={{ display: "flex", width: "90vw", height: "85vh", justifyContent: "center", alignItems: "center", color: "primary" }}>
      <CircularProgress />
    </Box>
  );
};
