import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Icon, CircularProgress, Typography, Grid, Divider } from "@mui/material";
import { TablaPaises } from "../../views/Paises/TablaPaises";
import { api } from "../../api";
import { useSelector } from "react-redux";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { TablaReporteMovimiento } from "../../views/ReporteMovimiento/TablaReporteMovimiento";
import { movimientos } from "./MockData";
import generarExcel from "../../utils/GeneradorExcel/_generador_excel_v2";
import generarPDF from "../../utils/GeneradorPDF/_generador_pdf_v3";
import { transformDatos } from "../../utils/GeneradorExcel/_data_format";
// import { tablas_movimientos } from "./HeadersReporteMovimiento";
import moment from "moment";

const tablas_movimientos = [];

export const ListaReporteMovimiento = () => {
  const { currentPais, currentEmpresa, currentMenu, currentCategoria } = useSelector((state) => state.menu);
  const { json } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [selectedIngreso, setSelectedIngreso] = useState(null);
  const [selectedSalida, setSelectedSalida] = useState(null);

  const [valores, setValores] = useState({
    articulo: null,
    lote: null,
    date_to: null,
    date_from: null,
  });
  const [data, setData] = useState(true);

  const inputs = useMemo(
    () => [
      {
        tipo: "date",
        label: "Fecha de:",
        id: "date_from",
        size: 4,
        val: valores.date_from || null,
      },
      {
        tipo: "date",
        label: "Fecha hasta:",
        id: "date_to",
        size: 4,
        val: valores.date_to || null,
      },
    ],
    [valores]
  );

  function unificarDetalles(data) {
    let returnData = [];
    for (let i in data) {
      if (data[i]["det"]) {
        returnData = returnData.concat(data[i]["det"]);
      }
    }
    return returnData;
  }

  const generarExcelButton = () => {
    for (let registro in movimientos["ingresos"]) {
      if (movimientos["ingresos"][registro]["det"]) {
        for (let detalle in movimientos["ingresos"][registro]["det"]) {
          movimientos["ingresos"][registro]["det"][detalle]["ingdec"] = movimientos["ingresos"][registro]["ingdec"];
        }
      }
    }

    generarExcel({
      descargar: true,
      propiedades: {
        title: `Reporte de movimientos - ERPWEB - ${moment().format("YYYY_MM_DD_HH_mm_ss")}.xlsx`,
        subject: "Reporte en excel",
        author: "ERP-web",
        creator: "ERP-web",
      },
      titulo: `Reporte de movimientos`,
      horizontal: true,
      bottom: true,
      hojas: [
        {
          nombre: `Ingresos`,
          color: "006821",
          header: {
            "Generado el: ": moment().format("DD/MM/YYYY HH:mm:ss"),
            "Fecha de: ": valores.date_from && "label" in valores.date_from ? valores.date_from.label : " - ",
            "Fecha hasta: ": valores.date_to && "label" in valores.date_to ? valores.date_to.label : " - ",
          },
          datos: transformDatos(tablas_movimientos[0].headers, movimientos["ingresos"]),
        },
        {
          nombre: `Datalle Ingresos`,
          color: "006821",
          header: {
            "Generado el: ": moment().format("DD/MM/YYYY HH:mm:ss"),
            "Fecha de: ": valores.date_from && "label" in valores.date_from ? valores.date_from.label : " - ",
            "Fecha hasta: ": valores.date_to && "label" in valores.date_to ? valores.date_to.label : " - ",
          },
          datos: transformDatos(tablas_movimientos[0].sub_headers.concat([{ name: "INGDEC", label: "Declaración", campo: "ingdec" }]), unificarDetalles(movimientos["ingresos"])),
        },
        {
          nombre: `Salidas`,
          color: "F9313B",
          header: {
            "Generado el: ": moment().format("DD/MM/YYYY HH:mm:ss"),
            "Fecha de: ": valores.date_from && "label" in valores.date_from ? valores.date_from.label : " - ",
            "Fecha hasta: ": valores.date_to && "label" in valores.date_to ? valores.date_to.label : " - ",
          },
          datos: transformDatos(tablas_movimientos[1].headers, movimientos["salidas"]),
        },
        {
          nombre: `Datalle Salidas`,
          color: "F9313B",
          header: {
            "Generado el: ": moment().format("DD/MM/YYYY HH:mm:ss"),
            "Fecha de: ": valores.date_from && "label" in valores.date_from ? valores.date_from.label : " - ",
            "Fecha hasta: ": valores.date_to && "label" in valores.date_to ? valores.date_to.label : " - ",
          },
          datos: transformDatos(tablas_movimientos[1].sub_headers, unificarDetalles(movimientos["salidas"])),
        },
        {
          nombre: `Ajustes`,
          color: "4d3286",
          header: {
            "Generado el: ": moment().format("DD/MM/YYYY HH:mm:ss"),
            "Fecha de: ": valores.date_from && "label" in valores.date_from ? valores.date_from.label : " - ",
            "Fecha hasta: ": valores.date_to && "label" in valores.date_to ? valores.date_to.label : " - ",
          },
          datos: transformDatos(tablas_movimientos[2].headers, movimientos["ajustes"]),
        },
        {
          nombre: `Mermas`,
          color: "22AEA7",
          header: {
            "Generado el: ": moment().format("DD/MM/YYYY HH:mm:ss"),
            "Fecha de: ": valores.date_from && "label" in valores.date_from ? valores.date_from.label : " - ",
            "Fecha hasta: ": valores.date_to && "label" in valores.date_to ? valores.date_to.label : " - ",
          },
          datos: transformDatos(tablas_movimientos[3].headers, movimientos["mermas"]),
        },
      ],
    });
  };

  const generarPDFButton = () => {
    for (let registro in movimientos["ingresos"]) {
      if (movimientos["ingresos"][registro]["det"]) {
        for (let detalle in movimientos["ingresos"][registro]["det"]) {
          movimientos["ingresos"][registro]["det"][detalle]["ingdec"] = movimientos["ingresos"][registro]["ingdec"];
        }
      }
    }

    generarPDF({
      descargar: true,
      propiedades: {
        title: `Reporte de movimientos - ERPWEB - ${moment().format("YYYY_MM_DD_HH_mm_SS")}.pdf`,
        subject: "Reporte en excel",
        author: "ERP-web",
        creator: "ERP-web",
      },
      titulo: `Reporte de movimientos`,
      horizontal: true,
      bottom: true,
      header: {
        "Generado el: ": moment().format("DD/MM/YYYY HH:mm:ss"),
        "Fecha de: ": valores.date_from && "label" in valores.date_from ? valores.date_from.label : " - ",
        "Fecha hasta: ": valores.date_to && "label" in valores.date_to ? valores.date_to.label : " - ",
      },

      tablas: [
        {
          nombre: `Ingresos`,
          datos: transformDatos(tablas_movimientos[0].headers, movimientos["ingresos"]),
        },
        {
          nombre: `Datalle Ingresos`,
          datos: transformDatos(tablas_movimientos[0].sub_headers.concat([{ name: "INGDEC", label: "Declaración", campo: "ingdec" }]), unificarDetalles(movimientos["ingresos"])),
        },
        {
          nombre: `Salidas`,
          datos: transformDatos(tablas_movimientos[1].headers, movimientos["salidas"]),
        },
        {
          nombre: `Datalle Salidas`,
          datos: transformDatos(tablas_movimientos[1].sub_headers, unificarDetalles(movimientos["salidas"])),
        },
        {
          nombre: `Ajustes`,
          datos: transformDatos(tablas_movimientos[2].headers, movimientos["ajustes"]),
        },
        {
          nombre: `Mermas`,
          datos: transformDatos(tablas_movimientos[3].headers, movimientos["mermas"]),
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
        <Box sx={{ mb: 4 }}>
          <TablaReporteMovimiento
            id="ingdec"
            headers={tablas_movimientos[0].headers}
            titulo="Ingresos"
            datos={movimientos["ingresos"]}
            filaSeleccionada={selectedIngreso}
            setFilaSeleccionada={setSelectedIngreso}
          />
          {selectedIngreso && (
            <Box sx={{ pl: 5, mt: 2 }}>
              <TablaReporteMovimiento id="ingdec" headers={tablas_movimientos[0].sub_headers} titulo={null} datos={selectedIngreso["det"]} />
            </Box>
          )}
        </Box>

        <Box sx={{ mb: 4 }}>
          <TablaReporteMovimiento
            id="saldec"
            headers={tablas_movimientos[1].headers}
            titulo="Salidas"
            datos={movimientos["salidas"]}
            filaSeleccionada={selectedSalida}
            setFilaSeleccionada={setSelectedSalida}
          />
          {selectedSalida && (
            <Box sx={{ pl: 5, mt: 2 }}>
              <TablaReporteMovimiento id="ingdec" headers={tablas_movimientos[1].sub_headers} titulo={null} datos={selectedSalida["det"]} />
            </Box>
          )}
        </Box>

        <Box sx={{ mb: 4 }}>
          <TablaReporteMovimiento id="saldec" headers={tablas_movimientos[2].headers} titulo="Ajustes" datos={[]} />
        </Box>

        <Box sx={{ mb: 4 }}>
          <TablaReporteMovimiento id="saldec" headers={tablas_movimientos[3].headers} titulo="Mermas" datos={[]} />
        </Box>
      </Grid>
    </Grid>
  ) : (
    <Box sx={{ display: "flex", width: "90vw", height: "85vh", justifyContent: "center", alignItems: "center", color: "primary" }}>
      <CircularProgress />
    </Box>
  );
};
