import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { inputPropTypes } from ".";
import { placeholder, style } from "./datePickerComponentStyles";
import { useForm } from "../../../hooks/useForm";
import { Button, DialogActions, Grid, IconButton, Stack, Typography } from "@mui/material";
import { styleFilled } from "./textComponentStyles";
import { usePickersTranslations } from "@mui/x-date-pickers/hooks";
import { unstable_useId as useId } from "@mui/utils";
import { es } from "date-fns/locale/es";

function CustomActionBar(props) {
  const { /* onAccept, onClear, onCancel, */ onSetToday, actions = [], className } = props;
  const id = useId();

  if (actions == null || actions.length === 0) {
    return null;
  }
  const menuItems = actions?.map((actionType) => {
    switch (actionType) {
      case "today":
        return (
          <Button sx={{ color: "accent.main" }} onClick={() => onSetToday()} key={actionType}>
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

const DatePickerComponent = (props) => {
  const { input, onInput, id } = props;

  const [currentInput, setCurrentInput] = useState(input);
  const formState = useForm({
    [input.id]: input.val,
  });

  useEffect(() => {
    setCurrentInput(input);
    formState.onInputChange({ target: { name: input.id, value: typeof input.val === "string" ? new Date(input.val) : input.val || null } });
  }, [input]);

  const onChange = (value) => {
    formState.onInputChange({ target: { name: input.id, value } });
    onInput(value);
  };

  const clearInput = (ev) => {
    ev.preventDefault();
    formState.onInputChange({ target: { name: input.id, value: null } });
    onInput(null);
  };
  const parseDate = (value) => {
    if (!value) return null;
    if (typeof value === "string") return new Date(value); // Convierte cadenas a Date
    return value; // Devuelve objetos Date válidos
  };
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <DatePicker
        id={id}
        label={input.label}
        format={input.format || "dd-MM-yyyy"}
        views={["year", "month", "day"]}
        readOnly={input.readonly}
        value={parseDate(input.val)} // Valida el valor de entrada
        onChange={onChange}
        slots={{
          actionBar: CustomActionBar,
          clearButton: () => (
            <IconButton sx={{ m: 0, p: 0, mr: 0.4, pr: "1px", width: "auto", maxWidth: 20 }} size="small" color="black" onClick={clearInput}>
              <Typography color={input.readonly ? "grey" : input.color || "text"} sx={{ m: 0, p: 0, fontSize: 12, width: "auto" }} className="c-x1" />
            </IconButton>
          ),
          openPickerButton: (props) => (
            <IconButton {...props} sx={{ m: 0, p: 0, mr: 0.3, pr: "1px", width: "auto", maxWidth: 20 }} size="small" color="black">
              <Typography color={input.readonly ? "grey" : input.color || "text"} sx={{ m: 0, p: 0, width: "auto" }} className="c-calendario" />
            </IconButton>
          ),
        }}
        slotProps={{
          textField: {
            variant: "filled",
            size: "small",
            sx: { ...styleFilled(input), width: "-webkit-fill-available", minHeight: "-webkit-fill-available" },
            readOnly: input.readonly,
          },
          field: { clearable: true },
          actionBar: { actions: ["today"], style: { justifyContent: "flex-start" } },
          desktopPaper: {
            sx: {
              "& .MuiFormControl-root": {
                "& .MuiInputBase-root.MuiFilledInput-root": { border: "none !important" },
              },
              "& .MuiPickersLayout-root": { width: "200px" },
              "& .MuiPickersCalendarHeader-root": {
                m: "0px !important",
                mx: "10px !important",
                flexDirection: "row",
                py: 0.5,
                px: 1,
                justifyContent: "space-between",
                maxHeight: "fit-content !important",
                minHeight: "fit-content !important",
              },
              "& .MuiPickersCalendarHeader-root *": { m: 0, p: 0, height: "fit-content", minHeight: 20, width: "fit-content" },
              "& .MuiDateCalendar-root": { m: 0, p: 0, height: "fit-content", minHeight: 20, width: "100%" },
              "& .MuiPickersSlideTransition-root": { m: 0, p: 0, minHeight: "165px", maxHeight: "165px" },
              "& .MuiDayCalendar-header": {
                width: "100% !important",
                mx: "auto",
                justifyContent: "space-between !important",
                px: 0.5,
                height: "fit-content",
                minWidth: 20,
                minHeight: 20,
                "& .MuiDayCalendar-weekDayLabel": {
                  minWidth: "25px !important",
                  maxWidth: "25px !important",
                  minHeight: "25px !important",
                  maxHeight: "25px !important",
                },
              },
              "& .MuiDayCalendar-header span": { m: 0, p: 0, width: "fit-content", height: "fit-content", minWidth: 20, minHeight: 20 },
              "& .MuiDayCalendar-monthContainer": { width: "fit-content", height: "fit-content" },
              "& .MuiPickersDay-root": { m: 0, p: 0, width: "fit-content", height: "fit-content", minWidth: 20, minHeight: 20 },
              "& .MuiPickersFadeTransitionGroup-root": { m: 0, p: 0, height: "max-content", minWidth: 20, minHeight: 20 },
              "& .MuiPickersDesktopPaper-customActions": { display: "flex", justifyContent: "space-around", mt: 1, mb: 1 },
              "& .MuiDateCalendar-viewTransitionContainer div": { mx: "auto", width: "auto", px: 0.5 },
              "& .MuiDayCalendar-weekContainer": {
                width: "100% !important",
                mx: "auto",
                justifyContent: "space-between !important",
                px: 0.5,
                "& .MuiPickersDay-root": {
                  minWidth: "25px !important",
                  maxWidth: "25px !important",
                  minHeight: "25px !important",
                  maxHeight: "25px !important",
                },
              },
            },
          },
        }}
        sx={{ "& .MuiButtonBase-root": { p: 0, m: 0 }, width: "-webkit-fill-available" }}
      />
    </LocalizationProvider>
  );
};

DatePickerComponent.propTypes = {
  input: inputPropTypes.isRequired,
  onInput: PropTypes.func,
};
CustomActionBar.propTypes = {
  onAccept: PropTypes.any,
  onClear: PropTypes.any,
  onCancel: PropTypes.any,
  onSetToday: PropTypes.any,
  actions: PropTypes.any,
  className: PropTypes.any,
};
export default DatePickerComponent;
