import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FormControl, FormControlLabel, FormLabel, Checkbox, Typography, FormGroup, Box, Icon } from "@mui/material";
import { inputPropTypes, styleGenerar } from ".";
import { useForm } from "../../hooks/useForm";
import { style, styleFilled } from "./textComponentStyles";
import { useSelector } from "react-redux";
import InputLabelComponent from "./InputLabelComponent";

const CheckboxComponent = (props) => {
  const { input, onInput, id } = props;
  const [currentInput, setCurrentInput] = useState({
    ...input,
    val:
      input.options === true || input.options === false || (Array.isArray(input.options) && input.options.length === 1 && typeof input.options[0].value === "boolean")
        ? Boolean(input.val)
        : Array.isArray(input.val)
          ? input.val
          : [],
  });
  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);

  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const esSingleBoolean =
    currentInput.options === true || currentInput.options === false || (Array.isArray(currentInput.options) && currentInput.options.length === 1 && typeof currentInput.options[0].value === "boolean");

  const verificarInputSegunTipo = useCallback(
    (val) => {
      let isValid = true;
      let message = "";

      if ((input.requerido && input.intento > 0 && !val) || (input.requerido && input.intento > 0 && val.length === 0)) {
        isValid = false;
        message = `El campo es requerido`;
      } else if (input.message) {
        message = input.message;
      }

      setError(!isValid);
      setErrorMessage(message);
    },
    [input]
  );

  useEffect(() => verificarInputSegunTipo(input.val), [input, verificarInputSegunTipo]);

  useEffect(() => setCurrentInput(input), [input, setCurrentInput]);

  const formState = useForm({ [currentInput.id]: currentInput.val });

  const onChange = (ev) => {
    // Si es single boolean
    if (esSingleBoolean) {
      const nuevo = ev.target.checked;
      formState.onInputChange({ target: { name: currentInput.id, value: nuevo } });
      onInput(nuevo);
      verificarInputSegunTipo(nuevo);
      return;
    }

    // Caso multi-opción (tu lógica original)
    const { value, checked } = ev.target;
    const updatedValues = checked ? [...currentInput.val, value] : currentInput.val.filter((v) => v !== value);

    formState.onInputChange({ target: { name: currentInput.id, value: updatedValues } });
    onInput(updatedValues);
    verificarInputSegunTipo(updatedValues);
  };

  return (
    <Box sx={{ ...styleGenerar(input), p: esSingleBoolean ? 0.5 : 0 }}>
      <FormControl error={error}>
        {!esSingleBoolean && (
          <FormLabel sx={{ p: 0, m: 0, pl: 1 }} id={currentInput.id}>
            <InputLabelComponent input={input} error={error} />
          </FormLabel>
        )}
        <FormGroup id={id}>
          {/* CASO SINGLE BOOLEAN */}
          {esSingleBoolean ? (
            <FormControlLabel
              control={<Checkbox checked={Boolean(currentInput.val)} onChange={onChange} disabled={input.readonly} sx={{ p: 0, m: 0, pl: 1 }} color={error ? "error" : "primary"} />}
              label={currentInput.label || "Activo"}
              sx={{ m: 0, p: 0 }}
            />
          ) : (
            /* CASO MULTI-OPCIÓN */
            currentInput.options.map((i) => (
              <FormControlLabel
                key={i.value}
                value={String(i.value)}
                control={<Checkbox checked={Array.isArray(currentInput.val) && currentInput.val.includes(String(i.value))} onChange={onChange} disabled={input.readonly} sx={{ p: 0, m: 0, pl: 1 }} />}
                label={<Typography color={error ? "error" : ""}>{i.label}</Typography>}
                sx={{ m: 0, p: 0 }}
              />
            ))
          )}
        </FormGroup>

        {error ? (
          <Typography sx={{ fontSize: "0.75rem" }} color="error">
            {errorMessage}
          </Typography>
        ) : (
          ""
        )}
      </FormControl>
    </Box>
  );
};

CheckboxComponent.propTypes = {
  input: inputPropTypes.isRequired,
  onInput: PropTypes.func,
};

export default CheckboxComponent;
