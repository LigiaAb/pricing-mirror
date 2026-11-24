import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Icon, CircularProgress, Typography, Grid } from "@mui/material";
import { api } from "../../api";
import { useSelector } from "react-redux";
import { TablaReporteExistenciasGenerales } from "../../views/ReporteExistenciasGenerales/TablaReporteExistenciasGenerales";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { existencias } from "./MockData";
import { tablas } from "./HeadersReporteGeneral";
import generarExcel from "../../utils/GeneradorExcel/_generador_excel_v2";
import generarPDF from "../../utils/GeneradorPDF/_generador_pdf_v2";
import { alignmentFormat, textFormat, borderFormat } from "../../utils/GeneradorExcel/_libreria_estilos_excel";
import moment from "moment";
import { transformDatos } from "../../utils/GeneradorExcel/_data_format";

export const ListaReporteExistenciasGenerales = () => {
  const { currentPais, currentEmpresa, currentMenu, currentCategoria } = useSelector((state) => state.menu);
  const { json } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [valores, setValores] = useState({
    tipo: null,
    estado: null,
  });
  const [data, setData] = useState(true);
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
    delete: false,
  });
  const [newBtn, setNewBtn] = useState(false);

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

  const estados = [
    { id: 1, label: "Inventario" },
    { id: 2, label: "Dañado" },
    { id: 3, label: "Vencido" },
    { id: 4, label: "Muestra" },
    { id: 5, label: "Promocional" },
    { id: 6, label: "Comiso" },
    { id: 7, label: "Beneficio" },
    { id: 8, label: "Donacion" },
    { id: 9, label: "Bloqueado" },
    { id: 10, label: "Quality" },
    { id: 11, label: "Sobrante" },
  ];

  const tipos = [
    { id: 1, label: "Reales" },
    { id: 2, label: "Disponibles" },
  ];

  const inputs = useMemo(
    () => [
      {
        tipo: "select",
        label: "Tipo de Existencias",
        id: "tipo",
        val: valores.tipo || null,
        options: tipos,
      },
      {
        tipo: "select",
        label: "Estado",
        id: "estado",
        val: valores.estado || null,
        options: estados,
      },
    ],
    [valores]
  );

  const generarPDFButton = () => {
    console.log(valores);
    generarPDF({
      descargar: true,
      propiedades: {
        title: `Reporte de existencias generales - ERPWEB - ${moment().format("YYYY_MM_DD_HH_mm_SS")}.pdf`,
        subject: "Reporte en excel",
        author: "ERP-web",
        creator: "ERP-web",
      },
      titulo: `Reporte de existencias generales`,
      horizontal: true,
      // tamaño: [297, 210],
      bottom: true,
      header: {
        "Generado el: ": moment().format("DD/MM/YYYY HH:mm:SS"),
        "Tipo de existencias: ": valores.tipo && "label" in valores.tipo ? valores.tipo.label : " - ",
        "Estado: ": valores.estado && "label" in valores.estado ? valores.estado.label : " - ",
      },
      datos: transformDatos(tablas[0].headers, existencias),
    });
  };

  const generarExcelButton = () => {
    generarExcel({
      descargar: true,
      propiedades: {
        title: `Reporte de existencias generales - ERPWEB - ${moment().format("YYYY_MM_DD_HH_mm_SS")}.xlsx`,
        subject: "Reporte en excel",
        author: "ERP-web",
        creator: "ERP-web",
      },
      titulo: `Reporte de existencias generales`,
      horizontal: true,
      bottom: true,
      hojas: [
        {
          nombre: `Reporte de existencias generales`,
          color: "006821",
          header: {
            "Generado el: ": moment().format("DD/MM/YYYY HH:mm:SS"),
            "Tipo de existencias: ": valores.tipo && "label" in valores.tipo ? valores.tipo.label : " - ",
            "Estado: ": valores.estado && "label" in valores.estado ? valores.estado.label : " - ",
          },
          datos: transformDatos(tablas[0].headers, existencias),
        },
      ],
    });
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
              onClick: generarPDFButton,
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
        <TablaReporteExistenciasGenerales datos={existencias} headers={tablas[0].headers} />
      </Grid>
    </Grid>
  ) : (
    <Box sx={{ display: "flex", width: "90vw", height: "85vh", justifyContent: "center", alignItems: "center", color: "primary" }}>
      <CircularProgress />
    </Box>
  );
};
