import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { DatePicker, LocalizationProvider, StaticDatePicker, DateTimeField } from "@mui/x-date-pickers";
import { inputPropTypes, styleGenerar } from ".";
import { useForm } from "../../hooks/useForm";
import { Button, DialogActions, Grid, IconButton, Stack, Typography, Icon, Box, Popper, ClickAwayListener, Dialog } from "@mui/material";
import { styleFilled } from "./textComponentStyles";
import { unstable_useId as useId } from "@mui/utils";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { esES } from "@mui/x-date-pickers/locales";
import { es } from "date-fns/locale";
import { useSelector } from "react-redux";
import TimePickerComponent from "../TimePickerComponent/TimePickerComponent";
import TabComponent from "../Tabs/TabComponent";
import InputLabelComponent from "./InputLabelComponent";
// import moment from "moment";

// moment.locale("es");

function CustomActionBar(props) {
  const { /* onAccept, onClear, onCancel, */ onSetToday, actions = [], className } = props;
  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);
  const id = useId();

  if (actions == null || actions.length === 0) {
    return null;
  }
  const menuItems = actions?.map((actionType) => {
    switch (actionType) {
      case "today":
        return (
          <Button sx={{ color: `primary.${opositeMode}`, borderColor: `primary.${opositeMode}` }} onClick={() => onSetToday()} key={actionType}>
            Hoy
          </Button>
        );
      default:
        return null;
    }
  });

  return (
    <DialogActions sx={{ mx: 0, px: 0, "& *": { m: 0, p: 0 } }} className={className}>
      <Grid id="basic-menu" open={open} MenuListProps={{ "aria-labelledby": `picker-actions-${id}` }}>
        {menuItems}
      </Grid>
    </DialogActions>
  );
}

const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());

const DateTimePickerComponent2 = (props) => {
  const { input, onInput, id } = props;
  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);
  const screenSize = useSelector((state) => state.screen);
  const textfieldRef = useRef();
  // const [errorMessage, setErrorMessage] = useState("");
  // const [error, setError] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);

  const onChange = useCallback(
    (value) => {
      // Si el usuario borra todo
      if (value === null) {
        onInput?.(null);
        return;
      }

      // Mientras escribe texto → ignorar
      if (!isValidDate(value)) {
        return;
      }

      // Si no cambió realmente → ignorar
      if (input.val instanceof Date && input.val.getTime() === value.getTime()) {
        return;
      }

      // ✅ Fecha válida → guardar
      onInput?.(value);
    },
    [onInput, input.val]
  );

  const clearInput = (ev) => {
    ev.preventDefault();
    onChange(null);
  };

  const handleOpen = (event) => {
    setAnchorEl(textfieldRef.current);
    setOpen(true);
  };

  const clickAwayHandler = () => {
    setOpen(false);
  };

  const dateString = (value) => {
    if (!value) return "--/--/---- --:--";

    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date)) return "--/--/---- --:--";
    const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
    const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
    const year = date.getFullYear();
    const hour = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
    const minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
    return `${day}/${month}/${year} ${hour}:${minutes}`;
  };

  const error = useMemo(() => {
    return input.requerido && input.intento > 0 && !input.val;
  }, [input.requerido, input.intento, input.val]);

  const errorMessage = useMemo(() => {
    return error ? `El campo ${input.label} es requerido` : "";
  }, [error, input.label]);

  // const verificarInputSegunTipo = useCallback(
  //   (val) => {
  //     let isValid = true;
  //     let message = "";

  //     if (input.requerido && input.intento > 0 && !val) {
  //       isValid = false;
  //       message = `El campo ${input.label} es requerido`;
  //     }

  //     setError((prev) => (prev !== !isValid ? !isValid : prev));
  //     setErrorMessage((prev) => (prev !== message ? message : prev));
  //   },
  //   [input.requerido, input.intento, input.label]
  // );

  // useEffect(() => {
  //   verificarInputSegunTipo(input.val);
  // }, [input.val, verificarInputSegunTipo]);

  const setNow = useCallback(() => {
    const now = new Date();
    if (!input.val || input.val.getTime() !== now.getTime()) {
      onInput?.(now);
    }
  }, [onInput, input.val]);

  const labelNode = useMemo(
    () => <InputLabelComponent input={{ color: input.color, requerido: input.requerido, label: input.label, id: input.id, icono: input.icono }} error={error} />,
    [input?.color, input.requerido, input.label, input.id, input.icono, error]
  );

  return (
    <LocalizationProvider localeText={esES.components.MuiLocalizationProvider.defaultProps.localeText} adapterLocale={es} dateAdapter={AdapterDateFns}>
      <DateTimeField
        id={id}
        ref={textfieldRef}
        sx={{ ...styleGenerar(input) }}
        label={labelNode}
        size="small"
        format={input.format ?? (input.tipo === "date" ? "dd-MM-yyyy" : input.tipo === "time" ? "HH:mm" : "dd-MM-yyyy HH:mm")}
        minDate={input.min}
        maxDate={input.max}
        fullWidth
        name={input.id}
        // value={formState[input.id]}
        value={input.val}
        onChange={onChange}
        onKeyDown={input.teclaPresionada}
        aria-readonly={input.readonly}
        InputProps={{
          readOnly: input.readonly,
          placeholder: input.format || input.tipo === "date" ? "dd-MM-yyyy" : input.tipo == "time" ? "HH:mm" : "dd-MM-yyyy HH:mm",
          sx: {},
          endAdornment: (
            <Grid container columnSpacing={0.3} direction="row" position="end" wrap="nowrap" sx={{ justifyContent: "flex-end", alignItems: "center" }} pr={1}>
              <Grid size="auto">
                <IconButton sx={{ m: 0, p: 0 }} size="small" onClick={handleOpen}>
                  <Icon color="text.900_20" sx={{ m: 0, p: 0, fontSize: 12, fontWeight: "bold", width: "auto" }} className="c-calendario" />
                </IconButton>
              </Grid>
              {!input.readonly && input.val && (
                <Grid size="auto">
                  <IconButton sx={{ m: 0, p: 0 }} size="small" onClick={clearInput}>
                    <Icon color="text.900_20" sx={{ m: 0, p: 0, fontSize: 12, fontWeight: "bold", width: "auto" }} className="c-x1" />
                  </IconButton>
                </Grid>
              )}
            </Grid>
          ),
        }}
        error={error}
        helperText={errorMessage}
      />
      {["xs", "sm"].includes(screenSize.name) ? (
        <Dialog
          open={!input.readonly && open}
          scroll="body"
          sx={{
            "& .MuiDialog-paper": {
              bgcolor: "transparent",
            },
          }}
        >
          <ClickAwayListener onClickAway={clickAwayHandler}>
            <Box sx={{ display: "flex", flexDirection: "column", border: 1, pb: 2, borderColor: "background.50", borderRadius: 2, bgcolor: themeMode == "dark" ? "background.50" : "background.main" }}>
              <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", pl: 1 }}>
                <pre>{dateString(input.val)}</pre>
                <Button onClick={setNow}>Ahora</Button>
              </Box>
              <TabComponent
                tabInicial={1}
                variante="fullWidth"
                direccion="horizontal"
                opciones={[
                  {
                    id: 1,
                    label: "Fecha",
                    icono: "c-calendario",
                    content: (
                      <StaticDatePicker
                        format={input.format || "dd-MM-yyyy"}
                        views={["year", "month", "day"]}
                        minDate={input.min}
                        maxDate={input.max}
                        readOnly={input.readonly}
                        value={input.val}
                        onChange={onChange}
                        slotProps={{
                          actionBar: { actions: ["today"], style: { justifyContent: "flex-end", display: "none" } },
                          toolbar: { hidden: true },
                        }}
                        sx={{
                          display: "flex",
                          justifyContent: "flex-start",
                          alignContent: "center",
                          minWidth: "250px",
                          minHeight: "250px",
                          bgcolor: themeMode == "dark" ? "background.50" : "background.main",
                          "& .MuiDateCalendar-root": {
                            width: "250px",
                            maxHeight: "270px",
                          },
                          "& .MuiDayCalendar-weekDayLabel": {
                            width: "29px",
                            height: "29px",
                            fontSize: "0.85rem",
                          },
                          "& .MuiPickersDay-root": {
                            width: "29px",
                            height: "29px",
                            fontSize: "0.85rem",
                          },
                          "& .MuiPickersDay-root.Mui-selected": {
                            backgroundColor: `primary.main`,
                          },
                          "& .MuiPickersYear-yearButton.Mui-selected": {
                            borderRadius: 1,
                          },
                          "& .MuiPickersYear-yearButton:hover": {
                            borderRadius: 1,
                          },
                          "& .MuiPickersMonth-monthButton.Mui-selected": {
                            borderRadius: 1,
                          },
                          "& .MuiPickersMonth-monthButton:hover": {
                            borderRadius: 1,
                          },
                          "& .MuiYearCalendar-root": {
                            width: "250px",
                          },
                          "& .MuiMonthCalendar-root": {
                            width: "250px",
                          },
                        }}
                      />
                    ),
                  },
                  {
                    id: 3,
                    label: "Hora",
                    icono: "c-reloj",
                    content: <TimePickerComponent value={input.val} onChange={onChange} />,
                  },
                ]}
              />
            </Box>
          </ClickAwayListener>
        </Dialog>
      ) : (
        <Popper
          open={!input.readonly && open}
          anchorEl={anchorEl}
          sx={{ zIndex: (theme) => theme.zIndex.tooltip + 5 }}
          modifiers={[
            {
              name: "flip",
              options: {
                fallbackPlacements: ["top", "right", "left", "bottom"],
              },
            },
            {
              name: "preventOverflow",
              options: {
                boundary: "viewport",
              },
            },
          ]}
        >
          <ClickAwayListener onClickAway={clickAwayHandler}>
            <Box sx={{ display: "flex", flexDirection: "column", border: 1, borderColor: "background.50", borderRadius: 2, bgcolor: themeMode == "dark" ? "background.50" : "background.main" }}>
              <Box sx={{ display: "flex", flexDirection: "row" }}>
                <StaticDatePicker
                  format={input.format || "dd-MM-yyyy"}
                  views={["year", "month", "day"]}
                  minDate={input.min}
                  maxDate={input.max}
                  readOnly={input.readonly}
                  value={input.val}
                  onChange={onChange}
                  slotProps={{
                    actionBar: { actions: ["today"], style: { justifyContent: "flex-end", display: "none" } },
                    toolbar: { hidden: true },
                  }}
                  sx={{
                    display: "flex",
                    justifyContent: "flex-start",
                    alignContent: "center",
                    minWidth: "250px",
                    minHeight: "250px",
                    bgcolor: themeMode == "dark" ? "background.50" : "background.main",
                    "& .MuiDateCalendar-root": {
                      width: "250px",
                      maxHeight: "270px",
                    },
                    "& .MuiDayCalendar-weekDayLabel": {
                      width: "29px",
                      height: "29px",
                      fontSize: "0.85rem",
                    },
                    "& .MuiPickersDay-root": {
                      width: "29px",
                      height: "29px",
                      fontSize: "0.85rem",
                    },
                    "& .MuiPickersDay-root.Mui-selected": {
                      backgroundColor: `primary.main`,
                    },
                    "& .MuiPickersYear-yearButton.Mui-selected": {
                      borderRadius: 1,
                    },
                    "& .MuiPickersYear-yearButton:hover": {
                      borderRadius: 1,
                    },
                    "& .MuiPickersMonth-monthButton.Mui-selected": {
                      borderRadius: 1,
                    },
                    "& .MuiPickersMonth-monthButton:hover": {
                      borderRadius: 1,
                    },
                    "& .MuiYearCalendar-root": {
                      width: "250px",
                    },
                    "& .MuiMonthCalendar-root": {
                      width: "250px",
                    },
                  }}
                />
                <TimePickerComponent value={input.val} onChange={onChange} />
              </Box>
              <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", pr: 1 }}>
                <Button
                  onClick={() => {
                    // onInputChange({ target: { name: input.id, value: new Date() } });
                    onInput(new Date());
                  }}
                >
                  Ahora
                </Button>
              </Box>
            </Box>
          </ClickAwayListener>
        </Popper>
      )}
    </LocalizationProvider>
  );
};
DateTimePickerComponent2.propTypes = {
  input: inputPropTypes.isRequired,
  onInput: PropTypes.func,
  id: PropTypes.string,
};
CustomActionBar.propTypes = {
  onAccept: PropTypes.any,
  onClear: PropTypes.any,
  onCancel: PropTypes.any,
  onSetToday: PropTypes.any,
  actions: PropTypes.any,
  className: PropTypes.any,
};
export default DateTimePickerComponent2;
