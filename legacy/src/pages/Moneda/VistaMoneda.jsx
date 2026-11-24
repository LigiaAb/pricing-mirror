import React, { useEffect, useState, useMemo } from "react";
import TabComponent from "../../components/Tabs/TabComponent";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, Grid, Button, Icon, CircularProgress } from "@mui/material";
import { useParams } from "react-router-dom";
import { FormularioCompletoPaises } from "../../views/Paises/FormularioCompletoPaises";
// import { ModalPaises } from "./ModalPaises";
import { api } from "../../api";
import { decryptId } from "../../api/encryptDecrypt";
import { useSelector } from "react-redux";
import { FormularioMoneda } from "../../views/Moneda/FormularioMoneda";
import { FormularioMoneda2 } from "../../views/Moneda/FormularioMoneda2";
// import { ListaTipoCambio } from "../ListaTipoCambio/ListaTipoCambio";
import ListaTipoCambio from "../ListaTipoCambio/ListaTipoCambio";

export const VistaMoneda = (props) => {
  const { currentPais, currentEmpresa, currentMenu, currentCategoria } = useSelector((state) => state.menu);
  const { json } = useSelector((state) => state.auth);

  const { dataGet, newMonedaProp = false, updateData, setUpdateData } = props;

  let location = useLocation();
  const [data, setData] = useState(null);

  const [paises, setPaises] = useState(null);

  const [monedas, setMonedas] = useState(null);
  const [country, setCountry] = useState(null);
  const [newMoneda, setNewMoneda] = useState(false);
  // const [updateData, setUpdateData] = useState(false);
  const [enableBtn, setEnableBtn] = useState(false);
  const [readOnlyInput, setReadOnlyInput] = useState(true);

  const [newBtn, setNewBtn] = useState(false);
  const [accionesDeTabla, setAccionesDeTabla] = useState({
    add: true,
    view: false,
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

  const navigate = useNavigate();

  let { encryptedId } = useParams();
  let id = dataGet ? dataGet.cod_moneda : encryptedId ? decryptId(encryptedId) : -1;

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
      console.log(opciones[opcion].nom_opcion);
      if (opciones[opcion].nom_opcion == "Información") {
        const acciones = opciones[opcion]["acciones"];
        console.log(acciones);

        for (const accion in acciones) {
          if (accion == 1) accionesDeTabla.view = true;
          if (accion == 2) {
            setReadOnlyInput(false);
            // setEnableBtn(true)
            accionesDeTabla.edit = true;
          }
          if (accion == 3) setNewBtn(false);
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
    const fetchData = async () => {
      if (id === "new" || newMonedaProp) {
        setNewMoneda(true);
        return null;
      } else {
        setNewMoneda(false);
      }

      await api.get("/api/appweb/listapaises").then(async (res) => {
        const paises = res.data.data;
        const monedas = await api.get("api/appweb/lista-moneda");

        const moneda = monedas.data.data.find((item) => {
          return item.cod_moneda == id;
        });

        console.log(moneda);

        const pais = paises.find((item) => item.cod_pais === moneda.cod_pais);
        setPaises(paises);
        setMonedas(monedas.data.data);
        setData({
          cod_moneda: moneda.cod_moneda,
          nom_moneda: moneda.nom_moneda,
          simbolo_moneda: moneda.simbolo_moneda,
          pais: { label: pais.nombre_pais, value: pais.cod_pais },
          cod_serv_banco: moneda.cod_serv_banco,
          es_operativa: moneda.es_operativa,
        });
      });

      // await api.get("api/appweb/lista-moneda").then((res) => {

      //   setMonedas(res.data.data)

      //   const moneda = res.data.data.find((item) => {
      //       return item.cod_moneda == id;
      //   });

      //   setData({
      //       cod_moneda: moneda.cod_moneda,
      //       nom_moneda: moneda.nom_moneda,
      //       simbolo_moneda: moneda.simbolo_moneda,
      //       cod_pais: moneda.cod_pais,
      //       cod_serv_banco: moneda.cod_serv_banco
      //   })
      // })
    };

    const fetchPaises = async () => {
      await api.get("/api/appweb/listapaises").then((res) => {
        setPaises(res.data.data);
      });
    };

    // const fetchAllData = async () => {
    //     try {
    //         const [result1, result2] = await Promise.all([fetchData(), fetchPaises()]);
    //         console.log(result1, result2, id)
    //         setData(result1); // Set state for the first function result
    //         setPaises(result2); // Set state for the second function result
    //     } catch (error) {
    //         console.error("Error fetching data:", error);
    //     }
    // };

    // setData(fetchData())
    // setPaises(fetchPaises())

    // fetchAllData();

    fetchData();
    fetchPaises();
    // checkPermisos();
  }, [country, updateData]);

  return (
    <Box sx={{ px: 2, m: 0 }}>
      {/* Boton para regresar a la lista */}
      {!dataGet && !newMonedaProp && (
        <Button color="primary" onClick={() => navigate("../")}>
          <Icon className="c-derecha-arriba-izquierda" />
          Regresar a la lista
        </Button>
      )}

      <Grid container columns={{ xs: 4, md: 8 }}>
        <Grid size="grow">
          <Typography m={0} p={0} variant="h4">
            {!newMoneda ? `Moneda: ${data?.nom_moneda}` : "NUEVA MONEDA"}
          </Typography>
        </Grid>
      </Grid>

      {!newMoneda && !dataGet && !newMonedaProp && (
        <TabComponent
          opciones={[
            {
              id: 1,
              label: "Informacion",
              content: (
                <Box sx={{ p: 1, m: 0 }}>
                  <FormularioMoneda2
                    readOnly={false}
                    dataGet={data}
                    paises={paises}
                    enableBtn={enableBtn}
                    readOnlyInput={readOnlyInput}
                    updateData={updateData}
                    setUpdateData={setUpdateData}
                    setDataGet={setData}
                  />
                </Box>
              ),
            },
            {
              id: 2,
              label: "Tipos de Cambio",
              content: (
                <Box sx={{ p: 0, m: 0 }}>
                  <ListaTipoCambio monedas={monedas} />
                </Box>
              ),
            },
          ]}
        />
      )}
      {newMoneda && !dataGet && !newMonedaProp && (
        <FormularioMoneda2
          readOnly={false}
          dataGet={null}
          paises={paises}
          enableBtn={enableBtn}
          readOnlyInput={readOnlyInput}
          updateData={updateData}
          setUpdateData={setUpdateData}
          setDataGet={setData}
        />
      )}

      {dataGet && (
        <FormularioMoneda2
          readOnly={false}
          dataGet={data}
          paises={paises}
          enableBtn={enableBtn}
          readOnlyInput={readOnlyInput}
          updateData={updateData}
          setUpdateData={setUpdateData}
          setDataGet={setData}
        />
      )}

      {newMonedaProp && (
        <FormularioMoneda2
          readOnly={false}
          dataGet={null}
          paises={paises}
          enableBtn={enableBtn}
          readOnlyInput={readOnlyInput}
          updateData={updateData}
          setUpdateData={setUpdateData}
          setDataGet={setData}
        />
      )}
    </Box>
  );
};
