import React, { useState, useMemo, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import { Grid, Box, Typography, IconButton, Icon, Button, Menu, MenuItem, Tooltip } from "@mui/material";
import { colores_actividad, colores_estados } from "../../theme/colores_actividad";
import DialogComponent from "./DialogComponent";
import { TablaRangoFechas } from "./TablaRangoFechas";
import FormularioComponent from "../Formulario/FormularioComponent";
import TablaEditableComponent from "../Tabla/TablaEditableComponent";

const RangoFechasAlertComponent = (props) => {
  const { open, handleClose, onConfirmar, titulo, tabla, datos, rango = 1, tipoRango = "mes/es" } = props;
  const [errorString, setErrorString] = useState("");
  const [fecha, setFecha] = useState({
    fecha_inicial: null,
    fecha_final: null,
  });

  function addDate(date, type, number) {
    let newDate = new Date(date);
    switch (type.toLowerCase()) {
      case "dia/s":
        newDate.setDate(newDate.getDate() + number + 1);
        break;
      case "semana/s":
        newDate.setDate(newDate.getDate() + (number * 7 + 1));
        break;
      case "mes/es":
        newDate.setMonth(newDate.getMonth() + number);
        break;
      case "año/s":
        newDate.setFullYear(newDate.getFullYear() + number);
        break;
      default:
        throw new Error("tipoRango invalido.");
    }
    return newDate;
  }

  const updateFecha = (id, val) => {
    if (id == "fecha_final" && fecha.fecha_inicial > val) {
      setErrorString("* La fecha final debe ser mayor a la incial");
      setFecha((inp) => ({ ...inp, [id]: val }));
      return;
    } else if (id == "fecha_inicial" && fecha.fecha_final < val) {
      setErrorString("* La fecha inicial debe ser menor a la final");
      setFecha((inp) => ({ ...inp, [id]: val }));
      return;
    }

    if (fecha.fecha_inicial && fecha.fecha_final && tipoRango && rango > 0) {
      const tempInicial = id == "fecha_inicial" ? val : fecha.fecha_inicial;
      const tempFinal = id == "fecha_final" ? val : fecha.fecha_final;

      const fechaLimite = addDate(tempInicial, tipoRango, rango);
      if (tempFinal > fechaLimite) {
        setErrorString(`Fecha fuera del rango (${rango} ${tipoRango}).`);
        setFecha((inp) => ({ ...inp, [id]: val }));
        return;
      }
    }

    setErrorString("");
    setFecha((inp) => ({ ...inp, [id]: val }));
  };

  const inputs = useMemo(
    () => [
      { tipo: "date", id: "fecha_inicial", label: "Fecha Inicial", size: 6, val: fecha.fecha_inicial },
      { tipo: "date", id: "fecha_final", label: "Fecha Final", size: 6, val: fecha.fecha_final },
    ],
    [fecha.fecha_final, fecha.fecha_inicial],
  );

  const datos_ = useMemo(() => {
    return datos
      .map((i) => {
        let o = {};
        Object.keys(i).forEach((d) => {
          o[d] = {
            color: d === "estado" ? colores_estados[i.estado] : undefined,
            bold: d === "estado" ? true : undefined,
          };
        });
        return {
          ...i,
          // cliente_desc: i.cliente.entidad_nombre,
          propiedadesDeTabla: o,
        };
      })
      .filter((i) => {
        if (!fecha.fecha_inicial || !fecha.fecha_final) {
          return false;
        }
        let fecha_i = new Date(i.fecha);
        let fecha_final = new Date(fecha.fecha_final);
        fecha_final.setDate(fecha_final.getDate() + 1);
        return fecha.fecha_inicial <= fecha_i && fecha_i <= fecha_final;
      });
  }, [fecha]);

  function formatDateForFilename(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${day}-${month}-${year}`;
  }

  const handleClose_ = () => {
    handleClose();
    setErrorString("");
    setFecha({
      fecha_inicial: null,
      fecha_final: null,
    });
  };

  return (
    <DialogComponent openDialog={open} handleClose={handleClose_} titulo={titulo} width="60vw">
      <Grid container spacing={0.2} width={"100%"}>
        <Typography color="error.main">{errorString}</Typography>

        <Grid
          item
          size={12}
          sx={{
            display: "flex",
            alignItems: "center",
            // border: 1
          }}
        >
          <FormularioComponent
            inputs={inputs}
            onInput={({ id, val }) => updateFecha(id, val)}
            botones={{
              confirm: {
                texto: "confirmar",
                visible: true,
                onClick: () => onConfirmar(datos_, `${formatDateForFilename(fecha.fecha_inicial)} al ${formatDateForFilename(fecha.fecha_final)}`, fecha.fecha_inicial, fecha.fecha_final),
                readonly: errorString || !fecha.fecha_inicial || !fecha.fecha_final,
              },
              agregar: { visible: false, onClick: null },
              cancelar: { visible: true, onClick: () => handleClose_() },
              guardar: { visible: false, onClick: null },
              filtrar: { visible: false, onClick: null },
            }}
          />
        </Grid>
        <Grid item size={12}>
          <TablaEditableComponent encabezados={tabla.headers} data={datos_} />
          {/* <TablaRangoFechas tabla={tabla} datos={datos_} /> */}
        </Grid>
        {/* <pre>{JSON.stringify(datos_, null, 2)}</pre> */}
      </Grid>
    </DialogComponent>
  );
};

// RangoFechasAlertComponent.propTypes = {
//     actividad: PropTypes.object,
//     onClick: PropTypes.func,
// };

export default RangoFechasAlertComponent;
