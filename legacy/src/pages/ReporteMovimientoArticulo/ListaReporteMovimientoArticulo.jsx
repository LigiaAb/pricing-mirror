import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Icon, CircularProgress, Typography, Grid, Divider } from "@mui/material";
import { TablaPaises } from "../../views/Paises/TablaPaises";
import { api } from "../../api";
import { useSelector } from "react-redux";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { TablaReporteMovimientoArticulo } from "../../views/ReporteMovimientoArticulo/TablaReporteMovimientoArticulo";
import { tablas } from "./HeadersReporteMovimientoArticulo";
import { movimientos } from "./MockData";
import generarExcel from "../../utils/GeneradorExcel/_generador_excel_v2";
import { transformDatos } from "../../utils/GeneradorExcel/_data_format";

export const ListaReporteMovimientoArticulo = () => {
  const { currentPais, currentEmpresa, currentMenu, currentCategoria } = useSelector((state) => state.menu);
  const { json } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [valores, setValores] = useState({
    articulo: null,
    lote: null,
    date_to: null,
    date_from: null,
  });
  const [data, setData] = useState(null);
  const [paises, setPaises] = useState([]);
  const [accionesDeTabla, setAccionesDeTabla] = useState({
    add: false,
    view: false,
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
  const [newBtn, setNewBtn] = useState(false);

  const checkPermisos = () => {};

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
    checkPermisos();
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

  const tipos = [
    { id: 1, label: "Reales" },
    { id: 2, label: "Disponibles" },
  ];

  const inputs = useMemo(
    () => [
      {
        tipo: "select",
        label: "Articulo",
        id: "articulo",
        size: 5,
        val: valores.articulo || null,
        options: tipos,
      },
      {
        tipo: "text",
        label: "Lote",
        id: "lote",
        size: 5,
        val: valores.lote || null,
      },
      {
        tipo: "date",
        label: "Fecha de:",
        id: "date_from",
        size: 5,
        val: valores.date_from || null,
        options: tipos,
      },
      {
        tipo: "date",
        label: "Fecha hasta:",
        id: "date_to",
        size: 5,
        val: valores.date_to || null,
      },
    ],
    [valores]
  );

  // const generarPDFButton = () => {
  //   console.log(valores)
  //   generarPDF({
  //     descargar: true,
  //     propiedades: {
  //       title: `Reporte de existencias generales - ERPWEB - ${moment().format(
  //         "YYYY_MM_DD_HH_mm_SS"
  //       )}.pdf`,
  //       subject: "Reporte en excel",
  //       author: "ERP-web",
  //       creator: "ERP-web",
  //     },
  //     titulo: `Reporte de existencias generales`,
  //     horizontal: true,
  //     // tamaño: [297, 210],
  //     bottom: true,
  //     header: {
  //       "Generado el: ": moment().format( "DD/MM/YYYY HH:mm:SS" ),
  //       "Tipo de existencias: ": (valores.tipo && "label" in valores.tipo) ? valores.tipo.label : " - ",
  //       "Estado: ": (valores.estado && "label" in valores.estado) ? valores.estado.label : " - "
  //       },
  //     datos: transformDatos(tablas[0].headers, existencias)
  //   });
  // }

  const generarExcelButton = () => {
    console.log(movimientos);
    console.log(tablas);

    // generarExcel({
    //   descargar: true,
    //   propiedades: {
    //     title: `Reporte de movimientos - ERPWEB - ${moment().format(
    //       "YYYY_MM_DD_HH_mm_SS"
    //     )}.xlsx`,
    //     subject: "Reporte en excel",
    //     author: "ERP-web",
    //     creator: "ERP-web",
    //   },
    //   titulo: `Reporte de movimientos`,
    //   horizontal: true,
    //   bottom: true,
    //   hojas: [
    //     {
    //       nombre: `Ingresos`,
    //       color: "006821",
    //       header: {
    //         "Generado el: ": moment().format( "DD/MM/YYYY HH:mm:SS" ),
    //         "Fecha de: ": "label" in valores.tipo ? valores.tipo.label : " - ",
    //         // "Tipo de existencias: ": "label" in valores.tipo ? valores.tipo.label : " - ",
    //         // "Estado: ": "label" in valores.estado ? valores.estado.label : " - "
    //         },
    //       datos: transformDatos(tablas[0].headers, existencias)
    //     },
    //   ],
    // });
  };

  return data ? (
    <Grid sx={{ px: 0, m: 0 }}>
      <Box sx={{ mb: 2 }}>
        <FormularioComponent
          inputs={inputs}
          onInput={({ id, val }) => {
            setValores((v) => ({ ...v, [id]: val }));
          }}
          botones={{
            agregar: { visible: false },
            pdf: {
              visible: true,
              texto: (
                <>
                  <Icon className="c-pdf" sx={{ mr: 0.5, fontSize: 15 }} />
                  Generar PDF
                </>
              ),
              onClick: null,
              color: "error",
            },

            excel: {
              visible: true,
              texto: (
                <>
                  <Icon className="c-excel" sx={{ mr: 0.5, fontSize: 15 }} />
                  Generar Excel
                </>
              ),
              onClick: generarExcelButton,
              color: "success",
            },
          }}
        />
      </Box>
      <Grid>
        {tablas.map((tabla, i) => (
          <Box sx={{ mb: 4 }}>
            <TablaReporteMovimientoArticulo key={i} id={tabla.id} headers={tabla.headers} titulo={tabla.titulo} datos={movimientos[tabla.titulo]} />
            {/* <Divider orientation="horizontal" flexItem  sx={{ borderColor: "primary.main", mt: 4}}/> */}
          </Box>
        ))}
      </Grid>
    </Grid>
  ) : (
    <Box sx={{ display: "flex", width: "90vw", height: "85vh", justifyContent: "center", alignItems: "center", color: "primary" }}>
      <CircularProgress />
    </Box>
  );
};
