import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Divider, Grid, List, ListItemButton, Stack, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import AcordeonComponent2 from "../AcordeonComponent/AcordeonComponent2";
import TooltipComponent from "../TooltipComponent/TooltipComponent";
import TextComponent from "../Formulario/TextComponent";
import lightScroll from "../../style/scrollStyle";

const maincolor = (color = "secondary", number = "100") => `${color}.${number}`;

const setBorder = (side = "Bottom", size = 2, color = ["grey", "main"], style = "solid", radius = 1) => ({
  [`border${side}Width`]: size,
  [`border${side}Color`]: maincolor(color[0], color[1]),
  [`border${side}Style`]: style,
  [`border${side}Radius`]: radius,
});

const ScrollableLabel = ({ children, speed = 2, id = "" }) => {
  const containerRef = React.useRef(null);
  const textRef = React.useRef(null);

  const [needsScroll, setNeedsScroll] = React.useState(false);
  const [distance, setDistance] = React.useState(0);

  React.useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;

    if (!container || !text) return;

    const containerWidth = container.clientWidth;
    const textWidth = text.scrollWidth;
    const overflow = textWidth - containerWidth;

    if (overflow > 0) {
      const nextDistance = overflow + 10;

      setNeedsScroll((prev) => (prev !== true ? true : prev));
      setDistance((prev) => (prev !== nextDistance ? nextDistance : prev));
    } else {
      setNeedsScroll((prev) => (prev !== false ? false : prev));
      setDistance((prev) => (prev !== 0 ? 0 : prev));
    }
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        overflow: "hidden",
        whiteSpace: "nowrap",
        position: "relative",
      }}
    >
      <Box
        ref={textRef}
        sx={{
          display: "inline-block",
          whiteSpace: "nowrap",
          "&:hover": { animation: needsScroll ? `scrollText${id} ${speed}s ease-in-out infinite alternate` : "none" },
        }}
      >
        {children}
      </Box>

      <style>
        {`
          @keyframes scrollText${id} {
            0% { transform: translateX(0); }
            100% { transform: translateX(-${distance + 10}px); }
          }
        `}
      </style>
    </Box>
  );
};

const TabComponent = (props) => {
  const {
    opciones = [],
    tabInicial = null,
    tabSeleccionado,
    direccion = "horizontal",
    titulo,
    onCambiarTab = () => {},
    variante = "scrollable",
    bgcolor = "background.main",
    ordenAlfabetico = false,
    filtro = false,
    setFiltro = () => {},
    mostrarTitulo = false,
    botonRegresar = false,
    onRegresar = () => {},
    sx = {},
    cuerpoBg,
    tabHoverExpand = false,
    hideText = false,
  } = props;

  const screenSize = useSelector((state) => state.screen);
  const { name, movil } = screenSize;

  const [tab, setTab] = useState(tabInicial);
  const [abierto, setAbierto] = useState(false);
  const [filtro_categoria, setFiltro_categoria] = useState("");
  const [hoveredTab, setHoveredTab] = useState(null);

  const orientation = useMemo(() => {
    if (direccion === "row" || direccion === "horizontal") {
      return movil || ["xs", "sm"].includes(name) ? "column" : "row";
    }

    if (direccion === "vertical" || direccion === "column") {
      return "column";
    }

    if (!direccion) {
      return name !== "xs" ? "row" : "column";
    }

    return direccion;
  }, [direccion, name, movil]);

  const usarAcordeon = useMemo(() => {
    return orientation === "column" && (direccion === "row" || direccion === "horizontal");
  }, [orientation, direccion]);

  const opcionesFiltradas = useMemo(() => {
    const base = opciones.filter((item) => (item.label || "").toLowerCase().includes(filtro_categoria.toLowerCase()));

    if (!ordenAlfabetico) return base;

    return [...base].sort((a, b) => (a.label || "").localeCompare(b.label || ""));
  }, [filtro_categoria, opciones, ordenAlfabetico]);

  const currentOption = useMemo(() => {
    return opciones.find((item) => item.id === tab);
  }, [tab, opciones]);

  const variant = useMemo(() => {
    return orientation === "vertical" || orientation === "column" ? "scrollable" : variante;
  }, [variante, orientation]);

  const normalizarTabInicial = useCallback((valor) => {
    if (typeof valor === "number") return valor;
    if (typeof valor === "string") return valor;
    if (typeof valor === "boolean") return valor;
    if (typeof valor === "object" && valor !== null) return valor.id;
    return false;
  }, []);

  const emitirCambio = useCallback(
    (newValue) => {
      setTab(newValue);
      onCambiarTab(newValue);
      if (tabSeleccionado) tabSeleccionado(newValue);
    },
    [onCambiarTab, tabSeleccionado],
  );

  const handleChange = useCallback(
    (event, newValue) => {
      event.preventDefault();
      emitirCambio(newValue);
    },
    [emitirCambio],
  );

  useEffect(() => {
    if (tab !== undefined && tab !== null && tab !== false) return;

    if (!tabInicial && tabInicial !== false) {
      if (opciones && opciones.length > 0) {
        const primeraOpcion = ordenAlfabetico ? opcionesFiltradas?.[0] : opciones?.[0];

        if (primeraOpcion?.id !== undefined) {
          emitirCambio(primeraOpcion.id);
          return;
        }
      }

      setTab(false);
      return;
    }

    const nuevoTabInicial = normalizarTabInicial(tabInicial);
    setTab(nuevoTabInicial);
  }, [tab, tabInicial, opciones, opcionesFiltradas, ordenAlfabetico, emitirCambio, normalizarTabInicial]);

  useEffect(() => {
    setFiltro(filtro_categoria);
  }, [setFiltro, filtro_categoria]);

  const tabContent = (opcion, letra) => {
    return (
      <Grid container p={0} m={0} width="100%" overflow="hidden" direction="row" alignItems="center" wrap="nowrap">
        <Grid p={0} m={0} textAlign="center" sx={{ transition: "width 0.4s ease" }} size={hideText ? (opcion.cantidad ? "auto" : "grow") : "auto"}>
          <Typography
            px={0}
            mx={0}
            fontSize="1.5rem"
            sx={{
              color: tab === opcion.id ? opcion.activeIconColor || "white.main" : opcion.iconColor || "primary.main",
            }}
            className={`${opcion.icono || "c-informacion"}`}
          />
        </Grid>

        <Grid
          size="grow"
          sx={
            !tabHoverExpand
              ? {
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  minWidth: 0,
                  transition: "max-width 0.4s ease, opacity 0.3s ease, padding-left 0.3s ease",
                  maxWidth: hideText ? 0 : "100%",
                  opacity: hideText ? 0 : 1,
                  pl: hideText ? 0 : 1,
                  whiteSpace: "nowrap",
                }
              : {
                  overflow: "hidden",
                  maxWidth: orientation === "column" || (orientation === "row" && (tab === opcion.id || hoveredTab === opcion.id)) ? 1000 : 0,
                  opacity: orientation === "column" || (orientation === "row" && (tab === opcion.id || hoveredTab === opcion.id)) ? 1 : 0,
                  transition: "max-width 0.7s ease, opacity 0.7s ease",
                  ml: 1,
                }
          }
        >
          <ScrollableLabel id={String(opcion?.id || "")}>
            <Typography fontSize="1rem" width="100%" color={tab === opcion.id ? opcion.activeColor || "white.main" : opcion.color || "text.main"}>
              {opcion?.label}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: 10, color: tab === opcion.id ? opcion.activeColor || "white.main" : opcion.color || "text.main", m: 0, p: 0, width: "100%" }}>
              {opcion?.descripcion || ""}
            </Typography>
          </ScrollableLabel>
        </Grid>

        {opcion.cantidad && (
          <Grid size="auto" alignContent="center" textAlign="right">
            <Typography pl={2} fontSize="1rem" color={tab === opcion.id ? opcion.activeColor || "white.main" : opcion.color || "text.main"} fontWeight="NORMAL" whiteSpace="nowrap">
              {opcion?.cantidad}
            </Typography>
          </Grid>
        )}
      </Grid>
    );
  };

  const propiedades = (opcion) => {
    return {
      onClick: opcion.readonly ? undefined : (ev) => handleChange(ev, opcion?.id),
      onMouseEnter: tabHoverExpand ? () => setHoveredTab(opcion.id) : undefined,
      onMouseLeave: tabHoverExpand ? () => setHoveredTab(null) : undefined,
      disabled: opcion.readonly,
      sx: {
        minWidth: "unset",
        "&:hover *": { color: opcion.hoverColor || "white.main" },
        "&:hover": { bgcolor: opcion.hoverBg || "#2663ad", backdropFilter: "blur(4px)" },
        cursor: "pointer",
        bgcolor: opcion.readonly ? "grey.main" : tab === opcion.id ? opcion.activeBg || "#0B2967" : opcion.bg,
        borderEndStartRadius: 5,
        borderStartStartRadius: 5,
        borderColor: "#0B2967",
        borderStyle: "solid",
        borderWidth: 0,
        borderLeftWidth: tab === opcion.id ? 2 : 0,
        p: 1.5,
        py: 0.2,
      },
    };
  };

  const customTab = (opcion, letra) => {
    return (
      <Grid key={`${letra}_${opcion?.label}`} {...propiedades(opcion)}>
        <TooltipComponent disableHoverListener={!hideText} titulo={opcion.label} placement={opcion.placement || "bottom"}>
          {tabContent(opcion, letra)}
        </TooltipComponent>
      </Grid>
    );
  };

  const crearBotonDeLista = (opcion, letra) => {
    return (
      <ListItemButton key={`${letra}_${opcion?.label}`} {...propiedades(opcion)}>
        <TooltipComponent disableHoverListener={!hideText} titulo={opcion.label} placement={opcion.placement || "right"}>
          {tabContent(opcion, letra)}
        </TooltipComponent>
      </ListItemButton>
    );
  };

  const imprimirTitulo = (textoTitulo) => {
    return (
      <Grid
        container
        textAlign="center"
        alignItems="center"
        p={0.5}
        borderRadius={1}
        sx={{
          background: "#0B2967",
          borderColor: "primary.main",
          borderWidth: 0,
          borderStyle: "solid",
        }}
      >
        <Grid size={2}>
          <Box width="fit-content" m="auto">
            {botonRegresar && (
              <TooltipComponent
                titulo="Regresar"
                content={
                  <Typography
                    sx={{
                      cursor: "pointer",
                      p: 0,
                      px: 1,
                      m: 0,
                      borderRadius: 2,
                      "&:hover": { bgcolor: "white.main_20" },
                    }}
                    className="c-derecha-arriba-izquierda"
                    color="white.main"
                    fontSize="1rem"
                    onClick={onRegresar}
                  />
                }
              />
            )}
          </Box>
        </Grid>

        <Grid
          size="auto"
          sx={{
            transition: "max-width 0.5s ease, opacity 0.5s ease, padding-left 0.5s ease",
            maxWidth: hideText ? 0 : 10000,
            opacity: hideText ? 0 : 1,
            pl: hideText ? 0 : 1,
          }}
        >
          <Typography color="white.main" fontFamily="arial">
            {textoTitulo}
          </Typography>
        </Grid>

        <Grid size="grow"></Grid>
      </Grid>
    );
  };

  const tabs = (
    <Box sx={{ direction: "ltr !important", maxWidth: "100%", p: 0, ...sx }}>
      {filtro && mostrarTitulo && (
        <Grid container width="100%" sx={{ position: "sticky", top: 0, zIndex: 1000, p: 0.5, borderRadius: 0, borderStartStartRadius: 2 }} bgcolor="transparent">
          {mostrarTitulo && (
            <Grid container size={12} sx={{ direction: "ltr" }} width="100%">
              <Grid size={12}>{imprimirTitulo(titulo || "")}</Grid>
            </Grid>
          )}

          {filtro && (
            <Grid
              size={12}
              sx={{
                mt: 0,
                transition: "max-width 0.5s ease, opacity 0.5s ease, padding-left 0.5s ease",
                maxWidth: hideText ? 0 : 10000,
                opacity: hideText ? 0 : 1,
                px: 0,
                bgcolor,
              }}
              width="100%"
            >
              <TextComponent
                input={{
                  id: "filtro_modulo",
                  tipo: "text",
                  label: hideText ? " " : `Filtrar ${titulo}`,
                  val: filtro_categoria,
                  helper: false,
                  readonly: false,
                }}
                onInput={setFiltro_categoria}
              />
            </Grid>
          )}
        </Grid>
      )}

      <Grid sx={{ background: cuerpoBg }}>
        {orientation === "row" ? (
          <Stack direction={orientation} sx={{ alignItems: "center", ...lightScroll }} divider={<Divider orientation="vertical" flexItem />}>
            {opcionesFiltradas.map((opcion) => {
              const letra = opcion?.label?.charAt?.(0)?.toUpperCase?.() || "";
              return customTab(opcion, letra);
            })}
          </Stack>
        ) : (
          <List sx={{ direction: "ltr", flex: 1 }}>
            {opcionesFiltradas.map((opcion) => {
              const letra = opcion?.label?.charAt?.(0)?.toUpperCase?.() || "";

              return (
                <React.Fragment key={`list_${opcion?.id || opcion?.label}`}>
                  {crearBotonDeLista(opcion, letra)}
                  <Divider sx={{ bgcolor: "#0B2967" }} />
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Grid>

      {!usarAcordeon && (
        <Box key={`tabPanel_${currentOption?.id}`} label={currentOption?.label} sx={{ minHeight: "100%", minWidth: "100%", maxWidth: "100%", p: 0, m: 0 }}>
          {currentOption?.content}
        </Box>
      )}
    </Box>
  );

  return (
    <>
      {usarAcordeon ? (
        <AcordeonComponent2
          propiedades={{ bgcolorAcordeon: "transparent", bgcolor: "#0B2967" }}
          expandido={abierto}
          expandir={(ev, ex) => {
            if (ex !== undefined) setAbierto(ex);
          }}
          titulo={
            <Grid container width="100%" p={0.5}>
              <Grid size="grow">{titulo || " "}</Grid>
              <Grid size="auto">
                <Typography className={abierto ? "c-arriba" : "c-abajo"} />
              </Grid>
            </Grid>
          }
          cuerpo={tabs}
        />
      ) : (
        tabs
      )}

      {usarAcordeon && currentOption?.content}
    </>
  );
};

ScrollableLabel.propTypes = {
  children: PropTypes.any,
  speed: PropTypes.number,
  id: PropTypes.string,
};

TabComponent.propTypes = {
  opciones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      label: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
      icono: PropTypes.string,
      bgcolor: PropTypes.string,
      borderColor: PropTypes.string,
      content: PropTypes.any,
      tooltip: PropTypes.string,
    }),
  ),
  sx: PropTypes.object,
  tabInicial: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool, PropTypes.object]),
  tabSeleccionado: PropTypes.func,
  direccion: PropTypes.string,
  titulo: PropTypes.string,
  mostrarTitulo: PropTypes.bool,
  onCambiarTab: PropTypes.func,
  variante: PropTypes.string,
  bgcolor: PropTypes.string,
  cuerpoBg: PropTypes.string,
  filtro: PropTypes.bool,
  ordenAlfabetico: PropTypes.bool,
  setFiltro: PropTypes.func,
  botonRegresar: PropTypes.bool,
  onRegresar: PropTypes.func,
  tabHoverExpand: PropTypes.bool,
  hideText: PropTypes.bool,
};

export default TabComponent;
