import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Box, Typography, Grid, Button, Icon, Tooltip, Menu, MenuItem, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import useObtenerOpcionesAcciones from "../../hooks/useObtenerOpcionesAcciones";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";

import { api } from "../../api";
import { decryptId } from "../../api/encryptDecrypt";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";

import { format, addMonths, subMonths, addDays, subDays, startOfMonth, endOfMonth, getDaysInMonth, startOfWeek, isToday, isWeekend, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import ListaEditableActividades from "./ListaEditableActividades";

export const VistaActividadesDia = () => {
  const { nombre, cod_usuario, json } = useSelector((state) => state.auth);
  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);
  const { permisosArray, catalogoArray } = useObtenerOpcionesAcciones();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [openColores, setOpenColores] = useState(false);
  const [actividades, setActividades] = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [estados, setEstados] = useState([]);
  const [paises, setPaises] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [industrias, setIndustrias] = useState([]);
  const [tipos, setTipos] = useState();
  const [empresas, setEmpresas] = useState();
  const [cencos, setCencos] = useState();
  const [empleados, setEmpleados] = useState([]);
  const [tratamientos, setTratamientos] = useState([]);
  const [temperamentos, setTemperamentos] = useState([]);
  const [accionesDeTabla, setAccionesDeTabla] = useState({
    add: false,
    view: true,
    go: false,
    copy: false,
    paste: false,
    auth: false,
    edit: false,
    excel: false,
    pdf: false,
    download: false,
    delete: false,
  });

  const screenSize = useSelector((state) => state.screen);

  // Estado para el mes y año actual
  const [currentDate, setCurrentDate] = useState(new Date() /* moment() */);
  const [openModal, setOpenModal] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuAnchorEl1, setMenuAnchorEl1] = useState(null);
  const [menuAnchorEl2, setMenuAnchorEl2] = useState(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const isMenuOpen = Boolean(menuAnchorEl);
  const isMenuOpen1 = Boolean(menuAnchorEl1);
  const isMenuOpen2 = Boolean(menuAnchorEl2);

  const handleMenuClick = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };
  const handleMenuClick1 = (event) => {
    setMenuAnchorEl1(event.currentTarget);
  };
  const handleMenuClick2 = (event) => {
    setMenuAnchorEl2(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  const handleMenuClose1 = () => {
    setMenuAnchorEl1(null);
  };
  const handleMenuClose2 = () => {
    setMenuAnchorEl2(null);
  };

  // Obtiene los datos de hoy
  const realYear = useMemo(() => format(new Date(), "yyyy"), []);
  const realMonth = useMemo(() => format(new Date(), "M") - 1, []);
  const realDay = useMemo(() => format(new Date(), "d"), []);

  // Obtiene el año actual
  const currentYear = useMemo(() => format(currentDate, "yyyy"), [currentDate]);
  const currentMonth = useMemo(() => format(currentDate, "M") - 1, [currentDate]);
  const currentDay = useMemo(() => format(currentDate, "d"), [currentDate]);

  const years = Array.from({ length: 15 }, (_, i) => currentYear - 7 + i);

  const { daysInMonth, firstDayOfMonth, isCurrentYear } = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = startOfMonth(currentDate);
    const isCurrentYear = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
    return { daysInMonth, firstDayOfMonth, isCurrentYear };
  }, [currentDate]);

  const handlePrevDay = () => {
    setCurrentDate(subDays(currentDate, 1));
  };

  // Cambia al siguiente mes
  const handleNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  function removeDuplicates(array, key) {
    const seen = new Set();
    return array.filter((item) => {
      const keyValue = item[key];
      if (seen.has(keyValue)) {
        return false;
      }
      seen.add(keyValue);
      return true;
    });
  }

  const obtenerEntidades = useCallback(async () => {
    let lista_entidades = [];
    let tipos_entidades = ["CLIENTE", "PRE-CLIENTE", "DSV"];

    for (let tipo in tipos_entidades) {
      await api
        .get("api/appweb/lista-entidad", { params: { tipo_entidad: tipos_entidades[tipo] } })
        .then(({ data }) => {
          lista_entidades = lista_entidades.concat(data.data.data);
        })
        .catch((e) => console.error(e));
    }

    setEntidades(removeDuplicates(lista_entidades, "entidad_id"));
  }, []);

  const obtenerEstados = useCallback(async () => {
    await api
      .get("api/appweb/listaestados")
      .then(({ data }) => setEstados(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerTipos = useCallback(async () => {
    await api
      .get("api/appweb/lista-tipo")
      .then(({ data }) => setTipos(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerPais = useCallback(async () => {
    await api
      .get("api/appweb/listapaises")
      .then(({ data }) => setPaises(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerCiudad = useCallback(async () => {
    await api
      .get("api/appweb/lista-ciudad")
      .then(({ data }) => setCiudades(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerIndustria = useCallback(async () => {
    await api
      .get("api/appweb/lista-industria")
      .then(({ data }) => setIndustrias(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerEmpresas = useCallback(async () => {
    await api
      .get("api/appweb/listaempresas")
      .then(({ data }) => setEmpresas(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerCencos = useCallback(async () => {
    await api
      .get("api/appweb/listacentrocosto")
      .then(({ data }) => setCencos(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerEmpleados = useCallback(async () => {
    await api
      .get("api/appweb/listaemp-usu-puesto")
      .then(({ data }) => setEmpleados(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerTratamientos = useCallback(async () => {
    await api
      .get("api/appweb/lista-tratamiento")
      .then(({ data }) => setTratamientos(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerTemperamentos = useCallback(async () => {
    await api
      .get("api/appweb/lista-temperamento")
      .then(({ data }) => setTemperamentos(data.data))
      .catch((e) => console.error(e));
  }, []);

  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([
      obtenerEmpleados(),
      obtenerTemperamentos(),
      obtenerTratamientos(),
      obtenerCencos(),
      obtenerEntidades(),
      obtenerEmpresas(),
      obtenerEstados(),
      obtenerTipos(),
      obtenerPais(),
      obtenerCiudad(),
      obtenerIndustria(),
    ]).then(() => dispatch(apagarCarga()));
  }, [
    obtenerEntidades,
    obtenerEmpleados,
    obtenerTratamientos,
    obtenerTemperamentos,
    obtenerCencos,
    obtenerEmpresas,
    obtenerEstados,
    obtenerPais,
    obtenerCiudad,
    obtenerIndustria,
    obtenerTipos,
    dispatch,
  ]);

  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  return (
    <Box sx={{ mt: 1 }}>
      <Grid container direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Grid size="auto">
          <IconButton onClick={handlePrevDay} sx={{ color: `primary.${opositeMode}` }}>
            <Typography className="c-izquierda-simple" fontSize="1.5rem" />
          </IconButton>
        </Grid>
        <Grid size="grow" justifyContent="center" container direction="row">
          <Grid size="grow"></Grid>
          <Grid
            size={{ md: "auto" }}
            textAlign="center"
            onClick={handleMenuClick2}
            sx={{
              color: themeMode == "dark" ? "white.main" : "primary.main",
              px: 0.5,
              py: 0.5,
              my: 0,
              mx: 0.5,
              borderRadius: 1,
              "&:hover": {
                bgcolor: "primary.500",
                color: themeMode == "light" ? "white.main" : undefined,
                cursor: "pointer",
              },
            }}
          >
            <Typography variant={["xs", "sm"].includes(screenSize.name) ? "h6" : "h4"}>{format(currentDate, "dd", { locale: es }).toUpperCase()}</Typography>
          </Grid>

          <Menu
            anchorEl={menuAnchorEl2}
            open={isMenuOpen2}
            onClose={handleMenuClose2}
            PaperProps={{
              style: {
                width: "255px",
              },
            }}
          >
            <Grid container bgcolor="background.main" width="100%" px={1} py={1}>
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

                {[...Array(new Date(currentYear, currentMonth + 1, 0).getDate()).keys()].map((i) => (
                  <Grid
                    size={1.7}
                    key={i}
                    onClick={() => setCurrentDate(new Date(currentYear, currentMonth, i + 1))}
                    sx={{
                      textAlign: "center",
                      py: 0.5,
                      borderRadius: 0.8,
                      "&:hover": {
                        bgcolor: "primary.100",
                        color: currentDay == i + 1 ? "text.main" : undefined,
                        cursor: "pointer",
                      },
                      bgcolor: realDay == i + 1 && realMonth == currentMonth && currentYear == realYear ? "secondary.main" : currentDay == i + 1 ? "primary.main" : undefined,
                      color: realDay == currentDay ? undefined : currentDay == i + 1 ? "white.main" : undefined,
                      // borderColor: realMonth === i ? "black.main" : currentMonth === i ? "white.main" : `primary.${opositeMode}`,
                    }}
                  >
                    {i + 1}
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Menu>

          <Grid size={{ md: "auto" }} textAlign="center" sx={{ py: 0.5, color: themeMode == "dark" ? "white.main" : "primary.main" }}>
            <Typography variant={["xs", "sm"].includes(screenSize.name) ? "h6" : "h4"}>/</Typography>
          </Grid>
          <Grid
            size={{ md: "auto" }}
            textAlign="center"
            onClick={handleMenuClick}
            sx={{
              color: themeMode == "dark" ? "white.main" : "primary.main",
              px: 0.5,
              py: 0.5,
              my: 0,
              mx: 0.5,
              borderRadius: 1,
              "&:hover": {
                bgcolor: "primary.500",
                color: themeMode == "light" ? "white.main" : undefined,
                cursor: "pointer",
              },
            }}
          >
            <Typography variant={["xs", "sm"].includes(screenSize.name) ? "h6" : "h4"}>{format(currentDate, "MM", { locale: es }).toUpperCase()}</Typography>
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
            <Grid container bgcolor="background.main" width="100%" px={1} py={1}>
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
                      onClick={() => setCurrentDate(new Date(currentYear, i, currentDay))}
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

          <Grid size={{ md: "auto" }} textAlign="center" sx={{ py: 0.5, color: themeMode == "dark" ? "white.main" : "primary.main" }}>
            <Typography variant={["xs", "sm"].includes(screenSize.name) ? "h6" : "h4"}>/</Typography>
          </Grid>

          <Grid
            size={{ md: "auto" }}
            textAlign="center"
            onClick={handleMenuClick1}
            sx={{
              color: themeMode == "dark" ? "white.main" : "primary.main",
              px: 0.5,
              py: 0.5,
              my: 0,
              mx: 0.5,
              borderRadius: 1,
              "&:hover": {
                bgcolor: "primary.500",
                color: themeMode == "light" ? "white.main" : undefined,
                cursor: "pointer",
              },
            }}
          >
            <Typography variant={["xs", "sm"].includes(screenSize.name) ? "h6" : "h4"}>{format(currentDate, "yyyy").toUpperCase()}</Typography>
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
            <Grid container bgcolor="background.main" width="100%" px={1} py={1}>
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

          <Grid size="grow"></Grid>
        </Grid>
        <Grid size="auto">
          <Button
            variant="outlined"
            size="small"
            onClick={() => setCurrentDate(new Date())}
            sx={{ "&:hover": { bgcolor: "primary.100" }, borderColor: `primary.${opositeMode}`, color: `primary.${opositeMode}`, mx: 1 }}
          >
            <Typography pr={1} margin="auto" sx={{ lineHeight: 1 }} textTransform="none" fontWeight="bold" variant="button">
              Ir a Hoy
            </Typography>
            <Typography margin="auto" sx={{ lineHeight: 1 }} fontSize="1rem" className="c-calendario" />
          </Button>

          <IconButton onClick={handleNextDay} sx={{ color: `primary.${opositeMode}` }}>
            <Typography className="c-derecha-simple" fontSize="1.5rem" />
          </IconButton>
        </Grid>
      </Grid>

      <Grid container direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Grid size="grow">
          <ListaEditableActividades
            fecha={currentDate}
            currentDate={currentDate}
            catalogos={{ entidades, empresas, estados, paises, ciudades, industrias, tipos, cencos, empleados, tratamientos, temperamentos }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
