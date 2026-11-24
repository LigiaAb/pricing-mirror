import React, { useCallback, useEffect, useMemo, useState, forwardRef, useImperativeHandle } from "react";
import PropTypes from "prop-types";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { Box, Button, Divider, Grid, Link, List, ListItem, ListItemButton, ListItemText, Typography, Skeleton } from "@mui/material";
import { groupPropTypes, inputPropTypes } from "./";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import TextComponent from "./TextComponent";
import { useNavigate } from "react-router-dom";
import SelectComponent from "./SelectComponent";
import { DatePicker, DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import DatePickerComponent from "./DatePickerComponent";
import { useSelector } from "react-redux";
import RadioComponent from "./RadioComponent";
import SubirArchivoComponent from "./SubirArchivoComponent";
import TextEditorComponent from "./TextEditor/TextEditorComponent";
import CheckboxComponent from "./CheckboxComponent";
import ModalSelectComponent from "./ModalSelectComponent";
import DateTimePickerComponent from "./DateTimePIckerComponent";
import DateTimePickerComponent2 from "./DateTimePickerComponent2";
import ToggleComponent from "./ToggleComponent";
import ActionAlertComponent from "../Dialog/ActionAlertComponent";
import { sk } from "date-fns/locale";
import { valid } from "node-html-parser";
import SelectQueryComponent from "./SelectQueryComponent";
import BandaAlertaComponent from "../Alertas/BandaAlertaComponent";
import SubirArchivoComponent2 from "./SubirArchivoComponent2";
import TooltipComponent from "../TooltipComponent/TooltipComponent";

const maincolor = (number = "200") => `background.${number}`;

const botonesBase = {
  agregar: { visible: true, texto: "Agregar", onClick: null, color: "primary", icono: "c-suma" },
  cancelar: { visible: false, texto: "Cancelar", onClick: null, color: "error", icono: "c-anular" },
  guardar: { visible: false, texto: "Guardar", onClick: null, color: "secondary", icono: "c-guardar" },
  filtrar: { visible: false, texto: "Filtrar", onClick: null, color: "info", icono: "c-info" },
};

const propiedadesSinFondo = ["titulo", "separador", "subtitulo", "comentario"];

const ScrollableLabel = ({ children, speed = 6, id = "" }) => {
  const containerRef = React.useRef(null);
  const textRef = React.useRef(null);

  const [needsScroll, setNeedsScroll] = React.useState(false);
  const [movePx, setMovePx] = React.useState(0);

  React.useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;

    if (!container || !text) return;

    const overflow = text.scrollWidth - container.offsetWidth;

    if (overflow > 0) {
      setNeedsScroll(true);
      setMovePx(overflow);
    } else {
      setNeedsScroll(false);
      setMovePx(0);
    }
  }, [children]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: "100%",
        overflow: "hidden",
        whiteSpace: "nowrap",
        position: "relative",
      }}
    >
      <Box
        ref={textRef}
        component="span"
        sx={{
          display: "inline-block",
          width: "100%",
          whiteSpace: "nowrap",
          ...(needsScroll && {
            "&:hover": {
              animation: `scrollText_${id} ${speed}s linear infinite alternate`,
            },
          }),
        }}
      >
        {children}
      </Box>

      {needsScroll && (
        <style>
          {`
            @keyframes scrollText_${id} {
              from { transform: translateX(0); }
              to   { transform: translateX(-${movePx}px); }
            }
          `}
        </style>
      )}
    </Box>
  );
};

const MensajeTipoInputNoValido = ({ input }) => {
  const navigate = useNavigate();
  const goTo = (ev) => {
    ev.preventDefault();
    navigate("/documentacion/componentes/forumario");
  };
  return (
    <Typography variant="caption" textAlign="center" lineHeight={0.5} m={0} p={0} px={1}>
      El input {" [ "}
      <Typography variant="caption" fontWeight="bold">
        {input.tipo}
      </Typography>
      {" ] "}
      no es valido, favor verificar en la <Link onClick={goTo}>libreria de tipos de inputs</Link>.
    </Typography>
  );
};

const ForwardedFormularioComponent = (props, ref) => {
  const {
    inputs: inputsProps,
    grupos: gruposProps,
    data,
    onInput,
    unaColumna,
    botones,
    background = false,
    isLoading = false,
    botonesDerecha = true,
    botonesIzquierda = false,
    botonesCentro = false,
  } = props;
  const { movil } = useSelector((state) => state.screen);

  const screenInfo = useSelector((state) => state.screen);
  const screenSize = useMemo(() => screenInfo?.name, [screenInfo]);
  const [intento, setIntento] = useState(0);
  const { themeMode } = useSelector((state) => state.theme);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const bgcolor = useMemo(() => background || maincolor(themeMode === "dark" ? 100 : 800), [background, themeMode]);

  const botonesFormulario = useMemo(
    () => ({
      ...botonesBase,
      ...botones,
      agregar: { ...botonesBase["agregar"], ...botones?.agregar },
      cancelar: { ...botonesBase["cancelar"], ...botones?.cancelar },
      guardar: { ...botonesBase["guardar"], ...botones?.guardar },
      filtrar: { ...botonesBase["filtrar"], ...botones?.filtrar },
    }),
    [botones],
  );

  const inputs = useMemo(() => inputsProps || data?.inputs || [], [inputsProps, data]);
  const grupos = useMemo(() => gruposProps || data?.grupos || [], [gruposProps, data]);

  const verificarSiTieneValor = (input) => {
    switch (input.tipo) {
      case "texto":
      case "text":
      case "password":
      case "email":
      case "archivo":
      case "date":
      case "datetime":
      case "textarea":
        return !input.val || input.val === "";
      case "select":
      case "modalselect":
      case "radio":
      case "toggle":
        return !input.val;
      case "checkbox":
        return !input.val || input.val.length < 1;

      case "number":
        return !input.val;

      default:
        return false;
    }
  };

  const obtenerTamanoDeInputSegunTipo = useCallback(
    (input) => {
      if (unaColumna) return 12;
      else
        switch (screenSize) {
          case "md":
          case "lg":
          case "xl":
            switch (input.tipo) {
              case "text":
              case "number":
              case "password":
              case "email":
              case "select":
              case "selectQuery":
              case "modalselect":
              case "date":
              case "datetime":
              case "archivo":
              case "textarea":
              case "toggle":
                return 6;

              case "texteditor":
                return 6;

              case "radio":
                return 6;

              case "titulo":
              case "comentario":
              case "subtitulo":
              case "separador":
                return 12;

              default:
                return 6;
            }

          case "sm":
          case "xs":
            switch (input.tipo) {
              case "text":
              case "number":
              case "password":
              case "email":
              case "select":
              case "date":
              case "archivo":
              case "radio":
                return 6;

              default:
                return 6;
            }

          default:
            return 6;
        }
    },
    [screenSize, unaColumna],
  );

  const listaInputs = useMemo(() => (inputs || []).map((i) => (i.size ? i : { ...i, size: obtenerTamanoDeInputSegunTipo(i) || 4 })), [inputs, obtenerTamanoDeInputSegunTipo]);

  const validarCampos = useCallback(() => {
    setIntento((i) => i + 1);

    const requeridos = listaInputs.filter((i) => i.requerido).filter(verificarSiTieneValor);

    if (requeridos.length > 0) {
      setError(true);
      setErrorMessage(
        <Typography>
          Hay campos requeridos vacios: <br />
          <List>
            {requeridos.map((i) => (
              <ListItem key={i.id} disablePadding>
                <ListItemButton sx={{ m: 0, p: 0, pl: 3 }}>
                  <ListItemText sx={{ m: 0, p: 0 }}>{` - ${i.label || i.id}`.toUpperCase()}</ListItemText>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Typography>,
      );
    }

    return requeridos.length === 0;
  }, [listaInputs]);

  // 🔹 Agrupar inputs según grupoId
  const inputsAgrupados = useMemo(() => {
    const agrupados = {};
    listaInputs.forEach((inp) => {
      const grupoKey = inp.grupoId || "_sin_grupo";
      if (!agrupados[grupoKey]) agrupados[grupoKey] = [];
      agrupados[grupoKey].push(inp);
    });
    return agrupados;
  }, [listaInputs]);

  // 🔹 Función para obtener información del grupo
  const getGrupoInfo = useCallback((id) => grupos.find((g) => `${g.id}` === `${id}`), [grupos]);

  const handleSubmit = useCallback(
    (accion = () => {}, skipValidacion = false) => {
      if (skipValidacion) return accion();

      const camposSonValidos = validarCampos();
      if (camposSonValidos) return accion();
    },
    [validarCampos],
  );
  const onChange = useCallback(
    (id, val) => {
      onInput({ id, val });
    },
    [onInput],
  );
  const ObtenerInputSegunTipo = useCallback(
    (input) => {
      const id_generado = `${input.tipo}_${input.id}_c`;

      switch (input.tipo) {
        case "text":
        case "icono":
        case "password":
        case "email":
        case "number":
        case "textarea":
        case "quetzales":
        case "color":
        case "dolares":
          return <TextComponent input={input} onInput={(val) => onChange(input.id, val)} id={id_generado} />;

        case "texteditor":
          return <TextEditorComponent input={input} onInput={(val) => onChange(input.id, val)} id={id_generado} />;

        case "archivo":
          return <SubirArchivoComponent input={input} onInput={(val) => onChange(input.id, val)} id={id_generado} />;

        case "archivo2":
          return <SubirArchivoComponent2 input={input} onInput={(val) => onChange(input.id, val)} id={id_generado} />;

        case "date":
          return <DatePickerComponent input={input} onInput={(val) => onChange(input.id, val)} id={id_generado} />;

        // return <SelectQueryComponent input={input} onInput={(val) => onChange(input.id, val)} id={id_generado} />;

        case "selectQuery":
        case "select":
          return <SelectComponent input={input} onInput={(val) => onChange(input.id, val)} id={id_generado} />;

        case "radio":
          return <RadioComponent input={input} onInput={(val) => onChange(input.id, val)} id={id_generado} />;

        case "checkbox":
          return <CheckboxComponent input={input} onInput={(val) => onChange(input.id, val)} id={id_generado} />;

        case "modalselect":
          return <ModalSelectComponent input={input} onInput={(val) => onChange(input.id, val)} id={id_generado} />;

        case "datetime":
          return <DateTimePickerComponent2 input={input} onInput={(val) => onChange(input.id, val)} id={id_generado} />;

        case "toggle":
          return <ToggleComponent input={input} onInput={(val) => onChange(input.id, val)} id={id_generado} />;

        case "logo":
          return (
            <Typography
              maxWidth="100%"
              id={id_generado}
              fontSize={movil ? 50 : input.fontSize || 100}
              color="primary"
              sx={{ fontWeight: "lighter !important", m: 0, p: 0 }}
              className="c-cropa-dsv-long"
            />
          );

        case "comentario":
          return <Typography id={id_generado}>{input.val}</Typography>;

        case "titulo":
          return (
            <Typography id={id_generado} color={input.color} variant={input.variant || "h4"} p={input.p} alignSelf={"center"}>
              {input.val}
            </Typography>
          );

        case "subtitulo":
          return (
            <Typography id={id_generado} color={input.color} variant={input.variant || "h6"} p={input.p}>
              {input.val}
            </Typography>
          );

        case "alert":
          return (
            <BandaAlertaComponent id={id_generado} {...input} tipo={input.tipo_alert}>
              {input.val}
            </BandaAlertaComponent>
          );

        case "separador":
          return input.val ? (
            <Box px={input.p || 4}>
              <Divider
                id={id_generado}
                color={input.color || "primary.main"}
                sx={{
                  "&:before": { borderTopColor: input.color || "primary.main_30", backdropFilter: "blur(10px)", borderTopWidth: input.width },
                  "&:after": { borderTopColor: input.color || "primary.main_30", backdropFilter: "blur(10px)", borderTopWidth: input.width },
                }}
              >
                <Typography color={input.color} variant={input.variant || "h6"}>
                  {input.val}
                </Typography>
              </Divider>
            </Box>
          ) : (
            <Box px={input.p || 4}>
              <Divider id={id_generado} sx={{ borderColor: input.color || "primary.main", borderBottomWidth: input.width }} />
            </Box>
          );

        default:
          return <MensajeTipoInputNoValido input={input} />;
      }
    },
    [onChange],
  );

  useImperativeHandle(ref, () => ({
    validar: validarCampos,
  }));

  return (
    <Box sx={{ m: 0, p: 0 }} borderRadius={2} bgcolor={background ? "background.main" : ""}>
      {listaInputs ? (
        <form
          noValidate
          autoComplete="off"
          onSubmit={(ev) => {
            ev.preventDefault();
            handleSubmit(botonesFormulario["agregar"].onClick);
          }}
        >
          <Grid container padding={0.5} rowSpacing={0}>
            {/* Mensaje de campos requeridos */}
            <Grid size={12}>
              <Grid container>
                <Grid size="grow"></Grid>
                <Grid size="auto">
                  {listaInputs.filter((i) => i.requerido).length > 0 && (
                    <Typography variant="caption">
                      Los campos con <b>*</b> son <b>requeridos</b>.
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Grid>
            {/* 🔹 Renderizado por grupo */}
            <Grid size={12} container columnSpacing={1} /*  rowSpacing={1} */>
              {Object.keys(inputsAgrupados)
                .filter((grupoId) => {
                  const grupoInfo = getGrupoInfo(grupoId) || {};
                  return grupoInfo.visible !== false;
                })
                .map((grupoId) => {
                  const grupoInfo = getGrupoInfo(grupoId) || {};
                  const inputsDeGrupo = inputsAgrupados[grupoId];
                  const esSinGrupo = grupoId === "_sin_grupo" || !grupoInfo;
                  const columnas = grupoInfo?.columns || 12;
                  const tamanoTitulo = grupoInfo?.titleSize || 2;
                  const tamanoCuerpo = ["auto", "grow"].includes(grupoInfo?.titleSize) ? "grow" : columnas - tamanoTitulo;
                  const mostrarTitulo = grupoInfo?.mostrarTitulo !== undefined ? grupoInfo?.mostrarTitulo : true;

                  const tituloGrupo = (
                    <Grid container direction="row" width="100%" justifyContent="center" columnSpacing={1}>
                      {grupoInfo?.icono && (
                        <Grid>
                          <Typography
                            variant={grupoInfo?.variant || "h4"}
                            sx={{ color: grupoInfo?.error ? "error.main" : grupoInfo?.color ? `${grupoInfo?.color}.main` : "primary.main", p: 0, m: 0, pr: 0.5 }}
                            className={grupoInfo?.icono}
                          />
                        </Grid>
                      )}
                      <Grid>
                        <Typography component="span" sx={{ whiteSpace: "nowrap", display: "inline-block" }} variant={grupoInfo?.variant || "h4"}>
                          {grupoInfo?.label}
                        </Typography>
                      </Grid>
                    </Grid>
                  );

                  return (
                    <Grid
                      container
                      sx={{
                        border: grupoInfo?.border || undefined,
                        borderStyle: "solid",
                        borderWidth: grupoInfo?.error ? grupoInfo?.borderWidth || 1 : grupoInfo?.borderWidth || 0,
                        borderColor: grupoInfo?.error ? "error.main" : grupoInfo?.borderColor ? `${grupoInfo?.borderColor}.${grupoInfo?.borderColoModificator || "main"}` : "grey.200",
                        backdropFilter: "blur(3px)",
                        boxShadow: grupoInfo?.shadow || undefined,
                      }}
                      columnSpacing={0}
                      bgcolor={`${grupoInfo?.bgcolor}.main_10`}
                      key={grupoId}
                      size={screenInfo.movil ? 12 : grupoInfo?.size || 12}
                      columns={columnas}
                      direction={grupoInfo?.direction}
                      borderRadius={grupoInfo.borderRadius || 1}
                      my={grupoInfo?.my || 0.5}
                      pb={grupoInfo?.pb || grupoInfo?.p}
                      p={grupoInfo?.p}
                    >
                      {!esSinGrupo && mostrarTitulo && (
                        <Grid
                          container
                          columnSpacing={0}
                          size={movil ? 12 : grupoInfo?.direction === "row" ? tamanoTitulo : columnas}
                          alignItems="center"
                          direction="row"
                          wrap="nowrap"
                          // border={grupoInfo?.border !== undefined ? grupoInfo?.border : 1}
                          // sx={{ borderColor: grupoInfo?.borderColor || "grey.200" }}
                          bgcolor={`${grupoInfo?.bgcolor}.main_10`}
                          // p={1}
                          sx={{
                            maxWidth: "calc(100%- 1px)",
                            // width: "100%",
                            overflow: "hidden",
                          }}
                          py={grupoInfo?.p}
                        >
                          <ScrollableLabel speed={3} id={grupoInfo?.id}>
                            {grupoInfo?.tipo === "separador" ? (
                              <Grid container direction="row" width="100%">
                                <Divider
                                  width="100%"
                                  color={grupoInfo?.color ? `${grupoInfo?.color}.main` : "primary.main"}
                                  sx={{
                                    flex: 1,
                                    "&:before": {
                                      borderTopColor: grupoInfo?.dividerColor ? `${grupoInfo?.dividerColor}.main` : "text.main_10",
                                      backdropFilter: "blur(2rem)",
                                      borderTopWidth: grupoInfo?.width || 5,
                                    },
                                    "&:after": {
                                      borderTopColor: grupoInfo?.dividerColor ? `${grupoInfo?.dividerColor}.main` : "text.main_10",
                                      backdropFilter: "blur(2rem)",
                                      borderTopWidth: grupoInfo?.width || 5,
                                    },
                                  }}
                                >
                                  {tituloGrupo}
                                </Divider>
                              </Grid>
                            ) : (
                              tituloGrupo
                            )}
                          </ScrollableLabel>
                        </Grid>
                      )}

                      <Grid
                        size={!esSinGrupo && mostrarTitulo ? (grupoInfo?.direction === "row" ? tamanoCuerpo : columnas) : 12}
                        container
                        // border={grupoInfo?.border !== undefined ? grupoInfo?.border : 1}
                        sx={{ borderColor: grupoInfo?.borderColor || "grey.200" }}
                        p={grupoInfo?.error || grupoInfo?.border || grupoInfo?.borderWidth || grupoInfo?.borderColor ? grupoInfo?.p || 1 : grupoInfo?.p || 0}
                        mt={1.5}
                        columnSpacing={0.5}
                        rowSpacing={isLoading ? 0.5 : 1.5}
                        px={grupoInfo?.p}
                      >
                        {inputsDeGrupo.map((inp, ind) => {
                          const input = { ...inp, intento };
                          return (
                            <Grid
                              key={`${input.tipo}_${input.id}`}
                              size={screenInfo.movil ? 12 : { xs: 12, md: input.size !== undefined ? (input.size === "auto" ? "auto" : Number(input.size)) : 4 }}
                              id={`${input.tipo}_${input.id}`}
                              sx={{ ...(input.visible === false ? { display: "none" } : {}), m: 0, p: 0 }}
                              bgcolor={input.readonly && !propiedadesSinFondo.includes(input.tipo) ? bgcolor : "transparent"}
                            >
                              <Box>{isLoading || input.isLoading ? <Skeleton variant="rectangular" width="100%" height={38} /> : ObtenerInputSegunTipo(input, intento)}</Box>
                            </Grid>
                          );
                        })}
                      </Grid>
                      {grupoInfo?.errorMessage && grupoInfo?.error && (
                        <Grid color={grupoInfo?.error ? "error.main" : grupoInfo?.color || "primary.main"} p={0.02} pt={0} size={12}>
                          <Typography variant="caption">Error: {grupoInfo?.errorMessage}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  );
                })}
            </Grid>

            {/* Botones */}
            <Grid size={12} mt={0.5} zIndex={0}>
              <Grid container direction="row" columnSpacing={0.5}>
                {(botonesDerecha || botonesCentro) && <Grid size="grow"></Grid>}
                {listaInputs?.length > 0 &&
                  Object.keys(botonesFormulario)
                    .filter((i) => botonesFormulario[i].visible)
                    .map((i) => (
                      <Grid key={i} size="auto">
                        {
                          <Button
                            disabled={botonesFormulario[i].readonly}
                            size="small"
                            variant={botonesFormulario[i].variant || "outlined"}
                            color={botonesFormulario[i].color || "primary"}
                            sx={{ "&.MuiButton-root": { backgroundColor: (!botonesFormulario[i].variant || botonesFormulario[i].variant === "outlined") && "#FFF !important" } }}
                            onClick={(ev) => {
                              ev.preventDefault();
                              if (botonesFormulario[i].validar || i === "agregar") {
                                handleSubmit(botonesFormulario[i].onClick, false);
                              } else {
                                handleSubmit(botonesFormulario[i]?.onClick, true);
                              }
                            }}
                            type={i === "agregar" ? "submit" : "button"}
                          >
                            {botonesFormulario[i]?.icono &&
                              (typeof botonesFormulario[i]?.icono === "string" ? (
                                <Typography color={botonesFormulario[i]?.textColor} component="span" className={botonesFormulario[i].icono} sx={{ mr: botonesFormulario[i].texto ? 0.5 : 0 }} />
                              ) : (
                                botonesFormulario[i]?.icono
                              ))}
                            <Typography color={botonesFormulario[i]?.textColor} component="span" sx={{ ml: botonesFormulario[i].texto ? 0.5 : 0 }}>
                              {botonesFormulario[i]?.texto || i}
                            </Typography>
                            {botonesFormulario[i]?.icono2 &&
                              (typeof botonesFormulario[i]?.icono2 === "string" ? (
                                <Typography color={botonesFormulario[i]?.textColor} component="span" className={botonesFormulario[i].icono2} sx={{ ml: botonesFormulario[i].texto ? 0.5 : 0 }} />
                              ) : (
                                <Box sx={{ ml: botonesFormulario[i].texto ? 0.5 : 0 }}>{botonesFormulario[i]?.icono2}</Box>
                              ))}
                          </Button>
                        }
                      </Grid>
                    ))}
                {(botonesIzquierda || botonesCentro) && <Grid size="grow"></Grid>}
              </Grid>
            </Grid>
          </Grid>
        </form>
      ) : (
        <Typography variant="h6" component="pre">
          Ocurrió un error al leer los inputs, favor verificar la propiedad [INPUTS].
        </Typography>
      )}

      <ActionAlertComponent openDialog={error} tipo="error" aceptar={() => setError(false)} cancelar={() => setError(false)} activarCanecelar={false} content={<Grid>{errorMessage}</Grid>} />
    </Box>
  );
};

const FormularioComponent = forwardRef(ForwardedFormularioComponent);

const propiedadesRespectoAInputs = {
  inputs: PropTypes.arrayOf(inputPropTypes).isRequired,
  grupos: PropTypes.arrayOf(groupPropTypes),
};

MensajeTipoInputNoValido.propTypes = {
  input: PropTypes.object,
};

ScrollableLabel.propTypes = {
  children: PropTypes.any,
  speed: PropTypes.number,
  id: PropTypes.string,
};

ForwardedFormularioComponent.propTypes = {
  data: PropTypes.objectOf(PropTypes.shape({ ...propiedadesRespectoAInputs })),
  ...propiedadesRespectoAInputs,
  onInput: PropTypes.func,
  unaColumna: PropTypes.bool,
  background: PropTypes.bool,
  botonesDerecha: PropTypes.bool,
  botonesIzquierda: PropTypes.bool,
  botonesCentro: PropTypes.bool,

  botones: PropTypes.objectOf(
    PropTypes.shape({
      visible: PropTypes.bool,
      texto: PropTypes.any,
      onClick: PropTypes.func,
      color: PropTypes.string,
    }),
  ),
  isLoading: PropTypes.bool,
};

export default FormularioComponent;
