import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Grid, Box, Typography, IconButton, Icon, Button, Menu, MenuItem, Tooltip } from "@mui/material";
import { createEvents } from "ics";
import { useNavigate } from "react-router-dom";
import { encryptId } from "../../api/encryptDecrypt";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, getDaysInMonth, startOfWeek, isToday, isWeekend, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import lightScroll from "../../style/scrollStyle";
import RangoFechasAlertComponent from "../Dialog/RangoFechasAlertComponent";
import { tabla_actividades_resumen } from "./HeadersActividades";
import TablaEditableComponent from "../Tabla/TablaEditableComponent";
import { TablaActividades } from "../../views/Actividades/TablaActividades";
import { useFetchEmpUsuPuesto } from "../../hooks/Fetch/useFetchConfiguracion";

// Actividades de ejemplo
const tamanoUno = 2;

const CalendarioComponent = (props) => {
  const { actividades = [], generarActividad, clickActividad = undefined, catalogos, generarReport, renderizarTabla = false, clickFecha } = props;
  const { entidades = [] } = catalogos || {};
  const screenSize = useSelector((state) => state.screen);
  const navigate = useNavigate();
  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);
  const asesores = useFetchEmpUsuPuesto();

  // Estado para el mes y año actual
  const [currentDate, setCurrentDate] = useState(new Date() /* moment() */);
  const [openModal, setOpenModal] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuAnchorEl1, setMenuAnchorEl1] = useState(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const isMenuOpen = Boolean(menuAnchorEl);
  const isMenuOpen1 = Boolean(menuAnchorEl1);

  const handleMenuClick = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };
  const handleMenuClick1 = (event) => {
    setMenuAnchorEl1(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  const handleMenuClose1 = () => {
    setMenuAnchorEl1(null);
  };

  // Obtiene los datos de hoy
  const realYear = useMemo(() => format(new Date(), "yyyy"), []);
  const realMonth = useMemo(() => format(new Date(), "M") - 1, []);
  const realDay = useMemo(() => format(new Date(), "d"), []);

  // Obtiene el año actual
  const currentYear = useMemo(() => format(currentDate, "yyyy"), [currentDate]);
  const currentMonth = useMemo(() => format(currentDate, "M") - 1, [currentDate]);
  const currentDay = useMemo(() => format(currentDate, "d"), [currentDate]);

  // Feriados de ejemplo
  const holidays = useMemo(() => ["01-01", "05-01", "07-01", "08-15", "09-15", "10-20", "11-01", "12-24", "12-25", "12-31"].map((i) => `${currentYear}-${i}`), [currentYear]);

  // Obtiene los días en el mes actual y el índice del primer día
  const { daysInMonth, firstDayOfMonth, isCurrentYear } = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = startOfMonth(currentDate);
    const isCurrentYear = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
    return { daysInMonth, firstDayOfMonth, isCurrentYear };
  }, [currentDate]);

  // Filtra las actividades por fecha
  const getActivitiesForDay = useCallback(
    (day) => {
      const date = new Date(currentYear, currentMonth, day);
      const formattedDate = format(date, "yyyy-MM-dd");
      return actividades.filter((activity) => {
        const formatDateActivity = format(activity.fecha_programada, "yyyy-MM-dd");
        return formatDateActivity === formattedDate;
      });
    },
    [actividades, currentYear, currentMonth],
  );

  // Comprueba si el día es feriado
  const isHoliday = useCallback(
    (day) => {
      const date = new Date(currentYear, currentMonth, day);
      return holidays.some((holiday) => isSameDay(date, new Date(holiday.split("-")[0], Number(holiday.split("-")[1]) - 1, holiday.split("-")[2])));
    },
    [currentMonth, currentYear, holidays],
  );

  // Comprueba si el día es fin de semana
  const isWeekend_ = useCallback(
    (day) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      return isWeekend(date);
    },
    [currentDate],
  );

  // Comprueba si el día es hoy
  const isToday_ = useCallback(
    (day) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      return isToday(date);
    },
    [currentDate],
  );

  // Cambia al mes anterior
  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  // Cambia al siguiente mes
  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // Función para exportar actividades a .ics
  const exportToICS = (datos, rango) => {
    // setOpenModal(true)
    const events = datos.map((activity) => {
      const date = activity.fecha;
      // console.log(date);
      const dateArr = format(date, "yyyy-MM-dd-H-m").split("-").map(Number);
      return {
        start: dateArr, // new Date(date),
        title: `${activity.nom_tipo} - ${activity.asunto} - ${entidades.find((i) => i.entidad_id === activity.cod_cliente)?.entidad_nombre}`,
        description: `Actividad: ${activity.fecha}`,
      };
    });

    createEvents(events, (error, value) => {
      if (error) {
        // console.error(error);
        return;
      }
      // Crear un enlace para descargar el archivo .ics
      const blob = new Blob([value], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Actividades - ${rango}.ics`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const years = Array.from({ length: 15 }, (_, i) => currentYear - 7 + i); // Range: [currentYear - 25, currentYear + 24]

  useEffect(() => {
    const day = format(new Date(), "d");
    const activitiesForDay = getActivitiesForDay(day);
    const holiday = isHoliday(day);
    const weekend = isWeekend_(day);
    const today = isToday_(day);
    setDiaSeleccionado({
      dia: format(new Date(currentYear, currentMonth, currentDay), "dd-MM-yyyy", { locale: es }),
      diaTexto: `${format(new Date(currentYear, currentMonth, currentDay), "EEEE(dd) 'de' MMMM 'de' yyyy", { locale: es })}`,
      holiday,
      weekend,
      today,
      activitiesForDay,
      day: day,
    });
  }, []);

  useEffect(() => {
    if (!diaSeleccionado?.day) return;

    const day = diaSeleccionado.day;

    const activitiesForDay = getActivitiesForDay(day);
    const holiday = isHoliday(day);
    const weekend = isWeekend_(day);
    const today = isToday_(day);

    setDiaSeleccionado((prev) => ({
      ...prev,
      holiday,
      weekend,
      today,
      activitiesForDay,
    }));
  }, [actividades, currentDate]);

  const datos_ = useMemo(() => {
    return actividades.map((i) => ({
      ...i,
      // cliente_desc: i.cliente.entidad_nombre,
      fecha: i.fecha_programada,
      cliente_desc: entidades ? entidades.find((j) => j.entidad_id === i.cod_cliente)?.entidad_nombre : "",
    }));
  }, [actividades]);

  useEffect(() => {
    if (clickFecha) clickFecha(new Date(currentYear, currentMonth, 1));
  }, [currentYear, currentMonth]);

  return !diaSeleccionado ? null : (
    <Box sx={{ padding: { xs: 1, md: 2 }, bgcolor: themeMode === "dark" ? "background.50_20" : "background.900_20", color: "text.main" }} borderRadius={2.5}>
      <Grid container direction={["xs", "sm"].includes(screenSize.name) ? "column" : "row"} sx={{}}>
        <Grid container direction="column" size={["xs", "sm"].includes(screenSize.name) ? 12 : 5}>
          {/* Cabecera del calendario */}
          <Grid container direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            {/* <Grid size={{ xs: 12 }} textAlign="center">
          Hoy: {format(currentDate, "dd-MM-yyyy", { locale: es }).toUpperCase()}
        </Grid> */}
            <Grid size="auto">
              <IconButton onClick={handlePrevMonth} sx={{ color: `primary.${opositeMode}` }}>
                <Typography className="c-izquierda-simple" />
              </IconButton>
            </Grid>

            <Grid size="grow" justifyContent="center" alignItems="center" container direction="column">
              <Grid size="auto">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate(encryptId("new"))}
                  sx={{ "&:hover": { bgcolor: "primary.100" }, borderColor: `primary.${opositeMode}`, color: `primary.${opositeMode}`, mr: 1 }}
                >
                  <Typography pr={1} margin="auto" sx={{ lineHeight: 1 }} textTransform="none" fontWeight="bold" variant="button">
                    Crear Actividad
                  </Typography>
                  <Typography margin="auto" sx={{ lineHeight: 1 }} fontSize="1rem" className="c-suma" />
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setCurrentDate(new Date())}
                  sx={{ "&:hover": { bgcolor: "primary.100" }, borderColor: `primary.${opositeMode}`, color: `primary.${opositeMode}`, mr: 1 }}
                >
                  <Typography pr={1} margin="auto" sx={{ lineHeight: 1 }} textTransform="none" fontWeight="bold" variant="button">
                    Ir a Hoy
                  </Typography>
                  <Typography margin="auto" sx={{ lineHeight: 1 }} fontSize="1rem" className="c-calendario" />
                </Button>

                <Tooltip title="Exportar Actividades">
                  <IconButton onClick={() => setOpenModal(true)} variant="contained" sx={{ color: `primary.${opositeMode}`, border: 1 }}>
                    <Icon component="span" sx={{ fontSize: "1rem" }} className="c-descargar" />
                  </IconButton>
                </Tooltip>
              </Grid>

              <Grid size="grow"></Grid>
              <Grid size={{ xs: 12, md: "auto" }} textAlign="center">
                <Button
                  onClick={handleMenuClick}
                  sx={{
                    color: themeMode == "dark" ? "white.main" : "primary.main",
                    "&:hover": {
                      bgcolor: "primary.500",
                      color: themeMode == "light" ? "white.main" : undefined,
                    },
                    p: 0,
                    m: 0,
                    px: 2,
                  }}
                >
                  <Typography variant={["xs", "sm"].includes(screenSize.name) ? "h6" : "h4"}>{format(currentDate, "MMMM", { locale: es }).toUpperCase()}</Typography>
                </Button>

                <Menu
                  anchorEl={menuAnchorEl}
                  open={isMenuOpen}
                  onClose={handleMenuClose}
                  PaperProps={{
                    style: {
                      width: "255px",
                    },
                  }}
                >
                  <Grid container bgcolor="background.main" width="100%" px={1}>
                    <Grid size="auto">{format(new Date(currentYear, currentMonth), "MMMM, yyyy", { locale: es })}</Grid>
                    <Grid size="grow"></Grid>
                    <Grid size="auto" textAlign="right">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setCurrentDate(new Date())}
                        sx={{ "&:hover": { bgcolor: "primary.100" }, borderColor: `primary.${opositeMode}`, color: `primary.${opositeMode}` }}
                      >
                        <Typography pr={1} margin="auto" sx={{ lineHeight: 1 }} textTransform="none" fontWeight="bold" variant="button">
                          Ir a Hoy
                        </Typography>
                        <Typography margin="auto" sx={{ lineHeight: 1 }} fontSize="1rem" className="c-calendario" />
                      </Button>
                    </Grid>
                    <Grid size={12} container spacing={1} mt={2}>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                        <Grid size={4} key={i}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setCurrentDate(new Date(currentYear, i))}
                            sx={{
                              p: 0,
                              m: 0,
                              width: "100%",
                              "&:hover": { bgcolor: "primary.100" },
                              bgcolor: realMonth === i ? "secondary.main" : currentMonth === i ? "primary.main" : undefined,
                              borderColor: realMonth === i ? "black.main" : currentMonth === i ? "white.main" : `primary.${opositeMode}`,
                              color: realMonth === i ? "black.main" : currentMonth === i ? "white.main" : `primary.${opositeMode}`,
                            }}
                          >
                            {format(new Date(currentYear, i), "MMMM", { locale: es })}
                          </Button>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                </Menu>
              </Grid>
              <Grid size={{ xs: 12, md: "auto" }} textAlign="center">
                <Button
                  onClick={handleMenuClick1}
                  sx={{
                    color: themeMode == "dark" ? "white.main" : "primary.main",
                    "&:hover": {
                      bgcolor: "primary.500",
                      color: themeMode == "light" ? "white.main" : undefined,
                    },
                    p: 0,
                    m: 0,
                    px: 2,
                  }}
                >
                  <Typography variant={["xs", "sm"].includes(screenSize.name) ? "h6" : "h4"}>{format(currentDate, "yyyy").toUpperCase()}</Typography>
                </Button>
                <Menu
                  anchorEl={menuAnchorEl1}
                  open={isMenuOpen1}
                  onClose={handleMenuClose1}
                  PaperProps={{
                    style: {
                      width: "255px",
                    },
                  }}
                >
                  <Grid container bgcolor="background.main" width="100%" px={1}>
                    <Grid size="auto">{format(new Date(currentYear, currentMonth), "MMMM, yyyy", { locale: es })}</Grid>
                    <Grid size="grow"></Grid>
                    <Grid size="auto" textAlign="right">
                      <Button variant="outlined" size="small" onClick={() => setCurrentDate(new Date())} sx={{ "&:hover": { bgcolor: "primary.100" } }}>
                        <Typography pr={1} margin="auto" sx={{ lineHeight: 1 }} textTransform="none" fontWeight="bold" variant="button">
                          Ir a Hoy
                        </Typography>
                        <Typography margin="auto" sx={{ lineHeight: 1 }} fontSize="1rem" className="c-calendario" />
                      </Button>
                    </Grid>

                    {/* Grid of years */}
                    <Grid size={12} container spacing={1} mt={2}>
                      {years.map((year) => (
                        <Grid size={4} key={year}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setCurrentDate(new Date(year, currentMonth, currentDay))}
                            sx={{
                              p: 0,
                              m: 0,
                              width: "100%",
                              "&:hover": { bgcolor: "primary.100" },
                              bgcolor: `${realYear}` === `${year}` ? "secondary.main" : `${currentYear}` === `${year}` ? "primary.main" : undefined,
                              borderColor: `${realYear}` === `${year}` ? "black.main" : `${currentYear}` === `${year}` ? "white.main" : `primary.${opositeMode}`,
                              color: `${realYear}` === `${year}` ? "black.main" : `${currentYear}` === `${year}` ? "white.main" : `primary.${opositeMode}`,
                            }}
                          >
                            {year}
                          </Button>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                </Menu>
              </Grid>
              <Grid size="grow"></Grid>
            </Grid>

            <Grid size="auto">
              <IconButton onClick={handleNextMonth} sx={{ color: `primary.${opositeMode}` }}>
                <Typography className="c-derecha-simple" />
              </IconButton>
            </Grid>
          </Grid>

          {/* Días de la semana */}
          <Grid container spacing={0.2}>
            {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((day) => (
              <Grid item size={1.7} key={day}>
                <Typography align="center" color={themeMode == "dark" ? "white.main" : "primary.main"}>
                  {["xs", "sm"].includes(screenSize.name) ? day[0] : day}
                </Typography>
              </Grid>
            ))}
          </Grid>

          {/* Días del mes */}
          <Grid container spacing={0.2}>
            {/* Añadir días vacíos al inicio si el mes no empieza en lunes */}
            {Array.from({ length: (firstDayOfMonth.getDay() || 7) - 1 }).map((_, index) => (
              <Grid item size={1.7} key={`empty-${index}`}></Grid>
            ))}

            {/* Renderizar los días del mes */}
            {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
              const day = dayIndex + 1;
              const activitiesForDay = getActivitiesForDay(day);
              const holiday = isHoliday(day);
              const weekend = isWeekend_(day);
              const today = isToday_(day);

              // if (["xs", "sm"].includes(screenSize.name))
              return (
                <Grid
                  item
                  size={1.7}
                  key={day}
                  onClick={() =>
                    setDiaSeleccionado({
                      dia: format(new Date(currentYear, currentMonth, day), "dd-MM-yyyy", { locale: es }),
                      diaTexto: `${format(new Date(currentYear, currentMonth, day), "EEEE(dd) 'de' MMMM 'de' yyyy", { locale: es })}`,
                      holiday,
                      weekend,
                      today,
                      activitiesForDay,
                      day: day,
                    })
                  }
                >
                  <Box sx={{ bgcolor: today ? "#104f9c26" : holiday ? "accent.main" : weekend ? "background.300" : "background.20" }}>
                    <Box
                      sx={{
                        bgcolor: Number(diaSeleccionado?.day) === Number(day) ? "secondary.main_20" : undefined,
                        "&:hover": { bgcolor: Number(diaSeleccionado?.day) === Number(day) ? "secondary.main_20" : "background.100_50" },
                      }}
                    >
                      <Grid container direction="row" bgcolor={today ? "primary.main" : undefined}>
                        <Grid size={12} bgcolor="background.main">
                          <Typography variant="body1" fontSize="0.7rem" sx={{ textAlign: "center", bgcolor: "background.main", py: 0, color: "text.main" }}>
                            {day}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Grid container py={0.4} justifyContent="center" sx={{ overflowY: "auto", height: "20px" }} direction="row">
                        {activitiesForDay.length > 0 && (
                          <Grid
                            sx={{
                              bgcolor: `secondary.500`,
                              alignItems: "center",
                              width: activitiesForDay.length == 1 ? "5px" : activitiesForDay.length > 1 ? "15px" : undefined,
                              height: "5px",
                              p: 0.5,
                              borderRadius: activitiesForDay.length == 1 ? "50%" : activitiesForDay.length > 1 ? "4px" : undefined,
                              cursor: "pointer",
                            }}
                          ></Grid>
                        )}
                        <Typography variant="caption">{/* {format(new Date(currentYear, currentMonth, day), "dd-MM-yyyy", { locale: es }).toUpperCase()} */}</Typography>
                      </Grid>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Grid>

        <Grid container direction="column" size={["xs", "sm"].includes(screenSize.name) ? 12 : 7}>
          <RangoFechasAlertComponent
            open={openModal}
            handleClose={() => setOpenModal(false)}
            titulo="Actividades a descargar"
            tabla={tabla_actividades_resumen}
            datos={datos_}
            onConfirmar={exportToICS}
          />

          <Grid
            container
            direction="row"
            borderRadius={1}
            p={1}
            sx={{
              borderRadius: "20px",
              background: themeMode === "dark" ? "linear-gradient(315deg, #3b3b3b, #)" : "linear-gradient(315deg, #cacaca, #f0f0f0)",
              boxShadow: `-${tamanoUno}px ${tamanoUno}px ${tamanoUno}px ${themeMode === "dark" ? "#1f1f1f" : "#c1c1c1"}, ${tamanoUno}px -${tamanoUno}px ${tamanoUno}px ${themeMode === "dark" ? "#0f0f0f" : "#ffffff"}`,
            }}
          >
            <Grid size="auto">
              Actividades {diaSeleccionado?.activitiesForDay[0] && <>para {asesores.data?.find((a) => a.cod_usuario === diaSeleccionado?.activitiesForDay[0].cod_asesor)?.nombre_completo}</>} del dia (
              {diaSeleccionado?.activitiesForDay.length}):
            </Grid>
            <Grid size="grow"></Grid>
            {/* <Grid size="auto">[ {diaSeleccionado.dia} ]</Grid> */}
            <Grid size="auto">
              <Typography variant="span">{diaSeleccionado.diaTexto?.split("").map((i, ind) => (ind === 0 ? i.toUpperCase() : i.toLowerCase()))}</Typography>{" "}
            </Grid>
          </Grid>
          <Grid container size={12} direction="column" sx={{ p: 1, overflowY: "auto" }}>
            {/* <pre>{JSON.stringify(diaSeleccionado?.activitiesForDay, null, 2)}</pre> */}
            {renderizarTabla ? (
              <Box sx={{ ...lightScroll, width: "100%" }}>
                <TablaActividades
                  calendario
                  lineasVisibles={5}
                  datos={diaSeleccionado?.activitiesForDay.map((i) => ({
                    ...i,
                    cliente_desc: i.nombre_cliente,
                    fecha_programada_locale: format(parseISO(i.fecha_programada), "dd-MM-yyyy"),
                    asesor: asesores.data?.find((a) => a.cod_usuario === i.cod_asesor)?.nombre_completo,
                    accionesDeTabla: { view: true, edit: false },
                  }))}
                />
              </Box>
            ) : (
              diaSeleccionado?.activitiesForDay.map((i, ind) => (
                <Grid width="100%" key={i.id} size={12} sx={{}}>
                  {generarActividad ? (
                    generarActividad(i)
                  ) : (
                    <Button
                      variant="contained"
                      sx={{
                        width: "100%",
                        display: "block",
                        textTransform: "none",
                        p: 0,
                        px: 1,
                        m: 0,
                        textAlign: "left",
                        color: "inherit",
                        bgcolor: `${i.color || "secondary"}.500`,
                      }}
                      onClick={(ev) => {
                        ev.preventDefault();
                        clickActividad && clickActividad(i);
                      }}
                    >
                      <Typography fontSize="0.8rem" color="background.main">
                        {i.title}
                      </Typography>
                    </Button>
                  )}
                </Grid>
              ))
            )}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

CalendarioComponent.propTypes = {
  actividades: PropTypes.array,
  generarActividad: PropTypes.func,
  clickActividad: PropTypes.func,
  catalogos: PropTypes.object,
  generarReport: PropTypes.func,
  clickFecha: PropTypes.func,
  renderizarTabla: PropTypes.bool,
};

export default CalendarioComponent;
