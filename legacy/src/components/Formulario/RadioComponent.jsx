import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, Typography, Box, Icon, Divider } from "@mui/material";
import { inputPropTypes } from ".";
import { useForm } from "../../hooks/useForm";
import { style, styleFilled } from "./textComponentStyles";
import { useSelector } from "react-redux";

const RadioComponent = (props) => {
  const { input, onInput, id } = props;

  const [currentInput, setCurrentInput] = useState(input);
  const [errorMessage, setErrorMessage] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => setCurrentInput(input), [input, setCurrentInput]);
  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);

  const formState = useForm({ [currentInput.id]: currentInput.val });

  const onChange = (ev) => {
    const { target } = ev;
    const { value } = target;

    formState.onInputChange({ target: { name: currentInput.id, value } });
    onInput(value);
  };

  const verificarInputSegunTipo = useCallback(
    (val) => {
      let isValid = true;
      let message = "";

      if (input.requerido && input.intento > 0 && !val) {
        isValid = false;
        message = `El campo ${input.label} es requerido`;
      }
      setError(!isValid);
      setErrorMessage(message);
    },
    [input],
  );

  useEffect(() => verificarInputSegunTipo(input.val), [input, verificarInputSegunTipo]);

  return (
    <>
      <FormControl sx={{ ...styleFilled(input) }} error={error}>
        <FormLabel sx={{ p: 0, m: 0, pl: 1 }} id={currentInput.id}>
          {
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                color: error || input.error ? "red.main" : input?.color ? (themeMode == "dark" ? `${input?.color}.300` : `${input?.color}.800`) : `primary.${opositeMode}`,
              }}
            >
              {currentInput.icono && <Icon className={currentInput.icono} sx={{ fontSize: 15, mr: 0.5 }} />}
              {`${currentInput.requerido ? "* " : ""}${currentInput.label || currentInput.id || ""}`}
            </Box>
          }
        </FormLabel>
        <RadioGroup sx={{ p: 0, m: 0, pl: 1, py: 0.5 }} id={id} row aria-labelledby={currentInput.id} name={currentInput.id} value={currentInput.val} onChange={onChange}>
          {currentInput.options?.map((i) => (
            <FormControlLabel
              sx={{ p: 0, m: 0 }}
              key={i[input.valueOption] || i.value}
              value={i[input.valueOption] || i.value}
              disabled={input.readonly}
              control={
                <Radio
                  sx={{
                    p: 0,
                    m: 0,
                    pl: 1,
                    color: error || input.error ? "red.main" : input?.color ? (themeMode == "dark" ? `${input?.color}.300` : `${input?.color}.800`) : `primary.${opositeMode}`,
                    "&.Mui-checked": {
                      color: error || input.error ? "red.main" : input?.color ? (themeMode == "dark" ? `${input?.color}.300` : `${input?.color}.800`) : `primary.${opositeMode}`,
                    },
                  }}
                />
              }
              color={error || input.error ? "red.main" : input?.color ? (themeMode == "dark" ? `${input?.color}.300` : `${input?.color}.800`) : `primary.${opositeMode}`}
              label={
                <Typography
                  variant="span"
                  color={error || input.error ? "red.main" : input?.color ? (themeMode == "dark" ? `${input?.color}.300` : `${input?.color}.800`) : `primary.${opositeMode}`}
                >{`${i[input.labelOption] || i.label}`}</Typography>
              }
            />
          ))}
        </RadioGroup>
      </FormControl>
      {errorMessage !== "" && (
        <>
          <Divider color="red" fullWidth />
          <p className="MuiFormHelperText-root Mui-error MuiFormHelperText-sizeSmall MuiFormHelperText-contained css-1r4bweo-MuiFormHelperText-root" id=":rtr:-helper-text">
            {errorMessage}
          </p>
        </>
      )}
    </>
  );
};

RadioComponent.propTypes = {
  input: inputPropTypes.isRequired,
  onInput: PropTypes.func,
};

export default RadioComponent;
