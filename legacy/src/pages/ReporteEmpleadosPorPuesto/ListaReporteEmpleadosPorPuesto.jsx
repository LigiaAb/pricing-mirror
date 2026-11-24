import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Icon, CircularProgress, Typography, Grid, Divider } from "@mui/material";
import { api } from "../../api";
import { encryptId, decryptId } from "../../api/encryptDecrypt";
import { useSelector } from "react-redux";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import generarExcel from "../../utils/GeneradorExcel/_generador_excel_v2";
import generarPDF from "../../utils/GeneradorPDF/_generador_pdf_v3";
import { transformDatos } from "../../utils/GeneradorExcel/_data_format.js";
import moment from "moment";
import { tabla_empleados_x_puesto } from "./HeadersReporteEmpleadosPorPuesto.js";
import { TablaReporteEmpleadosPorPuesto } from "../../views/ReporteEmpleadosPorPuesto/TablaReporteEmpleadosPorPuesto";

export const ListaReporteEmpleadosPorPuesto = ({ cod_cc }) => {
  const { currentPais, currentEmpresa, currentMenu, currentCategoria } = useSelector((state) => state.menu);
  const { json } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [selectedIngreso, setSelectedIngreso] = useState(null);
  const [selectedSalida, setSelectedSalida] = useState(null);

  const [valores, setValores] = useState({
    puesto: null,
  });
  const [empleados, setEmpleados] = useState([]);
  const [puestos, setPuestos] = useState([]);
  const [data, setData] = useState(true);

  const getPuestos = async () => {
    const dataApi = await api.get("/api/appweb/lista-puesto", { params: { cod_cc } });
    setPuestos(dataApi.data.data);
    console.log(dataApi.data.data);
  };

  const getEmpleados = async () => {
    const listaEmpleados = await api.get("api/appweb/lista-empleado");
    const dataApi = await api.get("/api/appweb/listaemp-usu-puesto", { params: { cod_cc } });
    setEmpleados(
      dataApi.data.data.map((item) => {
        return {
          ...item,
          apellido_emp: listaEmpleados.data.data.find((i) => i.cod_empleado == item.cod_empleado).apellido_emp,
        };
      })
    );
  };

  const puestos_ = useMemo(
    () =>
      puestos
        // .filter(item => item.cod_cc == id)
        .map((item) => ({
          value: item.cod_puesto.toString(),
          label: item.puesto_desc,
        })),
    [puestos]
  );

  const empleados_ = useMemo(() => empleados.filter((item) => (valores.puesto ? valores.puesto.value == item.cod_puesto : true)), [valores, puestos_, empleados]);

  useEffect(() => {
    getPuestos();
    getEmpleados();
  }, []);

  const inputs = useMemo(
    () => [
      {
        tipo: "select",
        label: "Puesto",
        id: "puesto",
        size: 4,
        val: valores.puesto || null,
        options: puestos_ || [],
      },
    ],
    [valores, puestos]
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
    generarExcel({
      descargar: true,
      propiedades: {
        title: `Empleados por puesto - ERPWEB - ${moment().format("YYYY_MM_DD_HH_mm_ss")}.xlsx`,
        subject: "Reporte en excel",
        author: "ERP-web",
        creator: "ERP-web",
      },
      titulo: `Empleados por puesto`,
      horizontal: true,
      bottom: true,
      hojas: [
        {
          nombre: `Empleados por puesto`,
          color: "006821",
          header: {
            "Generado el: ": moment().format("DD/MM/YYYY HH:mm:ss"),
          },
          datos: transformDatos(tabla_empleados_x_puesto.headers, empleados),
        },
      ],
    });
  };

  const generarPDFButton = () => {
    generarPDF({
      descargar: true,
      propiedades: {
        title: `Empleados por puesto - ERPWEB - ${moment().format("YYYY_MM_DD_HH_mm_SS")}.pdf`,
        subject: "Reporte en excel",
        author: "ERP-web",
        creator: "ERP-web",
      },
      titulo: `Empleados por puesto`,
      horizontal: true,
      bottom: true,
      header: {
        "Generado el: ": moment().format("DD/MM/YYYY HH:mm:ss"),
      },

      tablas: [
        {
          nombre: ``,
          datos: transformDatos(tabla_empleados_x_puesto.headers, empleados),
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
          <TablaReporteEmpleadosPorPuesto
            id={tabla_empleados_x_puesto.id}
            headers={tabla_empleados_x_puesto.headers}
            titulo={tabla_empleados_x_puesto.titulo}
            datos={empleados_}
            filaSeleccionada={selectedIngreso}
            setFilaSeleccionada={setSelectedIngreso}
          />
        </Box>
      </Grid>
    </Grid>
  ) : (
    <Box sx={{ display: "flex", width: "90vw", height: "85vh", justifyContent: "center", alignItems: "center", color: "primary" }}>
      <CircularProgress />
    </Box>
  );
};
