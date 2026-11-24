import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Grid, Icon, IconButton, MenuItem, TextField, Tooltip, Typography } from "@mui/material";
import { useForm } from "../../../hooks/useForm";
import { inputPropTypes } from "./";
import { placeholder, style, styleFilled, styleStandard } from "./textComponentStyles";
import { useSelector } from "react-redux";

const TextComponent = (props) => {
  const { input, onInput, id } = props;
  const { fontSize, colors } = useSelector((state) => state.theme);
  // const input = useMemo(() => input, [input]);

  const formState = useForm({
    [input.id]: input.val,
  });

  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [mostrar, setMostrar] = useState(false);
  // const [input, setInput] = useState(input);

  const obtenerHelperDeInputSegunTipo = (input) => {
    switch (input.tipo) {
      // case "number":
      //   return "123";
      // case "textarea":
      // case "text":
      //   return "Abc";
      // case "email":
      //   return "a@b.c";
      // case "password":
      //   return "***";
      // case "date":
      //   return "00/00/0000";

      default:
        return "";
    }
  };

  const verificarInputSegunTipo = useCallback(
    (val) => {
      let isValid = true;
      let message = "";

      if (input.requerido && val === "") {
        isValid = false;
        message = `El campo ${input.label} es requerido`;
      } else if (input.formato) {
        const regex = input.formato;
        if (!regex.test(val) && val !== "") {
          isValid = false;
          message = input.errorMessage || "El formato no es el correcto.";
        }
      } else if (input.message) {
        message = input.message;
      } else {
        switch (input.tipo) {
          case "number":
            if (isNaN(val)) {
              isValid = false;
              message = "Debe ser un número.";
            }
            if (input.max !== undefined) {
              if (Number(val) > Number(input.max)) {
                isValid = false;
                message = `El valor debe ser menor o igual a ${input.max}`;
              }
            }
            if (input.min !== undefined) {
              if (Number(val) < Number(input.min)) {
                isValid = false;
                message = `El valor debe ser mayor o igual a ${input.min}`;
              }
            }
            break;
          case "email": {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!regex.test(val)) {
              isValid = false;
              message = "El formato del correo no es correcto.";
            }
            break;
          }
          default:
            isValid = true;
            message = "";
            break;
        }
      }

      setError(!isValid);
      setErrorMessage(message);
    },
    [input]
  );

  const onChange = (ev) => {
    ev.preventDefault();
    const { value } = ev.target;
    // verificarInputSegunTipo(value);
    let newValue = value;

    formState.onInputChange({ target: { name: input.id, value: newValue } });
    onInput(newValue);
  };

  const clearInput = (ev) => {
    ev.preventDefault();
    formState.onInputChange({ target: { name: input.id, value: "" } });
    onInput("");
    // verificarInputSegunTipo("");
  };

  // const placeholder = (input) => `${input?.placeholder || input?.label || ""}${input?.requerido ? " *" : ""}`.toUpperCase();

  useEffect(() => verificarInputSegunTipo(input.val), [input, verificarInputSegunTipo]);

  useEffect(() => {
    formState.formState[input.id] = input.val;
  }, [input, formState.formState]);

  useEffect(() => {
    if (input.error !== undefined) {
      setError(input.error);
      setErrorMessage(input.errorMessage || (input.error && "Error"));
    }
  }, [input]);

  return (
    <Box sx={{ px: 0.5, width: "100%" }}>
      {/* <pre>{JSON.stringify(colors)}</pre> */}
      <TextField
        // sx={{ "& .MuiInputBase-root": { marginTop: "7px" }, "& .MuiInputBase-root.Mui-focused": { marginTop: "7px" }, "& .MuiFormLabel-root": {} }}
        id={id}
        sx={{
          ...styleFilled(input),
          ...(error && {
            "& .MuiFormLabel-root.Mui-error": {
              color: "accent.main",
            },
            "& .Mui-error::before": {
              borderBottomColor: `${colors.accent.main} !important`, // "accent.main",
            },
            "&.MuiInputBase-root.Mui-error::after": {
              borderBottomColor: `${colors.accent.main} !important`, // "accent.main",
            },
            "& .MuiFormHelperText-root.Mui-error": {
              color: "accent.main",
            },
          }),
        }}
        label={`${input.label || input.id || ""}${input.requerido ? " *" : ""}`}
        variant="filled"
        type={input.tipo === "password" ? (mostrar ? "text" : "password") : input.tipo === "archivo" ? "file" : input.tipo}
        fullWidth
        name={input.id}
        value={formState[input.id]}
        onChange={onChange}
        autoComplete="new-password"
        // InputLabelProps={{ shrink: true }}
        multiline={input.tipo === "textarea" || input.tipo === "texteditor"}
        onKeyDown={input.teclaPresionada}
        aria-readonly={input.readonly}
        color={error ? "accent" : input.readonly ? "grey" : input.color || "text"}
        readOnly={input.readonly}
        slotProps={{
          htmlInput: { maxLength: input.max },
          input: {
            autoComplete: "off",
            readOnly: input.readonly,
            endAdornment: (
              <Grid size="auto">
                <Grid container direction="row" position="end">
                  {!input.readonly && (
                    <Grid size="grow" sx={{ mr: 1, userSelect: "none" }}>
                      <Typography variant="span" color={error ? "accent.main" : input.color || "grey.400"}>
                        {obtenerHelperDeInputSegunTipo(input)}
                      </Typography>
                    </Grid>
                  )}
                  {!input.readonly && formState[input.id] !== "" && (
                    <Grid>
                      <IconButton sx={{ m: 0, p: 0, pr: "1px", width: "auto", maxWidth: 20 }} size="small" color="black" onClick={clearInput}>
                        <Typography color={input.color || "text"} sx={{ m: 0, p: 0, fontSize: 12, width: "auto" }} className="c-x1" />
                      </IconButton>
                    </Grid>
                  )}
                  {input.tipo === "password" && (
                    <Grid>
                      <IconButton sx={{ m: 0, p: 0, mr: 0.3, pr: "1px", width: "auto", maxWidth: 20 }} size="small" color="black" onClick={() => setMostrar((v) => !v)}>
                        <Typography color={input.color || "text"} sx={{ m: 0, p: 0, fontSize: fontSize, width: "auto" }} className={`${mostrar ? "c-ojo" : "c-no-ver"}`} />
                      </IconButton>
                    </Grid>
                  )}
                  {error && (
                    <Grid ml={0.5}>
                      <Tooltip title={errorMessage}>
                        <Typography color={input.color || "text"} sx={{ m: 0, p: 0, fontSize: fontSize, width: "auto" }} className={`${mostrar ? "c-ojo" : "c-ayuda"}`} />
                      </Tooltip>
                    </Grid>
                  )}
                  {/* {!input.readonly && formState[input.id] !== "" && (
                  <Grid>
                    <IconButton sx={{ m: 0, p: 0, mr: 0.3, pr: "1px", width: "auto", maxWidth: 20 }} size="small" color="black" onClick={clearInput}>
                      <Icon  sx={{ m: 0, p: 0, fontSize: fontSize + 5, width: "auto" }} className="c-square-plus1" />
                    </IconButton>
                  </Grid>
                )} */}
                </Grid>
              </Grid>
            ),
          },
        }}
        error={error}
        helperText={errorMessage}
      />
      {/* <pre>{JSON.stringify(input, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(formState, null, 2)}</pre> */}
    </Box>
  );
};

TextComponent.propTypes = {
  input: PropTypes.shape({
    id: PropTypes.string.isRequired,
    val: PropTypes.any,
    requerido: PropTypes.bool,
    label: PropTypes.string,
    tipo: PropTypes.string,
    inputTipo: PropTypes.string,
    teclaPresionada: PropTypes.func,
    readonly: PropTypes.bool,
    errorMessage: PropTypes.string,
    error: PropTypes.bool,
    formato: PropTypes.string,
    message: PropTypes.string,
    color: PropTypes.string,
    max: PropTypes.number,
    min: PropTypes.number,
  }).isRequired,
  onInput: PropTypes.func,
};

export default TextComponent;
