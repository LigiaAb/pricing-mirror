import React, { useState } from "react";
import PropTypes from "prop-types";
import AcordionTipo from "./AcordionTipo";
import { Box, Button, Divider, Grid, Icon, IconButton, Typography } from "@mui/material";
import { basesSegunTipo, tipos } from "../tipos";
import Simple from "./Simple";
import Tabla from "./Tabla";
import Imagen from "./Imagen";
import Codigo from "./Codigo";
import { useSelector } from "react-redux";
import Lista from "./Lista";

const Detalle = (props) => {
  const { item, primero, ultimo, ejecutarAccion, mostrarBotones = true } = props;
  const [open, setOpen] = useState(false);
  const [datos, setDatos] = useState(item.datos);
  const [contador, setContador] = useState(item.datos.length + 1);
  const [renderKey, setRenderKey] = useState(0);
  const [tipo, setTipo] = useState(tipos[0].value);
  const { puesto } = useSelector((store) => store.auth);

  const realizarAccion = (accion, dato, ind) => {
    setDatos((array) => {
      let newArray = [...array];
      let index = dato && typeof dato !== "string" ? newArray.findIndex((i) => i.id === dato.id) : 0;

      switch (accion) {
        case "cancelar":
          newArray = newArray.filter((i, index) => dato.id !== i.id);
          setRenderKey((v) => v + 1);
          break;

        case "subir":
          if (index > 0) {
            const temp = newArray[index];
            newArray[index] = newArray[index - 1];
            newArray[index - 1] = temp;
          }
          setRenderKey((v) => v + 1);
          break;

        case "bajar":
          if (index < newArray.length - 1) {
            const temp = newArray[index];
            newArray[index] = newArray[index + 1];
            newArray[index + 1] = temp;
          }
          setRenderKey((v) => v + 1);
          break;

        case "actualizar label":
          newArray[ind]["label"] = { ...dato, guardado: true };
          break;

        case "actualizar dato":
          newArray[ind]["dato"] = { ...dato, guardado: true };
          break;

        case "setear tipo label":
          newArray[ind]["label"] = { ...basesSegunTipo[dato], id: `${newArray[ind]["id"]}LA${ind}` };
          // newArray[index] = dato;
          break;
        case "setear tipo dato":
          newArray[ind]["dato"] = { ...basesSegunTipo[dato], id: `${newArray[ind]["id"]}DA${ind}` };
          // newArray[index] = dato;
          break;

        case "agregar": {
          setTipo(tipo);
          setContador((i) => i + 1);
          const a = [
            ...newArray,
            {
              label: { ...basesSegunTipo["texto"], id: `${item.id}_ID${contador}_LA${newArray.length}` },
              dato: { ...basesSegunTipo["texto"], id: `${item.id}_ID${contador}_DA${newArray.length}` },
              id: `${item.id}_ID${contador}`,
            },
          ];
          newArray = a.map((i, ind) => ({
            ...i,
            label: { ...i.label, id: `${item.id}_ID${ind}_LA${a.length}` },
            dato: { ...i.dato, id: `${item.id}_ID${ind}_DA${a.length}` },
            id: `${item.id}_ID${ind}`,
          }));
          break;
        }

        default:
          break;
      }
      ejecutarAccion("actualizar", { ...item, datos: newArray, guardado: true });
      return newArray;
    });
  };

  return (
    <AcordionTipo {...{ item, primero, ultimo, ejecutarAccion, mostrarBotones }}>
      <Grid container direction="column" sx={{ p: 0, m: 0, mb: 1 }}>
        <Grid size="grow" sx={{ p: 0, m: 0 }}>
          <Grid container direction="row" sx={{ p: 0, m: 0 }}>
            <Grid size="auto" textAlign="right" sx={{ p: 0, m: 0 }}>
              <Button startIcon={<Icon className="c-suma" fontSize="small" />} color="primary" sx={{ m: 0, p: 0.1 }} size="small" onClick={() => realizarAccion("agregar")} variant="outlined">
                Agregar nueva fila a detalle
              </Button>
            </Grid>
            <Grid size="grow" textAlign="right" sx={{ p: 0, m: 0 }}></Grid>
          </Grid>
        </Grid>
        {/* <Divider /> */}
        <Grid size="grow" sx={{ p: 0, m: 0 }}>
          {datos.map((i, ind) => (
            <AcordionTipo
              {...{ item: { ...i, tipo: `detalle ${ind + 1}` }, primero: ind === 0, ultimo: ind === datos.length - 1, ejecutarAccion: realizarAccion, mostrarBotones }}
              key={JSON.stringify(i.id)}
            >
              <Grid container direction="column" sx={{ p: 0, m: 0, mb: 1 }}>
                <Grid size="grow" sx={{ p: 0, m: 0 }}>
                  <Typography variant="h6">Label {i.label.guardado ? "" : "*"}</Typography>
                </Grid>
                <Grid size="grow" sx={{ p: 0, m: 0, pl: 1 }}>
                  <Grid container direction="column">
                    <Grid size="grow" sx={{ m: 0, p: 0 }}>
                      {tipos.map(({ value, label }) => {
                        return (
                          <Button
                            variant="contained"
                            key={`dato_${value}`}
                            sx={{ m: 0, p: 0, ml: 0.5, mb: 1, px: 1, color: "white.main" }}
                            size="small"
                            onClick={() => realizarAccion("setear tipo label", value, ind)}
                            startIcon={<Icon sx={{ m: 0, p: 0, fontSize: "10px !important" }} className="c-suma" color="inherit" />}
                          >
                            {label}
                          </Button>
                        );
                      })}
                    </Grid>
                    <Grid>
                      {["texto", "titulo", "subtitulo", "hr"].includes(i.label?.tipo) ? (
                        <Simple item={i.label} key={i.label.id} ejecutarAccion={(acc, it) => realizarAccion(`${acc} label`, it, ind)} primero={true} ultimo={true} />
                      ) : i.label?.tipo === "codigo" ? (
                        <Codigo item={i.label} key={i.label.id} ejecutarAccion={(acc, it) => realizarAccion(`${acc} label`, it, ind)} primero={true} ultimo={true} />
                      ) : i.label?.tipo === "tabla" ? (
                        <Tabla item={i.label} key={i.label.id} ejecutarAccion={(acc, it) => realizarAccion(`${acc} label`, it, ind)} primero={true} ultimo={true} />
                      ) : i.label?.tipo === "detalle" ? (
                        <Detalle item={i.label} key={i.label.id} ejecutarAccion={(acc, it) => realizarAccion(`${acc} label`, it, ind)} primero={true} ultimo={true} />
                      ) : i.label?.tipo === "imagen" ? (
                        <Imagen item={i.label} key={i.label.id} ejecutarAccion={(acc, it) => realizarAccion(`${acc} label`, it, ind)} primero={true} ultimo={true} />
                      ) : (
                        <></>
                      )}
                    </Grid>
                  </Grid>
                </Grid>
                <Grid size="grow" sx={{ p: 0, m: 0 }}>
                  <Typography variant="h6">Dato {i.label.guardado ? "" : "*"}</Typography>
                </Grid>
                <Grid size="grow" sx={{ p: 0, m: 0, pl: 1 }}>
                  <Grid container direction="column">
                    <Grid size="grow" sx={{ m: 0, p: 0 }}>
                      {tipos.map(({ value, label }) => {
                        return (
                          <Button
                            variant="contained"
                            key={`dato_${value}`}
                            sx={{ m: 0, p: 0, ml: 0.5, mb: 1, px: 1, color: "white.main" }}
                            size="small"
                            onClick={() => realizarAccion("setear tipo dato", value, ind)}
                            startIcon={<Icon sx={{ m: 0, p: 0, fontSize: "10px !important" }} className="c-suma" color="inherit" />}
                          >
                            {label}
                          </Button>
                        );
                      })}
                    </Grid>
                    <Grid>
                      {["texto", "titulo", "subtitulo", "hr"].includes(i.dato?.tipo) ? (
                        <Simple item={i.dato} key={i.dato.id} ejecutarAccion={(acc, it) => realizarAccion(`${acc} dato`, it, ind)} primero={true} ultimo={true} />
                      ) : i.dato?.tipo === "codigo" ? (
                        <Codigo item={i.dato} key={i.dato.id} ejecutarAccion={(acc, it) => realizarAccion(`${acc} dato`, it, ind)} primero={true} ultimo={true} />
                      ) : i.dato?.tipo === "tabla" ? (
                        <Tabla item={i.dato} key={i.dato.id} ejecutarAccion={(acc, it) => realizarAccion(`${acc} dato`, it, ind)} primero={true} ultimo={true} />
                      ) : i.dato?.tipo === "detalle" ? (
                        <Detalle item={i.dato} key={i.dato.id} ejecutarAccion={(acc, it) => realizarAccion(`${acc} dato`, it, ind)} primero={true} ultimo={true} />
                      ) : i.dato?.tipo === "imagen" ? (
                        <Imagen item={i.dato} key={i.dato.id} ejecutarAccion={(acc, it) => realizarAccion(`${acc} dato`, it, ind)} primero={true} ultimo={true} />
                      ) : i.dato?.tipo === "lista" ? (
                        <Lista item={i.dato} key={i.dato.id} ejecutarAccion={(acc, it) => realizarAccion(`${acc} dato`, it, ind)} primero={true} ultimo={true} />
                      ) : (
                        <></>
                      )}
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </AcordionTipo>
          ))}
        </Grid>
      </Grid>
    </AcordionTipo>
  );
};

Detalle.propTypes = {
  item: PropTypes.object,
  primero: PropTypes.bool,
  ultimo: PropTypes.bool,

  mostrarBotones: PropTypes.bool,

  ejecutarAccion: PropTypes.func,
};

export default Detalle;
