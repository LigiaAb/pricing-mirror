import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useTheme } from "@emotion/react";
import { Box, Button, Divider, Grid, Icon, Skeleton, Stack, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import icono from "./bandera-derecha.svg";

const propiedadesBase = {
  id: "value",
  actual: "actual",
  done: "done",
  next: "next",
  label: "label",
  icon: "icon",
  terminal: "finalizado",
  siguiente: "siguiente",
};

const boxStyle = (color) => ({
  position: "relative",
  color: "white",
  backgroundColor: `${color}`,
  width: "100%",
  clipPath: `polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%)`, // Mantén el clipPath
  py: "4px",
  pl: "6px",
  pr: "15px",
  boxSizing: "border-box",
  overflow: "hidden",
  borderBottomLeftRadius: "5px",
  borderTopLeftRadius: "5px",
  flex: 1,
  alignContent: "space-evenly",
  minWidth: "100px",
  minHeight: "40px",
});

const StepperComponent = (props) => {
  const { sx = {}, estados = [], estado = -1, propiedades = {}, autorizacion, siguienteProps = () => {}, anteriorProps = () => {}, autorizarProps = () => {} } = props;
  const screenSize = useSelector((state) => state.screen);
  const { palette } = useTheme();
  const { id, actual, done, next, label, icon, terminal, siguiente } = {
    ...propiedadesBase,
    ...propiedades,
  };
  const { mensaje, cargando } = useSelector((state) => state.status);

  const estadoActual = useMemo(() => estados.map((i, index_item) => ({ ...i, index_item })).find((i) => i[id] === estado), [estados, id, estado]);

  const RenderEstado = ({ item, ind }) => {
    return (
      <Grid
        key={item[id]}
        sx={{
          ...boxStyle(ind < estadoActual?.index_item ? "green.main" : item[id] === estado ? "primary.main" : "grey.main"),
        }}
        textAlign="center"
      >
        <Typography fontSize={ind < estadoActual?.index_item ? 8 : undefined} color={ind < estadoActual?.index_item ? "white.300" : item[id] === estado ? "white.main" : "black.main"}>
          {item[label]}
        </Typography>
        {ind < estadoActual?.index_item && <Typography className={"c-cheque"} color={ind <= item.index_item ? "white.main" : item[id] === estado ? "primary.main" : "grey.main"} />}
      </Grid>
    );
  };

  RenderEstado.propTypes = { item: PropTypes.object, ind: PropTypes.number };

  return (
    <Box sx={{ m: 0, p: 0 }}>
      <Grid container direction="row" spacing={1} m={1} sx={{ width: "100%", justifyContent: "space-around" }}>
        <Grid width="100%" className="scroll" container justifyContent="space-around">
          <Stack
            direction="row"
            spacing={2}
            className="scroll"
            sx={{
              maxWidth: "100%",
              minWidth: screenSize.name === "xs" ? "max-content" : "max-content",
              direction: "row",
              margin: "auto",
              display: "flex",
              justifyContent: "space-between",
            }}
            key={JSON.stringify(estado)}
          >
            {estados
              .map((i, index_item) => ({ ...i, index_item }))
              .map((i, ind) => (
                <Grid
                  key={i[id]}
                  sx={{
                    flexDirection: "column",
                    margin: "auto",
                    display: "flex",
                    justifyContent: "space-between",
                    width: "auto",
                  }}
                  textAlign="center"
                >
                  <RenderEstado item={i} ind={i.index_item} key={i[id]} />
                </Grid>
              ))}
          </Stack>
        </Grid>
        <Divider />
        <Grid
          container
          sx={{
            minWidth: "100%",
            width: "100%",
            justifyContent: "space-around",
          }}
        >
          <Grid size="auto">
            {(estados || []).findIndex((i) => i[id] === estado) > 0 && (
              <Button
                disabled={estadoActual && estadoActual[terminal] ? false : anteriorProps.disabled}
                onClick={() => (anteriorProps.onClick ? anteriorProps.onClick() : "")}
                sx={{ m: 0, p: 0, px: 1 }}
                variant="contained"
              >
                <Icon className="c-izquierda-simple" sx={{ m: 0, p: 0, mr: 1, fontSize: 10 }} /> {anteriorProps.label || "Anterior"}
              </Button>
            )}
          </Grid>
          <Grid size="grow"></Grid>
          <Grid size="auto" my="auto">
            {autorizacion && (
              <Button
                disabled={estadoActual && estadoActual[terminal] ? false : autorizarProps.disabled}
                onClick={() => (autorizarProps.onClick ? autorizarProps.onClick() : "")}
                color="success"
                sx={{ m: 0, p: 0, px: 1 }}
                variant="contained"
              >
                <Icon className="c-usuario" sx={{ m: 0, p: 0, mr: 1, fontSize: 10 }} /> {autorizarProps.label || "Autorizar"}
              </Button>
            )}
          </Grid>
          <Grid size="auto" container direction="column" columnSpacing={0.5}>
            {estadoActual ? (
              estadoActual[siguiente] ? (
                Array.isArray(estadoActual[siguiente]) ? (
                  estadoActual[siguiente].map((i) => (
                    <Grid size="auto" key={i[id]}>
                      <Button
                        disabled={
                          estadoActual && estadoActual[terminal]
                            ? false
                            : siguienteProps.disabled
                              ? typeof siguienteProps.disabled === "boolean"
                                ? siguienteProps.disabled
                                : siguienteProps.disabled(i)
                              : null
                        }
                        onClick={(ev) => {
                          ev.preventDefault();
                          siguienteProps.onClick ? siguienteProps.onClick(i) : "";
                        }}
                        sx={{ m: 0, p: 0, px: 1 }}
                        variant="contained"
                      >
                        {i[label]}
                        <Icon className="c-derecha-simple" sx={{ m: 0, p: 0, ml: 1, fontSize: 10 }} />
                      </Button>
                    </Grid>
                  ))
                ) : (
                  <Button
                    disabled={
                      estadoActual && estadoActual[terminal]
                        ? false
                        : siguienteProps.disabled
                          ? typeof siguienteProps.disabled === "boolean"
                            ? siguienteProps.disabled
                            : siguienteProps.disabled(estadoActual[siguiente])
                          : null
                    }
                    onClick={(ev) => {
                      ev.preventDefault();
                      siguienteProps.onClick ? siguienteProps.onClick(estadoActual[siguiente]) : "";
                    }}
                    sx={{ m: 0, p: 0, px: 1 }}
                    variant="contained"
                    key={estadoActual[siguiente][id]}
                  >
                    {estadoActual[siguiente][label]}
                    <Icon className="c-derecha-simple" sx={{ m: 0, p: 0, ml: 1, fontSize: 10 }} />
                  </Button>
                )
              ) : (
                ""
              )
            ) : (
              ""
            )}
            {/* {(estados || []).findIndex((i) => i[id] === estado) <
              estados.length - 1 && (
              <Button
                disabled={
                  estadoActual && estadoActual[terminal]
                    ? false
                    : siguienteProps.disabled
                }
                onClick={() =>
                  siguienteProps.onClick ? siguienteProps.onClick() : ""
                }
                sx={{ m: 0, p: 0, px: 1 }}
                variant="contained"
              >
                {siguienteProps.label || "Siguiente"}{" "}
                <Icon
                  className="c-derecha-simple"
                  sx={{ m: 0, p: 0, ml: 1, fontSize: 10 }}
                />
              </Button>
            )} */}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

StepperComponent.propTypes = {
  sx: PropTypes.object,
  estados: PropTypes.array,
  autorizacion: PropTypes.bool,
  estado: PropTypes.number,
  siguienteProps: PropTypes.shape({
    onClick: PropTypes.func,
    disabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  }),
  anteriorProps: PropTypes.shape({
    onClick: PropTypes.func,
    disabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  }),
  autorizarProps: PropTypes.shape({
    onClick: PropTypes.func,
    disabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  }),
  propiedades: PropTypes.shape(Object.keys(propiedadesBase).map((k) => PropTypes.string)),
};

export default StepperComponent;
