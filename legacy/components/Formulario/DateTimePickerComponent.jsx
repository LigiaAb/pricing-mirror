import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import { DateTimeField, LocalizationProvider, StaticDateTimePicker } from "@mui/x-date-pickers";
import { inputPropTypes, styleGenerar } from ".";
import { useForm } from "../../hooks/useForm";
import { Button, DialogActions, Grid, IconButton, Popper, Typography, Icon, Box, ClickAwayListener } from "@mui/material";
import { styleFilled } from "./textComponentStyles";
import { unstable_useId as useId } from "@mui/utils";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { esES } from "@mui/x-date-pickers/locales";
import { useSelector } from "react-redux";

function CustomActionBar(props) {
  const { /* onAccept, onClear,  */ onSetToday, actions = [], className } = props;
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

const DateTimePickerComponent = (props) => {
  const { input, onInput } = props;
  const textfieldRef = useRef();
  const [errorMessage, setErrorMessage] = useState("");
  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);
  const [error, setError] = useState(false);
  const [currentInput, setCurrentInput] = useState(input);
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);
  const formState = useForm({
    [currentInput.id]: currentInput.val,
  });

  useEffect(() => {
    setCurrentInput(input);
    formState.onInputChange({ target: { name: input.id, value: input.val || null } });
  }, [input]);

  const onChange = (value) => {
    formState.onInputChange({ target: { name: currentInput.id, value } });
    onInput(value);
  };

  const clearInput = (ev) => {
    //   ev.preventDefault();
    formState.onInputChange({ target: { name: currentInput.id, value: null } });
    onInput(null);
  };

  const handleOpen = (event) => {
    setAnchorEl(textfieldRef.current);
    setOpen(true);
  };

  const clickAwayHandler = () => {
    setOpen(false);
  };

  return (
    <LocalizationProvider localeText={esES.components.MuiLocalizationProvider.defaultProps.localeText} dateAdapter={AdapterDateFns}>
      <DateTimeField
        ref={textfieldRef}
        sx={{ ...styleGenerar(input, opositeMode) }}
        label={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              color: error ? "red.main" : input?.color ? (themeMode == "dark" ? `${input?.color}.300` : `${input?.color}.800`) : `primary.${opositeMode}`,
            }}
          >
            {input.icono && <Icon className={input.icono} sx={{ fontSize: 15, mr: 0.5 }} />}
            {`${input.requerido ? "* " : ""}${input.label || input.id || ""}`}
          </Box>
        }
        variant={input.inputTipo || "filled"}
        size="small"
        format={input.format || "dd-MM-yyyy HH:mm"}
        fullWidth
        name={input.id}
        value={formState[input.id]}
        onChange={onChange}
        onKeyDown={input.teclaPresionada}
        aria-readonly={input.readonly}
        InputProps={{
          readOnly: input.readonly,
          sx: styleGenerar(input),
          endAdornment: (
            <Grid size="auto">
              <Grid container direction="row" position="end">
                <Grid size="auto">
                  <IconButton sx={{ m: 0, p: 0, mr: 0.3, pr: "1px", width: "auto", maxWidth: 20 }} size="small" onClick={handleOpen}>
                    <Icon sx={{ m: 0, p: 0, fontSize: fontSize + 5, width: "auto" }} className="c-calendario" />
                  </IconButton>
                </Grid>
                <Grid size="auto">
                  <IconButton sx={{ m: 0, p: 0, mr: 0.3, pr: "1px", width: "auto", maxWidth: 20 }} size="small" onClick={clearInput}>
                    <Icon sx={{ m: 0, p: 0, fontSize: fontSize, width: "auto" }} className="c-x1" />
                  </IconButton>
                </Grid>
              </Grid>
            </Grid>
          ),
        }}
        error={error}
        helperText={errorMessage}
      />

      <Popper
        open={!input.readonly && open}
        anchorEl={anchorEl}
        sx={{ zIndex: (theme) => theme.zIndex.tooltip + 5 }}
        modifiers={[
          {
            name: "flip",
            options: {
              fallbackPlacements: ["top", "right", "left"],
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
          <Box
            sx={{
              "& .MuiDateCalendar-root": {
                height: "290px",
              },
              "& .MuiPickersToolbar-root": {
                "&.MuiDateTimePickerToolbar-root": {
                  paddingY: 1,
                },
              },
              "& .MuiDateTimePickerToolbar-timeDigitsContainer": {
                display: "flex !important",
                alignItems: "center !important",
              },
              "& .MuiTypography-root": {
                // Dia
                "&.MuiPickersToolbarText-root": {
                  fontSize: "x-large !important",
                },
                "&.MuiTypography-subtitle1": {
                  fontSize: "medium !important",
                },
                "&.MuiTypography-subtitle2": {
                  fontSize: "medium !important",
                  "&.Mui-selected": {
                    fontWeight: "bold !important",
                  },
                },
                "&.MuiDateTimePickerToolbar-separator": {
                  fontSize: "x-large !important",
                },
              },
            }}
          >
            <StaticDateTimePicker
              label={
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    color: input.error ? "red.main" : input?.color ? (themeMode == "dark" ? `${input?.color}.300` : `${input?.color}.800`) : `primary.${opositeMode}`,
                  }}
                >
                  {input.icono && <Icon className={input.icono} sx={{ fontSize: 15, mr: 0.5 }} />}
                  {`${input.requerido ? "* " : ""}${input.label || input.id || ""}`}
                </Box>
              }
              format={input.format || "dd-MM-yyyy HH:mm"}
              views={["year", "month", "day", "hours", "minutes"]}
              minDate={input.min}
              maxDate={input.max}
              readOnly={currentInput.readonly}
              value={formState.formState[currentInput.id]}
              onChange={onChange}
              slots={{
                actionBar: CustomActionBar,

                clearButton: () => (
                  <IconButton sx={{ m: 0, p: 0, mr: 0.4, pr: "1px", width: "auto", maxWidth: 20 }} size="small" color="black" onClick={clearInput}>
                    <Typography sx={{ m: 0, p: 0, fontSize: 12, width: "auto" }} className="c-x1" />
                  </IconButton>
                ),
                openPickerButton: (props) => (
                  <IconButton sx={{ m: 0, p: 0, mr: 0.3, pr: "1px", width: "auto", maxWidth: 20 }} size="small" color="black" {...props}>
                    <Typography sx={{ m: 0, p: 0, width: "auto" }} className="c-calendario" />
                  </IconButton>
                ),
              }}
              slotProps={{
                toolbar: { hidden: true },
                textField: {
                  variant: "filled",
                  size: "small",
                  sx: { ...styleFilled(currentInput), width: "-webkit-fill-available", minHeight: "-webkit-fill-available" },
                },
                field: { clearable: true },
                actionBar: { actions: ["today"], style: { justifyContent: "flex-start" } },
                desktopPaper: {
                  sx: {
                    // fontSize: "medium",
                    "& .MuiPickersLayout-root": { width: "200px" },
                    "& .MuiPickersCalendarHeader-root": {
                      m: "0px !important",
                      mx: "10px !important",
                      flexDirection: "row",
                      py: 0.5,
                      px: 0,
                      justifyContent: "space-between",
                      maxHeight: "fit-content !important",
                      minHeight: "fit-content !important",
                      "& .MuiPickersCalendarHeader-labelContainer": {
                        py: 0.5,
                        px: 0,
                        minHeight: 20,
                        maxHeight: 20,
                      },
                    },
                    "& .MuiPickersCalendarHeader-root *": { m: 0, p: 0, height: "fit-content", minHeight: 20, width: "fit-content" },
                    "& .MuiDateCalendar-root": { m: 0, p: 0, height: "fit-content", minHeight: 20, width: "100%" },
                    "& .MuiPickersSlideTransition-root": { m: 0, p: 0, minHeight: "12em", maxHeight: "12em" },
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
          </Box>
        </ClickAwayListener>
      </Popper>
    </LocalizationProvider>
  );
};

DateTimePickerComponent.propTypes = {
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
export default DateTimePickerComponent;
