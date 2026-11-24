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

// Actividades de ejemplo
const tamanoUno = 2;

const CalendarioSemanaComponent = (props) => {
  const { actividades = [], generarActividad, clickActividad = undefined, catalogos } = props;
  const { entidades = [] } = catalogos || {};
  const screenSize = useSelector((state) => state.screen);
  const navigate = useNavigate();
  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);

  // Estado para el mes y año actual
  const [currentDate, setCurrentDate] = useState(new Date() /* moment() */);
  const [viewDate, setViewDate] = useState(new Date() /* moment() */);

  // const [viewMonth, setViewMonth] = useState(new Date() /* moment() */);
  // const [viewYear, setViewYear] = useState(new Date() /* moment() */);

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

  // Obtiene el año actual
  const viewYear = useMemo(() => format(viewDate, "yyyy"), [viewDate]);
  const viewMonth = useMemo(() => format(viewDate, "M") - 1, [viewDate]);
  const viewDay = useMemo(() => format(viewDate, "d"), [viewDate]);

  const currentWeek = useMemo(() => {
    const week = [];
    const current = new Date(currentDate);
    current.setDate(current.getDate() - current.getDay());
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return week;
  }, [currentDate]);

  function isSameWeek(dateParam) {
    const startOfWeek = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0); // Reset time to midnight
      d.setDate(d.getDate() - d.getDay()); // Move to Sunday of the same week
      return d;
    };
    const start1 = startOfWeek(dateParam);
    const start2 = startOfWeek(currentDate);
    return start1.getTime() === start2.getTime();
  }

  // Feriados de ejemplo
  const holidays = useMemo(() => ["01-01", "05-01", "07-01", "08-15", "09-15", "10-20", "11-01", "12-24", "12-25", "12-31"].map((i) => `${currentYear}-${i}`), [currentYear]);

  const { daysInMonth, firstDayOfMonth, isCurrentYear } = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewDate);
    const firstDayOfMonth = startOfMonth(viewDate);
    const isCurrentYear = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
    return { daysInMonth, firstDayOfMonth, isCurrentYear };
  }, [viewDate]);

  // Filtra las actividades por fecha
  const getActivitiesForDay = useCallback(
    (day) => {
      // console.log(actividades)
      // const date = new Date(currentYear, currentMonth, day);
      const date = currentWeek[day];
      console.log(date);
      if (date) {
        const formattedDate = format(date, "yyyy-MM-dd");
        return actividades.filter((activity) => {
          const formatDateActivity = format(activity.fecha_programada, "yyyy-MM-dd");
          return formatDateActivity === formattedDate;
        });
      }
    },
    [actividades, currentWeek, currentYear, currentMonth]
  );

  // Comprueba si el día es feriado
  const isHoliday = useCallback(
    (day) => {
      const date = new Date(currentYear, currentMonth, day);
      return holidays.some((holiday) => isSameDay(date, new Date(holiday.split("-")[0], Number(holiday.split("-")[1]) - 1, holiday.split("-")[2])));
    },
    [currentMonth, currentYear, holidays]
  );

  // Comprueba si el día es fin de semana
  const isWeekend_ = useCallback(
    (day) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      return isWeekend(date);
    },
    [currentDate]
  );

  // Comprueba si el día es hoy
  const isToday_ = useCallback(
    (day) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      return isToday(date);
    },
    [currentDate]
  );

  // Cambia al mes anterior
  const handlePrevMonth = () => {
    setViewDate(subMonths(viewDate, 1));
  };

  // Cambia al siguiente mes
  const handleNextMonth = () => {
    setViewDate(addMonths(viewDate, 1));
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
    console.log(day);
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

  const datos_ = useMemo(() => {
    return actividades.map((i) => ({
      ...i,
      // cliente_desc: i.cliente.entidad_nombre,
      fecha: i.fecha_programada,
      cliente_desc: entidades ? entidades.find((j) => j.entidad_id === i.cod_cliente)?.entidad_nombre : "",
    }));
  }, [actividades]);

  return (
    <Box
      sx={{ padding: { xs: 1, md: 2 }, bgcolor: themeMode === "dark" ? "background.50" : "background.900", color: "text.main" }}
      // sx={{ padding: { xs: 1, md: 2 }, bgcolor: `background.${opositeMode}`, color: "text.main" }}
      borderRadius={2.5}
    >
      <Grid container>
        <Grid container size={9.5} sx={{ display: "flex", flexDirection: "column" }}>
          {/* Cabecera del calendario */}

          {/* Días de la semana */}
          <Grid container spacing={0.2} sx={{ pr: 1.5, pb: 1 }}>
            {/* <Grid item size={1.15} key={0.8}></Grid> */}
            {["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map((day, i) => (
              <Grid item size={1.7} key={day}>
                <Typography align="center" color={themeMode == "dark" ? "white.main" : "primary.main"}>
                  {["xs", "sm"].includes(screenSize.name) ? day[0] : day}
                </Typography>
                <Typography align="center" color={themeMode == "dark" ? "text.main" : "text.main"}>
                  {/* {["xs", "sm"].includes(screenSize.name) ? day[0] : day} */}
                  {currentWeek[i].toLocaleDateString()}
                </Typography>
              </Grid>
            ))}
          </Grid>

          <Grid
            container
            spacing={0.2}
            sx={{
              backgroundColor: "yellow",
              overflowY: "scroll",
              height: "80vh",
            }}
          >
            {currentWeek.map((date, dayIndex) => {
              const day = date.getDate();
              const activitiesForDay = getActivitiesForDay(dayIndex);
              return (
                <Grid
                  item
                  size={1.7}
                  key={day}
                  sx={{
                    bgcolor: date.toDateString() === new Date().toDateString() ? "background.300" : themeMode == "dark" ? "background.200" : "background.600",
                    "&:hover": {
                      bgcolor: "primary.200",
                    },
                  }}
                >
                  <Box>
                    <Box sx={{ overflowY: "auto", maxHeight: "calc( 100% - 15px )", p: 1, ...lightScroll }}>
                      <Grid container direction="column" width="100%" spacing={1}>
                        {activitiesForDay.map((i, ind) => (
                          <Grid width="100%" key={i.id} size={12}>
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
                                  bgcolor: `${i.color}.500`,
                                }}
                              >
                                <Typography fontSize="0.8rem" color="background.main">
                                  {i.title}
                                </Typography>
                              </Button>
                            )}
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>

          {/* {["xs", "sm"].includes(screenSize.name) && diaSeleccionado?.activitiesForDay.length > 0 && (
            <Box sx={{ p: 1 }}>
              <Grid
                container
                direction="row"
                borderRadius={1}
                p={1}
                sx={{
                  borderRadius: "20px",
                  background: "linear-gradient(315deg, #cacaca, #f0f0f0)",
                  boxShadow: `-${tamanoUno}px ${tamanoUno}px ${tamanoUno}px #c1c1c1, ${tamanoUno}px -${tamanoUno}px ${tamanoUno}px #ffffff`,
                }}
              >
                <Grid size="auto">Actividades del dia:</Grid>
                <Grid size="grow"></Grid>
                <Grid size="auto">
                  {" "}
                  <Typography variant="caption">{diaSeleccionado.diaTexto?.split("").map((i, ind) => (ind === 0 ? i.toUpperCase() : i.toLowerCase()))}</Typography>{" "}
                </Grid>
              </Grid>
              <Box sx={{ p: 1, overflowY: "auto", maxHeight: "calc( 40vh - 15px )", height: "calc( 40vh - 15px )" }}>
                <Grid container direction="column" width="100%" spacing={1}>
                  {diaSeleccionado?.activitiesForDay.map((i, ind) => (
                    <Grid width="100%" key={i.id} size={12}>
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
                  ))}
                </Grid>
              </Box>
            </Box>
          )} */}
        </Grid>

        <Grid container size={2.5} height="200px" paddingInline={1} sx={{ pl: 2 }}>
          <Grid Grid container sx={{ mb: 1, display: "flex", justifyContent: "center" }} size={12}>
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
          </Grid>

          <Grid size={12} container direction="row" justifyContent="space-between" alignItems="center">
            {/* <Grid size={{ xs: 12 }} textAlign="center">
              Hoy: {format(currentDate, "dd-MM-yyyy", { locale: es }).toUpperCase()}
            </Grid> */}
            <Grid size="auto">
              <IconButton onClick={handlePrevMonth} sx={{ color: `primary.${opositeMode}` }}>
                <Typography className="c-izquierda-simple" />
              </IconButton>
            </Grid>

            <Grid size="grow" justifyContent="center" container direction="row" spacing={1}>
              <Grid size="grow"></Grid>
              <Grid textAlign="center">
                <Grid
                  size="grow"
                  onClick={handleMenuClick}
                  sx={{
                    textAlign: "center",
                    py: 0.5,
                    borderRadius: 0.8,
                    color: themeMode == "dark" ? "white.main" : "primary.main",
                    "&:hover": {
                      bgcolor: "primary.500",
                      color: themeMode == "light" ? "white.main" : undefined,
                    },
                  }}
                >
                  <Typography>{format(viewDate, "MMMM", { locale: es }).toUpperCase()}</Typography>
                </Grid>
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
                    <Grid size="auto">{format(new Date(viewYear, viewMonth), "MMMM, yyyy", { locale: es })}</Grid>
                    <Grid size="grow"></Grid>
                    <Grid size="auto" textAlign="right">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setViewDate(new Date())}
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
                            onClick={() => setViewDate(new Date(viewYear, i))}
                            sx={{
                              p: 0,
                              m: 0,
                              width: "100%",
                              "&:hover": { bgcolor: "primary.100" },
                              bgcolor: realMonth === i ? "secondary.main" : viewMonth === i ? "primary.main" : undefined,
                              borderColor: realMonth === i ? "black.main" : viewMonth === i ? "white.main" : `primary.${opositeMode}`,
                              color: realMonth === i ? "black.main" : viewMonth === i ? "white.main" : `primary.${opositeMode}`,
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
              <Grid textAlign="center">
                <Grid
                  size="grow"
                  onClick={handleMenuClick1}
                  sx={{
                    textAlign: "center",
                    py: 0.5,
                    borderRadius: 0.8,
                    color: themeMode == "dark" ? "white.main" : "primary.main",
                    "&:hover": {
                      bgcolor: "primary.500",
                      color: themeMode == "light" ? "white.main" : undefined,
                    },
                  }}
                >
                  <Typography>{format(viewDate, "yyyy").toUpperCase()}</Typography>
                </Grid>
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
                    <Grid size="auto">{format(new Date(viewYear, viewMonth), "MMMM, yyyy", { locale: es })}</Grid>
                    <Grid size="grow"></Grid>
                    <Grid size="auto" textAlign="right">
                      <Button variant="outlined" size="small" onClick={() => setViewDate(new Date())} sx={{ "&:hover": { bgcolor: "primary.100" } }}>
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
                            onClick={() => setViewDate(new Date(year, viewMonth, viewDay))}
                            sx={{
                              p: 0,
                              m: 0,
                              width: "100%",
                              "&:hover": { bgcolor: "primary.100" },
                              bgcolor: `${realYear}` === `${year}` ? "secondary.main" : `${viewYear}` === `${year}` ? "primary.main" : undefined,
                              borderColor: `${realYear}` === `${year}` ? "black.main" : `${viewYear}` === `${year}` ? "white.main" : `primary.${opositeMode}`,
                              color: `${realYear}` === `${year}` ? "black.main" : `${viewYear}` === `${year}` ? "white.main" : `primary.${opositeMode}`,
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

          <Grid size="grow"></Grid>

          <Grid size={12} container spacing={1} mt={1}>
            {["DO", "LU", "MA", "MI", "JU", "VI", "SA"].map((day) => (
              <Grid item size={1.7} key={day} color={themeMode == "dark" ? "white.main" : "primary.main"} sx={{ textAlign: "center" }}>
                {day}
              </Grid>
            ))}
          </Grid>
          <Grid size={12} container spacing={0.5} mt={1}>
            {Array.from({ length: firstDayOfMonth.getDay() || 7 }).map((_, index) => (
              <Grid item size={1.7} key={`empty-${index}`}></Grid>
            ))}

            {[...Array(new Date(viewYear, format(viewDate, "M") - 1 + 1, 0).getDate()).keys()].map((i) => (
              <Grid
                size={1.7}
                key={i}
                onClick={() => setCurrentDate(new Date(viewYear, viewMonth, i + 1))}
                sx={{
                  textAlign: "center",
                  py: 0.5,
                  borderRadius: 0.8,
                  "&:hover": {
                    bgcolor: "primary.100",
                    color: currentDay == i + 1 ? "text.main" : undefined,
                    cursor: "pointer",
                  },
                  border: realDay == i + 1 && realMonth == viewMonth && viewYear == realYear ? 1 : undefined,
                  borderColor: realDay == i + 1 && realMonth == viewMonth && realYear == viewYear ? "secondary.600" : undefined,
                  color: isSameWeek(new Date(viewYear, viewMonth, i + 1)) ? "white.main" : undefined,
                  bgcolor: isSameWeek(new Date(viewYear, viewMonth, i + 1)) ? "primary.main" : undefined,
                }}
              >
                {i + 1}
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      <RangoFechasAlertComponent open={openModal} handleClose={() => setOpenModal(false)} titulo="Actividades a descargar" tabla={tabla_actividades_resumen} datos={datos_} onConfirmar={exportToICS} />
    </Box>
  );
};

CalendarioSemanaComponent.propTypes = {
  actividades: PropTypes.array,
  generarActividad: PropTypes.func,
  clickActividad: PropTypes.func,
  catalogos: PropTypes.object,
};

export default CalendarioSemanaComponent;
