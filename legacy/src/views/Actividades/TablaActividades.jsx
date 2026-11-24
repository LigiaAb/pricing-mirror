import React, { useState, useEffect, useMemo } from "react";
import { Box, Grid, Typography } from "@mui/material";
import PropTypes from "prop-types";
import TablaComponent from "../../components/Tabla/TablaEditableComponent";
import { useNavigate, useLocation } from "react-router-dom";
import { tabla_actividades, tabla_actividades_oportunidades, tabla_actividades_delegadas, tabla_actividades_reporte, tabla_calendario, tabla_actividades_reporte_2 } from "./HeadersActividades";
import { encryptId } from "../../api/encryptDecrypt";
import DialogComponent from "../../components/Dialog/DialogComponent";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { api } from "../../api";

export const TablaActividades = (props) => {
  const {
    datos = [],
    newBtn = false,
    vencidas,
    oportunidades,
    catalogos = {},
    asignacion = false,
    proximas = false,
    reporte = false,
    historico = false,
    calendario = false,
    updateData,
    setUpdateData,
    lineasVisibles,
  } = props;
  const { empleados = [] } = catalogos;
  const [open, setOpen] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [actividadesSeleccionadas, setActividadesSeleccionadas] = useState([]);

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
    [data, empleados],
  );

  const handleAsignar = async () => {
    for (let i in actividadesSeleccionadas) {
      await api
        .post("api/appweb/actualizar-actividad", {
          ...actividadesSeleccionadas[i],
          cod_asesor: data?.empleado.cod_usuario || null,
        })
        .then(({ data }) => {
          if (data.data.mensaje == "Actividad actualizada correctamente") {
            // navigate(encryptId(actividadesSeleccionadas[i].cod_actividad))
          } else {
            console.error(data.data.mensaje);
          }
        })
        .catch((e) => console.error(e));
    }
    setActividadesSeleccionadas([]);
    setUpdateData(updateData + 1);
    setOpen(false);
  };

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <TablaComponent
        key={datos.length} // Forzar re-renderizado al cambiar los datos
        titulo={`${tabla_actividades["titulo"]} ${vencidas ? "Vencidas" : proximas ? "Próximas" : ""}`}
        id={tabla_actividades["id"]}
        encabezados={
          reporte
            ? historico
              ? tabla_actividades_reporte_2["headers"]
              : tabla_actividades_reporte["headers"]
            : oportunidades
              ? tabla_actividades_oportunidades["headers"]
              : asignacion
                ? tabla_actividades_delegadas["headers"]
                : calendario
                  ? tabla_calendario["headers"]
                  : tabla_actividades["headers"]
        }
        data={datos}
        select={asignacion}
        rowsPerPage={lineasVisibles}
        multipleSelect
        onFilaSeleccionada={(sel) => setActividadesSeleccionadas(sel)}
        onClearSelection={updateData}
        editarEnTabla={false}
        eventosDeTabla={{
          add: (id, fila) => {
            fila && setFilaSeleccionada(fila);
            setOpen(true);
          },
          view: (id, fila) =>
            navigate(
              // encryptId(fila?.content.cod_actividad)
              location.pathname.includes("reportes") ? `/crm/calendario/actividad/${encryptId(fila?.cod_actividad)}` : encryptId(fila?.cod_actividad),
            ),
          go: (fila) => console.log("go", fila),
          copy: (fila) => console.log("copy", fila),
          paste: (fila) => console.log("paste", fila),
          auth: (fila) => console.log("auth", fila),
          edit: (id, fila) =>
            navigate(
              encryptId(fila?.cod_actividad),
              // location.pathname.includes("oportunidades")
              //   ? `/crm/calendario/actividad/${encryptId(fila?.content.cod_actividad)}`
              //   : encryptId(fila?.content.cod_actividad)
            ),
          excel: (fila) => console.log("excel", fila),
          pdf: (fila) => console.log("pdf", fila),
          download: (fila) => console.log("download", fila),
          delete: (fila) => console.log("delete", fila),
        }}
        acciones={{ view: true, edit: true }}
        botones={{
          asignar: asignacion && actividadesSeleccionadas?.length > 0 ? { label: "Asignar", color: "primary", onClick: () => setOpen(true) } : undefined,
          nuevo: newBtn ? { label: "nuevo", color: "primary", onClick: () => navigate(encryptId("new")) } : undefined,
        }}
      />
      <DialogComponent openDialog={open} titulo="Asignar actividad" handleClose={() => setOpen(false)}>
        <Grid sx={{ p: 1, m: 0 }}>
          <Grid display="flex" flexDirection="column">
            <Typography>Seleccione el usuario a quien se asignará las actividades seleccionadas:</Typography>
          </Grid>
          {/* <pre>{JSON.stringify(data?.empleado)}</pre> */}
          <Grid flexDirection="column">
            <FormularioComponent
              inputs={inputs}
              onInput={({ id, val }) => {
                // setEmpleadoSeleccionado(val);
                setData((inp) => ({ ...inp, [id]: val }));
              }}
              botones={{
                asignar: { label: "Asignar", color: "primary", onClick: handleAsignar, visible: true },
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
  vencidas: PropTypes.bool, // Indica si la tabla es de actividades retrasadas
  oportunidades: PropTypes.bool, // Indica si la tabla es de oportunidades
  catalogos: PropTypes.object, // Lista de empleados
  asignacion: PropTypes.bool,
  proximas: PropTypes.bool,
  reporte: PropTypes.bool,
  historico: PropTypes.bool,
  calendario: PropTypes.bool,
  updateData: PropTypes.any,
  setUpdateData: PropTypes.any,
  lineasVisibles: PropTypes.number,
};
