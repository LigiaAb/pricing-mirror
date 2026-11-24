import React, { useState, useEffect, useMemo } from "react";
import { Box, Grid, Typography } from "@mui/material";
import PropTypes from "prop-types";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate, useLocation } from "react-router-dom";
import { tabla_actividades, tabla_actividades_oportunidades, tabla_actividades_delegadas } from "./HeadersActividades";
import { encryptId } from "../../api/encryptDecrypt";
import DialogComponent from "../../components/Dialog/DialogComponent";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { api } from "../../api";

export const TablaActividades = (props) => {
  const { datos = [], newBtn = false, retrasadas, oportunidades, catalogos = {}, asignacion = false } = props;
  const { entidades = [], empleados = [] } = catalogos;
  const [open, setOpen] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState({});

  const inputs = useMemo(
    () => [
      {
        tipo: "select",
        id: "empleado",
        label: "Empleado",
        size: 12,
        options: empleados,
        val: data?.empleado,
      },
    ],
    [data, empleados]
  );

  const hadleAsignar = async () => {
    if (!filaSeleccionada) return;
    await api
      .post("api/appweb/actualizar-actividad", {
        ...filaSeleccionada,
        cod_asesor: data?.empleado.cod_usuario || null,
      })
      .then(({ data }) => {
        if (data.data.mensaje == "Actividad actualizada correctamente") {
          navigate(encryptId(filaSeleccionada.cod_actividad));
        } else {
          console.error(data.data.mensaje);
        }
      })
      .catch((e) => console.error(e));
  };

  console.log(datos);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        titulo={`${tabla_actividades["titulo"]} ${retrasadas ? "Atrasadas" : ""}`}
        id={tabla_actividades["id"]}
        encabezado={oportunidades ? tabla_actividades_oportunidades["headers"] : asignacion ? tabla_actividades_delegadas["headers"] : tabla_actividades["headers"]}
        datos={datos}
        select={false}
        eventosDeTabla={{
          add: (fila) => {
            fila && setFilaSeleccionada(fila.content);
            setOpen(true);
          },
          view: (fila) => navigate(location.pathname.includes("oportunidades") ? `../../../calendario/actividad/${encryptId(fila?.content.cod_actividad)}` : encryptId(fila?.content.cod_actividad)),
          go: (fila) => console.log("go", fila),
          copy: (fila) => console.log("copy", fila),
          paste: (fila) => console.log("paste", fila),
          auth: (fila) => console.log("auth", fila),
          edit: (fila) => navigate(location.pathname.includes("oportunidades") ? `../../../calendario/actividad/${encryptId(fila?.content.cod_actividad)}` : encryptId(fila?.content.cod_actividad)),
          excel: (fila) => console.log("excel", fila),
          pdf: (fila) => console.log("pdf", fila),
          download: (fila) => console.log("download", fila),
          delete: (fila) => console.log("delete", fila),
        }}
        botones={
          newBtn && {
            nuevo: { label: "nuevo", color: "primary", onClick: () => navigate(encryptId("new")) },
          }
        }
      />

      <DialogComponent openDialog={open} titulo="Asignar actividad" handleClose={() => setOpen(false)}>
        <Grid sx={{ p: 1, m: 0 }}>
          <Grid display="flex" flexDirection="column">
            <Typography>Seleccione el usuario a quien se asignará la actividad:</Typography>
          </Grid>
          {/* <pre>{JSON.stringify(data?.empleado)}</pre> */}
          <Grid display="flex" flexDirection="column">
            <FormularioComponent
              inputs={inputs}
              onInput={({ id, val }) => {
                // setEmpleadoSeleccionado(val);
                setData((inp) => ({ ...inp, [id]: val }));
                console.log(id, val);
              }}
              botones={{
                asignar: { label: "Asignar", color: "primary", onClick: hadleAsignar, visible: true },
                agregar: { visible: false, onClick: null },
                cancelar: { visible: false, onClick: null },
                guardar: { visible: false, onClick: null },
                filtrar: { visible: false, onClick: null },
              }}
            />
          </Grid>
        </Grid>
      </DialogComponent>
    </Box>
  );
};

TablaActividades.propTypes = {
  datos: PropTypes.array, // Lista de actividades
  newBtn: PropTypes.bool, // Indica si se muestra el botón de nuevo
  retrasadas: PropTypes.bool, // Indica si la tabla es de actividades retrasadas
  oportunidades: PropTypes.bool, // Indica si la tabla es de oportunidades
  catalogos: PropTypes.object, // Lista de entidades y empleados
};
