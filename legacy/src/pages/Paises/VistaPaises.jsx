import React, { useEffect, useState, useMemo } from "react";
import TabComponent from "../../components/Tabs/TabComponent";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, Grid, Button, Icon, CircularProgress } from "@mui/material";
import { useParams } from "react-router-dom";
import { FormularioCompletoPaises } from "../../views/Paises/FormularioCompletoPaises";
import { ModalPaises } from "./ModalPaises";
import { api } from "../../api";
import { decryptId } from "../../api/encryptDecrypt";
import { useSelector } from "react-redux";
import { TablaPaisMoneda } from "../../views/PaisMoneda/TablaPaisMoneda";
import { TablaPaisImpuestos } from "../../views/PaisImpuestos/TablaPaisImpuestos";
import { TablaPaisCiudades } from "../../views/PaisCiudades/TablaPaisCiudades";
import { TablaPaisDepartamentos } from "../../views/PaisDepartamentos/TablaPaisDepartamentos";
import { TablaPaisMunicipios } from "../../views/PaisMunicipios/TablaPaisMunicipios";

export const VistaPaises = () => {
  const { currentPais, currentEmpresa, currentMenu, currentCategoria } = useSelector((state) => state.menu);
  const { json } = useSelector((state) => state.auth);

  let location = useLocation();
  const [data, setData] = useState(null);
  const [monedas, setMonedas] = useState(null);
  const [impuestos, setImpuestos] = useState(null);
  const [ciudades, setCiudades] = useState(null);
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [estados, setEstados] = useState([]);
  const [impuestos2, setImpuestos2] = useState([]);
  const [country, setCountry] = useState(null);
  const [newCountry, setNewCountry] = useState(false);
  const [updateData, setUpdateData] = useState(false);
  const [enableBtn, setEnableBtn] = useState(false);
  const [inGeo, setInGeo] = useState(false);
  const [readOnlyInput, setReadOnlyInput] = useState(true);
  const [tab, setTab] = useState(1);
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

  const navigate = useNavigate();

  let { encryptedId } = useParams();
  let id = decryptId(encryptedId);

  const checkPermisos = () => {
    // const puesto = json?.configuracion.puesto_default;
    // const pais = currentPais?.cod_pais;
    // const empresa = currentEmpresa?.cod_empresa
    // const permisosPaises = json?.permisos.paises;
    // const opciones = permisosPaises[pais]["empresas"][empresa]["centrosCosto"]
    //     [puesto.cod_cc]["modulos"][currentMenu.cod_modulo]["menus"][currentMenu.cod_menu]
    //       ["categorias"][currentCategoria.cod_categoria]["opciones"]
    // for (const opcion in opciones){
    //   console.log(opciones[opcion])
    //   if(opciones[opcion].nom_opcion == "Información"){
    //     const acciones = opciones[opcion]["acciones"]
    //     for (const accion in acciones){
    //       if(accion == 1) accionesDeTabla.view = true
    //       if(accion == 2) {
    //         setReadOnlyInput(false)
    //         accionesDeTabla.edit = true
    //       }
    //       if(accion == 3) {
    //         setNewBtn(true)
    //       }
    //       // if(accion == 4)
    //       if(accion == 5) accionesDeTabla.delete = true
    //     }
    //     setAccionesDeTabla({
    //       ...accionesDeTabla
    //     })
    //   }
    // }
  };

  useEffect(() => {
    api.get("/api/appweb/listapaises").then((res) => {
      setData(res.data.data);
    });

    api.get("/api/appweb/listaestados").then((res) => {
      setEstados(res.data.data);
    });

    api.get("/api/appweb/lista-impuesto").then((res) => {
      setImpuestos2(res.data.data);
    });

    api.get("/api/appweb/lista-moneda").then((res) => {
      setMonedas(dataAddProperty2(res.data.data.filter((item) => item.cod_pais == id)));
    });

    api.get("/api/appweb/lista-impuesto-x-pais").then((res) => {
      setImpuestos(dataAddProperty(res.data.data.filter((item) => item.cod_pais == id)));
    });

    api.get("/api/appweb/lista-ciudad").then((res) => {
      setCiudades(dataAddProperty2(res.data.data.filter((item) => item.cod_pais == id)));
    });

    api.get("/api/appweb/lista-depto-x-pais").then((res) => {
      setDepartamentos(dataAddProperty2(res.data.data.filter((item) => item.cod_pais == id)));
    });

    api.get("/api/appweb/lista-municipios").then((res) => {
      setMunicipios(dataAddProperty2(res.data.data));
    });

    console.log("json", json);

    if (id === "new") {
      setNewCountry(true);
    } else {
      setNewCountry(false);
    }
    if (currentMenu?.nom_menu == "Localización") {
      setInGeo(true);
    } else {
      setInGeo(false);
    }

    // checkPermisos()
  }, [country, updateData]);

  const searchItem = useMemo(() => {
    if (id && data)
      return data.find((item) => {
        return item.cod_pais == id;
      });
  }, [data]);

  const municipios_filtered = useMemo(() => {
    const deptoMap = new Map(
      departamentos.map((item) => [
        item.cod_depto,
        {
          cod_pais: item.cod_pais,
          nombre_pais: item.nombre_pais,
        },
      ])
    );

    return municipios
      .filter((item) => deptoMap.has(item.cod_depto))
      .map((item) => ({
        ...item,
        cod_pais: deptoMap.get(item.cod_depto).cod_pais,
        nombre_pais: deptoMap.get(item.cod_depto).nombre_pais,
      }));
  }, [departamentos, municipios]);

  console.log(municipios_filtered);

  const dataAddProperty = (arrData) => {
    const dataApi = arrData.map((item) => {
      return {
        ...item,
        accionesDeTabla: {
          ...accionesDeTabla,
          edit: false,
          view: false,
        },
        deleted: false,
      };
    });
    return dataApi;
  };

  const dataAddProperty2 = (arrData) => {
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
    <Box sx={{ px: 2, m: 0 }}>
      {/* Boton para regresar a la lista */}

      <Button color="primary" onClick={() => navigate("../")}>
        <Icon className="c-derecha-arriba-izquierda" />
        Regresar a la lista
      </Button>

      <Grid container columns={{ xs: 4, md: 8 }}>
        <Grid size="grow">
          <Typography m={0} p={0} variant="h4">
            {searchItem ? `Pais: ${searchItem.nombre_pais}` : "NUEVO PAÍS"}
          </Typography>
        </Grid>
      </Grid>

      {!newCountry && (
        <TabComponent
          opciones={
            inGeo
              ? [
                  {
                    id: 1,
                    label: "Informacion",
                    content: (
                      <Box sx={{ p: 1, m: 0 }}>
                        <FormularioCompletoPaises
                          readOnly={false}
                          dataGet={searchItem}
                          setUpdateData={setUpdateData}
                          updateData={updateData}
                          enableBtn={enableBtn}
                          readOnlyInput={false}
                          setEnableBtn={setEnableBtn}
                        />
                      </Box>
                    ),
                  },
                  {
                    id: 2,
                    label: "Moneda",
                    content: (
                      <Box sx={{ p: 1, m: 0 }}>
                        <TablaPaisMoneda reDirect={true} dataApi={monedas} viewBtn={true} newBtn={true} updateData={updateData} setUpdateData={setUpdateData} />
                      </Box>
                    ),
                  },
                  {
                    id: 3,
                    label: "Impuestos",
                    content: (
                      <Box sx={{ p: 1, m: 0 }}>
                        <TablaPaisImpuestos
                          reDirect={true}
                          dataApi={impuestos}
                          viewBtn={true}
                          newBtn={true}
                          updateData={updateData}
                          setUpdateData={setUpdateData}
                          estados={estados}
                          impuestos={impuestos2}
                        />
                      </Box>
                    ),
                  },
                  {
                    id: 4,
                    label: "Ciudades",
                    content: (
                      <Box sx={{ p: 1, m: 0 }}>
                        <TablaPaisCiudades
                          reDirect={true}
                          dataApi={ciudades}
                          viewBtn={true}
                          newBtn={true}
                          currentPais={{
                            label: searchItem.nombre_pais,
                            value: id,
                          }}
                          updateData={updateData}
                          setUpdateData={setUpdateData}
                        />
                      </Box>
                    ),
                  },
                  {
                    id: 5,
                    label: "Departamentos",
                    content: (
                      <Box sx={{ p: 1, m: 0 }}>
                        <TablaPaisDepartamentos
                          reDirect={true}
                          dataApi={departamentos}
                          viewBtn={true}
                          newBtn={true}
                          updateData={updateData}
                          setUpdateData={setUpdateData}
                          currentPais={{
                            label: searchItem.nombre_pais,
                            value: id,
                          }}
                        />
                      </Box>
                    ),
                  },
                  {
                    id: 6,
                    label: "Municipios",
                    content: (
                      <Box sx={{ p: 1, m: 0 }}>
                        <TablaPaisMunicipios
                          reDirect={true}
                          dataApi={municipios_filtered}
                          viewBtn={true}
                          newBtn={true}
                          updateData={updateData}
                          setUpdateData={setUpdateData}
                          currentPais={{
                            label: searchItem.nombre_pais,
                            value: id,
                          }}
                        />
                      </Box>
                    ),
                  },
                ]
              : [
                  {
                    id: 1,
                    label: "Informacion",
                    content: (
                      <Box sx={{ p: 1, m: 0 }}>
                        <FormularioCompletoPaises
                          readOnly={false}
                          dataGet={searchItem}
                          setUpdateData={setUpdateData}
                          updateData={updateData}
                          enableBtn={enableBtn}
                          readOnlyInput={readOnlyInput}
                          setEnableBtn={setEnableBtn}
                        />
                      </Box>
                    ),
                  },
                ]
          }
        />
      )}
      {newCountry && (
        <TabComponent
          opciones={[
            {
              id: 1,
              label: "Nuevo Pais",
              content: (
                <Box sx={{ p: 1, m: 0 }}>
                  <FormularioCompletoPaises readOnly={false} dataGet={null} />
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
