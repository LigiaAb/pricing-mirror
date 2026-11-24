import React, { useEffect, useState, useMemo } from "react";
import TabComponent from "../../components/Tabs/TabComponent";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, Grid, Button, Icon, CircularProgress } from "@mui/material";
import { useParams } from "react-router-dom";
import { api } from "../../api";
import { decryptId } from "../../api/encryptDecrypt";
import { useSelector } from "react-redux";
import { FormularioImpuestos } from "../../views/Impuestos/FormularioImpuestos";
import { TablaImpuestosPais } from "../../views/Impuestos/TablaImpuestosPais";

export const VistaImpuestos = (props) => {
  // const { dataGet, newImpuestoProp = false, updateData, setUpdateData } = props;
  const { currentPais, currentEmpresa, currentMenu, currentCategoria } = useSelector((state) => state.menu);
  const { json } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [dataPaises, setDataPaises] = useState([]);
  const [paises, setPaises] = useState(null);
  const [estados, setEstados] = useState(null);
  const [newImpuesto, setNewImpuesto] = useState(false);
  const [updateData, setUpdateData] = useState(false);
  const [enableBtn, setEnableBtn] = useState(false);
  const [readOnlyInput, setReadOnlyInput] = useState(true);

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

  let { encryptedId } = useParams();
  let id = encryptedId ? decryptId(encryptedId) : -1;

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
      console.log(opciones[opcion]);
      if (opciones[opcion].nom_opcion == "Información") {
        const acciones = opciones[opcion]["acciones"];
        for (const accion in acciones) {
          // if(accion == 1) accionesDeTabla.view = true
          if (accion == 2) {
            setReadOnlyInput(false);
            accionesDeTabla.edit = true;
          }
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

  useEffect(() => {
    if (id === "new") {
      setNewImpuesto(true);
    } else {
      setNewImpuesto(false);
    }

    api.get("/api/appweb/listapaises").then((res) => {
      setPaises(res.data.data);
    });
    api.get("/api/appweb/listaestados").then((res) => {
      setEstados(res.data.data);
    });

    setEnableBtn(true);
    api.get("/api/appweb/lista-impuesto").then((res) => {
      const impuesto = res.data.data.find((item) => {
        return item.cod_impuesto == id;
      });
      setData({
        cod_impuesto: impuesto.cod_impuesto,
        nom_impuesto: impuesto.nom_impuesto,
      });
    });

    api
      .get("/api/appweb/lista-impuesto-x-pais", {
        params: {
          cod_impuesto: id,
        },
      })
      .then((res) => {
        console.log("impuestos", res.data.data);
        setDataPaises(dataAddProperty(formatDates(res.data.data)));
      });

    // checkPermisos();
  }, [updateData]);

  function formatDates(data) {
    return data.map((item) => ({
      ...item,
      fecha_inicio_impuesto: new Date(item.fecha_inicio_impuesto).toLocaleDateString("en-GB").replace(/\//g, "-"),
      fecha_fin_impuesto: new Date(item.fecha_fin_impuesto).toLocaleDateString("en-GB").replace(/\//g, "-"),
    }));
  }

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

  return (
    <Box sx={{ px: 2, m: 0 }}>
      {/* Boton para regresar a la lista */}

      <Button color="primary" onClick={() => navigate("../")}>
        <Icon className="c-derecha-arriba-izquierda" />
        Regresar a la lista
      </Button>

      <Grid container columns={{ xs: 4, md: 8 }}>
        <Grid size="grow">
          <Typography m={0} p={0} variant="h4">
            {data ? `Impuesto: ${data.nom_impuesto}` : "NUEVO IMPUESTO"}
          </Typography>
        </Grid>
      </Grid>

      {!newImpuesto && (
        <TabComponent
          opciones={[
            {
              id: 1,
              label: "Informacion",
              content: (
                <Box sx={{ p: 1, m: 0 }}>
                  <FormularioImpuestos readOnly={readOnlyInput} dataGet={data} enableBtn={enableBtn} readOnlyInput={readOnlyInput} updateData={updateData} setUpdateData={setUpdateData} />
                </Box>
              ),
            },
            {
              id: 2,
              label: "Paises Aplicados",
              content: (
                <Box sx={{ p: 1, m: 0 }}>
                  {/* <Box sx={{ p: 1, m: 0, my: 0 }}>
                      
                    </Box> */}

                  <TablaImpuestosPais
                    readOnly={false}
                    dataApi={dataPaises}
                    paises={paises}
                    estados={estados}
                    enableBtn={enableBtn}
                    newBtn={newBtn}
                    readOnlyInput={readOnlyInput}
                    updateData={updateData}
                    setUpdateData={setUpdateData}
                  />
                </Box>
              ),
            },
          ]}
        />
      )}
      {newImpuesto && (
        <TabComponent
          opciones={[
            {
              id: 1,
              label: "Nueva moneda",
              content: (
                <Box sx={{ p: 1, m: 0 }}>
                  <FormularioImpuestos readOnly={false} dataGet={null} enableBtn={enableBtn} readOnlyInput={readOnlyInput} />
                </Box>
              ),
            },
          ]}
        />
      )}
    </Box>
  );
};
