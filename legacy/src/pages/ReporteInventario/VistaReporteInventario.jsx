import React, { useEffect, useState, useMemo } from "react";
import TabComponent from "../../components/Tabs/TabComponent";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, Grid, Button, Icon, CircularProgress } from "@mui/material";
import { useParams } from "react-router-dom";
import { api } from "../../api";
import { decryptId } from "../../api/encryptDecrypt";
import { useSelector } from "react-redux";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { ListaReporteExistenciasGenerales } from "../ReporteExistenciasGenerales/ListaReporteExistenciasGenerales";
import { ListaReporteExistenciasFecha } from "../ReporteExistenciasFecha/ListaReporteExistenciasFecha";
import { ListaReporteExistenciasPoliza } from "../ReporteExistenciasPoliza/ListaReporteExistenciasPoliza";
import { ListaReporteExistenciasArticulo } from "../ReporteExistenciasArticulo/ListaReporteExistenciasArticulo";
import { ListaReporteMovimientoArticulo } from "../ReporteMovimientoArticulo/ListaReporteMovimientoArticulo";
import { ListaReporteMovimiento } from "../ReporteMovimiento/ListaReporteMovimiento";
import { ListaReporteExistenciasAntiguedad } from "../ReporteExistenciasAntiguedad/ListaReporteExistenciasAntiguedad";
import { ListaActividades2 } from "../Actividades/ListaActividades2";

export const VistaReporteInventario = (props) => {
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

  const [selectedTipo, setSelectedTipo] = useState(null);

  const [newBtn, setNewBtn] = useState(false);
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

  let { encryptedId } = useParams();
  let id = encryptedId ? decryptId(encryptedId) : -1;

  const tipoReportes = useMemo(
    () => [
      { label: "Actividades", value: 1 },
      // { label: "Existencias Generales", value: 1 },
      // { label: "Existencias a una Fecha", value: 2 },
      // { label: "Existencias por poliza", value: 3 },
      // { label: "Existencias por articulo", value: 4 },
      // { label: "Movimiento articulo", value: 5 },
      // { label: "Mermas", value: 6 },
      // { label: "Vencimiento del Articulo", value: 7 },
      // { label: "Movimientos", value: 8 },
      // { label: "Existencias por caja", value: 9 },
      // { label: "Existencias de una poliza", value: 10 },
      // { label: "Existencias por antiguedad", value: 11 },
    ],
    []
  );

  const inputs = useMemo(
    () => [
      {
        tipo: "select",
        label: "Tipo de Reporte",
        id: "tipo",
        size: 4,
        val: {
          label: selectedTipo ? selectedTipo?.label : "",
          value: selectedTipo ? selectedTipo?.value : -1,
        },
        options: tipoReportes,
        // requerido: true
      },
    ],
    [selectedTipo, tipoReportes]
  );

  return (
    <Box sx={{ px: 2, m: 0 }}>
      <Grid container columns={{ xs: 4, md: 8 }}>
        <Grid size="grow">
          <Typography m={0} p={0} variant="h4">
            Reportes
          </Typography>
        </Grid>
      </Grid>

      <Box sx={{ p: 1, mb: 0 }}>
        <FormularioComponent
          inputs={inputs}
          onInput={({ id, val }) => {
            setSelectedTipo(val);
          }}
          botones={{
            agregar: { visible: false },
          }}
        />
      </Box>

      {selectedTipo ? (
        selectedTipo.value == 1 ? (
          <ListaActividades2 filtros={{ estado: true, fecha: true, empleado: true, empresa: true, cenco: true }} cod_usuario={null} excel />
        ) : selectedTipo.value == 1 ? (
          <ListaReporteExistenciasGenerales />
        ) : selectedTipo.value == 2 ? (
          <ListaReporteExistenciasFecha />
        ) : selectedTipo.value == 3 ? (
          <ListaReporteExistenciasPoliza />
        ) : selectedTipo.value == 4 ? (
          <ListaReporteExistenciasArticulo />
        ) : selectedTipo.value == 5 ? (
          <ListaReporteMovimientoArticulo />
        ) : selectedTipo.value == 6 ? (
          <span>Mermas</span>
        ) : selectedTipo.value == 7 ? (
          <span>Vencimiento del Articulo</span>
        ) : selectedTipo.value == 8 ? (
          <ListaReporteMovimiento />
        ) : selectedTipo.value == 9 ? (
          <ListaReporteExistenciasGenerales />
        ) : selectedTipo.value == 10 ? (
          <span>Existencias de una poliza</span>
        ) : selectedTipo.value == 11 ? (
          <ListaReporteExistenciasAntiguedad />
        ) : null
      ) : null}

      {/* <span>{JSON.stringify(selectedTipo)}</span>  */}
    </Box>
  );
};
