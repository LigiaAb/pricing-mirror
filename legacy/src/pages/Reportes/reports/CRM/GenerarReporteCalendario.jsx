import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useParams } from "react-router-dom";
import { Box } from "@mui/material";
import generarPDFCalendario from "../../../../utils/GeneradorPDF/_generador_seguimiento_actividades_calendario";
import { useSelector } from "react-redux";
import { api } from "../../../../api";
import moment from "moment";

const GenerarReporteCalendario = (props) => {
  const { usuario, fechaInicio, fechaFin } = useParams();
  const informacionDeUsuario = useSelector((state) => state.auth);
  const [datos, setDatos] = useState([]);

  const url = useMemo(
    () =>
      generarPDFCalendario({
        agente: { cod_usuario: informacionDeUsuario.cod_usuario, usuario: informacionDeUsuario.usuario, nombre: informacionDeUsuario.nombre },
        usuario: informacionDeUsuario.nombre,
        fechaInicio,
        fechaFin,
        bottom: true,
        datos: datos
          .filter((i) => moment(i.fecha_programada).endOf("d").isSameOrBefore(moment(fechaFin, "DDMMYY").endOf("d")))
          .filter((i) => moment(i.fecha_programada).startOf("d").isSameOrAfter(moment(fechaInicio, "DDMMYY").startOf("d"))),
        titulo: "Calendario de Seguimientos de actividades",
        descargar: false,
      }),
    [datos, fechaFin, fechaInicio, informacionDeUsuario]
  );

  const obtenerActividades = useCallback(async () => {
    await api.get("/api/appweb/lista-actividades2", { params: { cod_asesor: informacionDeUsuario?.cod_usuario } }).then(({ data }) => setDatos(data.data));
  }, [informacionDeUsuario]);

  useEffect(() => {
    obtenerActividades();
  }, [obtenerActividades]);

  return (
    <Box>
      GenerarReporteCalendario
      <br />
      <iframe key={url} src={url} width="100%" height="500px" />
      <pre>{JSON.stringify({ usuario, fechaInicio, fechaFin }, null, 2)}</pre>
      {/* <pre>{JSON.stringify({ informacionDeUsuario }, null, 2)}</pre> */}
      <pre>{JSON.stringify({ datos }, null, 2)}</pre>
    </Box>
  );
};

GenerarReporteCalendario.propTypes = {};

export default GenerarReporteCalendario;
