import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Icon, CircularProgress, Typography, Grid, Divider } from "@mui/material";
import { api } from "../../api";
import { useSelector } from "react-redux";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import generarExcel from "../../utils/GeneradorExcel/_generador_excel_v2";
import generarPDF from "../../utils/GeneradorPDF/_generador_pdf_v3";
import { transformDatos } from "../../utils/GeneradorExcel/_data_format.js";
import moment from "moment";
import { tabla_puestos } from "./HeadersReportePuestosDeEmpleado.js";
import { TablaReportePuestosDeEmpleado } from "../../views/ReportePuestosDeEmpleado/TablaReportePuestosDeEmpleado.jsx";

export const ListaReportePuestosDeEmpleado = ({ id, empleado }) => {
  const { currentPais, currentEmpresa, currentMenu, currentCategoria } = useSelector((state) => state.menu);
  const { json } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [puestos, setPuestos] = useState([]);
  const [data, setData] = useState(true);

  const getPuestos = async () => {
    const puestos_usuario = await api.get(`/api/appweb/listaemp-usu-puesto?cod_empleado=${id}`);
    const lista_puestos = await api.get(`/api/appweb/lista-puesto`);

    const innerJoin = puestos_usuario.data.data.flatMap((puesto_u) =>
      lista_puestos.data.data
        .filter((puesto) => puesto.cod_puesto === puesto_u.cod_puesto)
        .map((puesto) => ({
          ...puesto_u,
          ...puesto,
        }))
    );
    console.log(innerJoin);
    setPuestos(innerJoin);
  };

  useEffect(() => {
    getPuestos();
  }, []);

  const generarExcelButton = () => {
    let nombre_usuario = "";
    if (puestos && puestos.length > 0) {
      nombre_usuario = puestos[0]["nom_empleado"];
    } else {
      return;
    }

    generarExcel({
      descargar: true,
      propiedades: {
        title: `Puestos - ${empleado.nom_empleado} ${empleado.apellido_emp} - ERPWEB - ${moment().format("YYYY_MM_DD_HH_mm_ss")}.xlsx`,
        subject: "Reporte en excel",
        author: "ERP-web",
        creator: "ERP-web",
      },
      titulo: `Puestos del empleado`,
      horizontal: true,
      bottom: true,
      hojas: [
        {
          nombre: `Puestos`,
          color: "006821",
          header: {
            "Generado el: ": moment().format("DD/MM/YYYY HH:mm:ss"),
            "Empleado: ": `${empleado.nom_empleado} ${empleado.apellido_emp}`,
          },
          datos: transformDatos(tabla_puestos.headers, puestos),
        },
      ],
    });
  };

  const generarPDFButton = () => {
    let nombre_usuario = "";
    if (puestos && puestos.length > 0) {
      nombre_usuario = puestos[0]["nom_empleado"];
    } else {
      return;
    }

    generarPDF({
      descargar: true,
      propiedades: {
        title: `Puestos - ${empleado.nom_empleado} ${empleado.apellido_emp} - ERPWEB - ${moment().format("YYYY_MM_DD_HH_mm_SS")}.pdf`,
        subject: "Reporte en excel",
        author: "ERP-web",
        creator: "ERP-web",
      },
      titulo: `Puestos del empleado`,
      horizontal: true,
      bottom: true,
      header: {
        "Generado el: ": moment().format("DD/MM/YYYY HH:mm:ss"),
        "Empleado: ": `${empleado.nom_empleado} ${empleado.apellido_emp}`,
      },

      tablas: [
        {
          nombre: ``,
          datos: transformDatos(tabla_puestos.headers, puestos),
        },
      ],
    });
  };

  return data ? (
    <Grid sx={{ px: 0, m: 0 }}>
      <Box sx={{ px: 1, mb: 2, mt: 2 }} align="right">
        <Button size="small" variant="contained" color="error" sx={{ ml: 1 }} onClick={generarPDFButton}>
          <Icon className="c-pdf" sx={{ mr: 0.5, fontSize: 15 }} />
          Generar PDF
        </Button>

        <Button size="small" variant="contained" color="success" sx={{ ml: 1 }} onClick={generarExcelButton}>
          <Icon className="c-excel" sx={{ mr: 0.5, fontSize: 15 }} />
          Generar Excel
        </Button>
      </Box>
      <Grid>
        <Box sx={{ mb: 4 }}>
          <TablaReportePuestosDeEmpleado id={"cod_puesto"} headers={tabla_puestos.headers} titulo={"Puestos del empleado"} datos={puestos} />
        </Box>
      </Grid>
    </Grid>
  ) : (
    <Box sx={{ display: "flex", width: "90vw", height: "85vh", justifyContent: "center", alignItems: "center", color: "primary" }}>
      <CircularProgress />
    </Box>
  );
};
