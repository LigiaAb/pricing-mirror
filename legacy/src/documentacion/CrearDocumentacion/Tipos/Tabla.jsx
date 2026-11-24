import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Grid, Icon, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import AcordionTipo from "./AcordionTipo";
import { basesSegunTipo, tipos } from "../tipos";
import Simple from "./Simple";
import Detalle from "./Detalle";
import DialogComponent from "../../../components/Dialog/DialogComponent";
import renderItem from "../../renderDocumentacion";
import Imagen from "./Imagen";
import Codigo from "./Codigo";
import { useSelector } from "react-redux";
function replaceId(o, oldId, newId) {
  // Verifica si es un objeto
  if (Array.isArray(o)) {
    return o.map((i) => replaceId(i, oldId, newId));
  } else if (typeof o === "object" && o !== null) {
    let obj = { ...o };
    Object.keys(obj).map((key) => {
      // Si el valor es un objeto o array, aplica la función recursivamente
      if (typeof obj[key] === "object") {
        replaceId(obj[key], oldId, newId);
      }
      if (obj["datos"]) obj["datos"] = replaceId(obj["datos"], oldId, newId);
      if (obj["encabezado"]) obj["encabezado"] = replaceId(obj["encabezado"], oldId, newId);
      // Si encuentra un id que empieza con oldId, lo reemplaza
      if (key === "id" && obj[key].startsWith(oldId)) {
        obj[key] = obj[key].replace(oldId, newId);
      }
    });
    return obj;
  }
}

const Tabla = (props) => {
  const { item, primero, ultimo, ejecutarAccion, mostrarBotones } = props;
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState(tipos[0].value);
  const [contador, setContador] = useState(item.encabezado.length + 1);
  const [renderKey, setRenderKey] = useState(0);
  const [encabezados, setEncabezados] = useState(item.encabezado);
  const [datos, setDatos] = useState(item.datos);
  const [datoSeleccionado, setDatoSeleccionado] = useState(null);
  const { puesto } = useSelector((store) => store.auth);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    setEncabezados(item.encabezado);
    setDatos(item.datos);
    // setDatoSeleccionado((i) => (i ? { ...i, ...item.datos[i.enc_ind][i.ind] } : i));
    // console.log(item);
  }, [item]);

  const manejarDatos = (accion, dato, ind) => {
    setDatos((array) => {
      let newArray = [...array];
      let index = ind ? ind : dato && typeof dato !== "string" ? newArray.findIndex((i) => i.id === dato.id) : 0;

      switch (accion) {
        case "cancelar":
          newArray = newArray.filter((i, ind) => ind !== index);
          setRenderKey((v) => v + 1);
          break;

        case "agregar fila":
          newArray = [...newArray, encabezados.map((i, ind) => ({ ...basesSegunTipo["texto"], id: `${i.id}FI${newArray.length}`, enc_ind: ind, ind: newArray.length }))];
          break;

        case "agregar detalle":
          setOpen(true);
          setDatoSeleccionado(dato);
          // newArray = [...newArray, encabezados.map((i) => "")];
          break;

        case "setear tipo":
          setDatoSeleccionado((i) => ({ ...i, ...basesSegunTipo[dato], id: i.id }));
          // newArray = [...newArray, encabezados.map((i) => "")];
          break;

        case "actualizar":
          newArray[dato.ind] = newArray[dato.ind].map((i) => (i.id === dato.id ? { ...dato } : { ...i }));
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

        default:
          break;
      }
      ejecutarAccion("actualizar", { ...item, datos: newArray });
      return newArray;
    });
  };

  const manejarEncabezado = (accion, encabezado) => {
    setEncabezados((array) => {
      let newArray = [...array];
      let index = encabezado && typeof encabezado !== "string" ? newArray.findIndex((i) => i.id === encabezado.id) : 0;

      switch (accion) {
        case "cancelar":
          newArray = newArray.filter((i) => i.id !== encabezado.id);
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

        case "actualizar":
          newArray[index] = encabezado;
          break;

        case "agregar": {
          setTipo(tipo);
          setContador((i) => i + 1);
          const a = [...newArray, { ...basesSegunTipo[encabezado], id: `${item.id}${encabezado[0].toUpperCase()}${encabezado[1].toUpperCase()}${-1}` }];
          newArray = a.filter((i) => i.id !== item?.id).map((i, ind) => replaceId({ ...i }, i.id, `${item.id}_EN_${i.tipo[0].toUpperCase()}${i.tipo[1].toUpperCase()}${ind}`));
          break;
        }

        default:
          break;
      }
      ejecutarAccion("actualizar", { ...item, encabezado: newArray });
      return newArray;
    });
  };

  return (
    <AcordionTipo
      {...{
        item,
        primero,
        ultimo,
        ejecutarAccion,
        mostrarBotones,
        style: { maxWidth: "100%" },
        guardar: () => {
          setGuardado(true);
          ejecutarAccion("actualizar", { ...item, guardado: true });
        },
      }}
    >
      <Grid container width="100%" size="grow" direction="column" sx={{ p: 0, m: 0, mb: 1 }}>
        {datos.length === 1 && (
          <Grid size="grow" sx={{ p: 0, m: 0 }}>
            <Box sx={{ p: 0.5, pl: 2, width: "100%" }}>
              <Typography variant="h6">Encabezados</Typography>
              <Grid container size={12} directio="column" width="100%">
                <Grid size={12} width="100%" sx={{ m: 0, p: 0 }}>
                  {tipos
                    .filter((i) => ["texto", "titulo", "subtitulo", "hr", "codigo"].includes(i.value))
                    .map(({ value, label }) => {
                      return (
                        <Button
                          variant="contained"
                          key={value}
                          sx={{ m: 0, p: 0, ml: 0.5, mb: 1, px: 1, color: "white.main" }}
                          size="small"
                          onClick={() => manejarEncabezado("agregar", value)}
                          startIcon={<Typography component="span" sx={{ m: 0, p: 0, fontSize: "10px !important" }} className="c-suma" color="inherit" />}
                        >
                          {label}
                        </Button>
                      );
                    })}
                </Grid>
                {encabezados.map((encabezado, index) => (
                  <Grid key={encabezado.id} size={12} width="100%" sx={{ m: 0, p: 0 }}>
                    {["texto", "titulo", "subtitulo", "html", "hr"].includes(encabezado.tipo) ? (
                      <Simple item={encabezado} key={encabezado.id} ejecutarAccion={manejarEncabezado} primero={index === 0} ultimo={index === encabezados.length - 1} mostrarBotones />
                    ) : encabezado.tipo === "codigo" ? (
                      <Codigo item={encabezado} key={encabezado.id} ejecutarAccion={manejarEncabezado} primero={index === 0} ultimo={index === encabezados.length - 1} mostrarBotones />
                    ) : encabezado.tipo === "tabla" ? (
                      <Tabla item={encabezado} key={encabezado.id} ejecutarAccion={manejarEncabezado} primero={index === 0} ultimo={index === encabezados.length - 1} mostrarBotones />
                    ) : encabezado.tipo === "detalle" ? (
                      <Detalle item={encabezado} key={encabezado.id} ejecutarAccion={manejarEncabezado} primero={index === 0} ultimo={index === encabezados.length - 1} mostrarBotones />
                    ) : encabezado.tipo === "imagen" ? (
                      <Imagen item={encabezado} key={encabezado.id} ejecutarAccion={manejarEncabezado} primero={index === 0} ultimo={index === encabezados.length - 1} mostrarBotones />
                    ) : (
                      <></>
                    )}
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        )}
        {encabezados.filter((i) => i.texto !== "").length > 0 && (
          <Grid size="grow" sx={{ p: 0, m: 0, width: "100%" }}>
            <Box sx={{ p: 0.5, width: "100%" }}>
              <Table sx={{ height: "100%" }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ p: 0, m: 0, border: "none", width: "1%" }}></TableCell>
                    <TableCell sx={{ p: 0, m: 0, border: "none", width: "100%" }} colSpan={encabezados.length * 2 - 1}>
                      <Grid container direction="row" sx={{ p: 0, m: 0 }}>
                        <Grid size="auto">
                          <Typography variant="h6">Datos</Typography>
                        </Grid>
                        <Grid size="grow" textAlign="right" sx={{ p: 0, m: 0 }}>
                          <Typography variant="caption" sx={{ p: 0, mx: 1, my: 0, "&.MuiTypography-root": { lineHeight: 0 } }}>
                            Al ingresar la primera fila se deshabilitaran los encabezados
                          </Typography>
                        </Grid>
                      </Grid>
                    </TableCell>
                    <TableCell sx={{ p: 0, m: 0, border: "none", width: "1%" }}>
                      <IconButton color="primary" sx={{ m: 0, p: 0 }} onClick={() => manejarDatos("agregar fila", item)} size="small">
                        <Typography component="span" className="c-suma" fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ p: 0, m: 0, border: "none", width: "1%" }}></TableCell>
                    {encabezados.map((i) => (
                      <TableCell key={i.id} sx={{ p: 0, m: 0, border: "none" }} colSpan={2}>
                        <Typography textAlign="center">{i.texto}</Typography>
                      </TableCell>
                    ))}
                    <TableCell sx={{ p: 0, m: 0, border: "none", width: "1%" }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody sx={{ p: 0, m: 0, height: "100%" }}>
                  {datos.map((dato, ind) => (
                    <TableRow key={"detalle_" + ind} sx={{ p: 0, m: 0, height: "100%" }}>
                      <TableCell sx={{ p: 0, m: 0, border: "none", width: "1%", borderRightWidth: 1, borderRightStyle: "solid", borderRightColor: "grey.200" }}>
                        <Typography variant="caption" color="grey.400">
                          {ind + 1}
                        </Typography>
                      </TableCell>
                      {encabezados.map((i, index) => (
                        <React.Fragment key={`detalle_${dato[index]?.id}`}>
                          <TableCell sx={{ p: 0, px: 1, m: 0, textAlign: "justify" }}>{renderItem(dato[index])}</TableCell>
                          <TableCell
                            sx={{ p: 0, m: 0, borderRightWidth: 1, borderRightStyle: "solid", borderRightColor: "grey.200" }}
                            key={`detalle_boton_${dato[index]?.id}`}
                            width="1%"
                            className={`detalle_hover`}
                          >
                            <IconButton color="secondary" sx={{ m: 0, p: 0 }} onClick={() => manejarDatos("agregar detalle", dato[index])} size="small">
                              <Typography component="span" sx={{ p: 0, m: 0 }} className="c-lapiz" />
                            </IconButton>
                          </TableCell>
                        </React.Fragment>
                      ))}
                      <TableCell sx={{ p: 0, px: 0, m: 0, border: "none", width: "1%", height: "100%" }} width="1%">
                        <Box sx={{ m: 0, p: 0, height: "100%" }}>
                          <Grid container direction="column" sx={{ justifyContent: "space-around", alignItems: "center", height: "100%" }}>
                            <Grid>
                              <IconButton
                                color="primary"
                                sx={{ "&.Mui-disabled": { color: "white.grey_50", opacity: 1 }, m: 0, p: 0 }}
                                disabled={ind === 0}
                                onClick={() => manejarDatos("subir", dato, ind)}
                                size="small"
                              >
                                <Typography component="span" className="c-arriba" fontSize="small" />
                              </IconButton>
                            </Grid>

                            <Grid>
                              <IconButton color="red" sx={{ m: 0, p: 0 }} onClick={() => manejarDatos("cancelar", dato, ind)} size="small">
                                <Typography component="span" className="c-eliminar" fontSize="small" />
                              </IconButton>
                            </Grid>

                            <Grid>
                              <IconButton
                                color="primary"
                                sx={{ "&.Mui-disabled": { color: "white.grey_50", opacity: 1 }, m: 0, p: 0 }}
                                disabled={ind === datos.length - 1}
                                onClick={() => manejarDatos("bajar", dato, ind)}
                                size="small"
                              >
                                <Typography component="span" className="c-abajo" fontSize="small" />
                              </IconButton>
                            </Grid>
                          </Grid>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* {JSON.stringify(datos)} */}
            </Box>
          </Grid>
        )}
      </Grid>
      {/* {JSON.stringify(datoSeleccionado)} */}
      {datoSeleccionado && (
        <DialogComponent openDialog={open} handleClose={() => setOpen(false)} width="auto" height="fit-content" titulo={encabezados[datoSeleccionado.enc_ind]?.texto || ""}>
          <Grid container direction="column">
            <Grid size="grow" sx={{ m: 0, p: 0 }}>
              {tipos.map(({ value, label }) => {
                return (
                  <Button
                    variant="contained"
                    key={`dato_${value}`}
                    sx={{ m: 0, p: 0, ml: 0.5, mb: 1, px: 1, color: "white.main" }}
                    size="small"
                    onClick={() => manejarDatos("setear tipo", value)}
                    startIcon={<Typography component="span" sx={{ m: 0, p: 0, fontSize: "10px !important" }} className="c-suma" color="inherit" />}
                  >
                    {label}
                  </Button>
                );
              })}
            </Grid>
            <Grid>
              {["texto", "titulo", "subtitulo", "hr"].includes(datoSeleccionado.tipo) ? (
                <Simple item={datoSeleccionado} key={datoSeleccionado.id} ejecutarAccion={manejarDatos} primero={true} ultimo={true} />
              ) : datoSeleccionado.tipo === "codigo" ? (
                <Codigo item={datoSeleccionado} key={datoSeleccionado.id} ejecutarAccion={manejarDatos} primero={true} ultimo={true} />
              ) : datoSeleccionado.tipo === "tabla" ? (
                <Tabla item={datoSeleccionado} key={datoSeleccionado.id} ejecutarAccion={manejarDatos} primero={true} ultimo={true} />
              ) : datoSeleccionado.tipo === "detalle" ? (
                <Detalle item={datoSeleccionado} key={datoSeleccionado.id} ejecutarAccion={manejarDatos} primero={true} ultimo={true} />
              ) : datoSeleccionado.tipo === "imagen" ? (
                <Imagen item={datoSeleccionado} key={datoSeleccionado.id} ejecutarAccion={manejarDatos} primero={true} ultimo={true} />
              ) : (
                <></>
              )}
            </Grid>
          </Grid>
        </DialogComponent>
      )}
    </AcordionTipo>
  );
};

Tabla.propTypes = {
  item: PropTypes.object,
  primero: PropTypes.bool,
  ultimo: PropTypes.bool,

  mostrarBotones: PropTypes.bool,

  ejecutarAccion: PropTypes.func,
};

export default Tabla;
