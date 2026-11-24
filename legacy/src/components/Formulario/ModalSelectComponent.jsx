import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Chip, Icon, TextField, Typography, ListItem, ListItemIcon, ListItemText, Box, createFilterOptions, Autocomplete } from "@mui/material";
import { useForm } from "../../hooks/useForm";
import { inputPropTypes } from "./";
import { style } from "./selectComponentStyles";
import { styleFilled } from "./textComponentStyles";
import { useSelector } from "react-redux";

const filter = createFilterOptions();

const ModalSelectComponent = (props) => {
  const { input, onInput, id } = props;
  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);
  const [valor, setValor] = useState(input.multiple ? [] : null);
  const [options, setOptions] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [error, setError] = useState(false);

  const [newOption, setNewOption] = useState(false);

  useEffect(() => {
    setValor(!input["val"] ? (input.multiple ? [] : null) : input["val"]);
    setOptions(input["options"] || []);
  }, [input.val, input.options]);

  const onChange = (ev, val) => {
    ev.preventDefault();
    if (val?.value == -10) {
      input.onBuscar();
      setValor(input.multiple ? [] : null);
      onInput(input.multiple ? [] : null);
    } else if (val?.value == -20) {
      input.onCrear();
      setValor(input.multiple ? [] : null);
      onInput(input.multiple ? [] : null);
    } else {
      setValor(val);
      onInput(val);
    }
  };

  const clearInput = (ev) => {
    ev.preventDefault();
    setValor(input.multiple ? [] : null);
    onInput(input.multiple ? [] : null);
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
    [input]
  );

  useEffect(() => verificarInputSegunTipo(input.val), [input, verificarInputSegunTipo]);

  return (
    <Autocomplete
      id={id}
      disablePortal
      disableCloseOnSelect={input.multiple}
      isOptionEqualToValue={(op, val) => op[input.valueOption || "value"] === val[input.valueOption || "value"]}
      options={options}
      filterOptions={(options, params) => {
        const filtered = filter(options, params);
        const { inputValue } = params;
        filtered.push({
          inputValue,
          label: "Buscar...",
          value: -10,
        });
        filtered.push({
          inputValue,
          label: "Crear...",
          value: -20,
        });
        return filtered;
      }}
      sx={{ ...style(input), "& .MuiFormControl-root": { mt: "11px", width: "100%" } }}
      ListboxProps={{ style: { maxHeight: "10rem" } }}
      getOptionLabel={(option) => option[input.labelOption || "label"]}
      onChange={onChange}
      size="small"
      onKeyDown={input.teclaPresionada}
      name={input.id}
      multiple={input.multiple}
      value={valor}
      renderTags={(value, getTagProps) => {
        return (Array.isArray(value) ? value : [value]).map((option, index) => {
          const { key, ...tagProps } = getTagProps({ index });
          return <Chip {...tagProps} key={option[input.valueOption || "value"]} label={option?.label} size="large" p={0} m={0} sx={{ lineHeight: 1, height: "auto" }} />;
        });
      }}
      clearIcon={<Typography component="span" sx={{ fontSize: 10, m: 0, p: 0, width: "100%", visibility: "visible !important" }} className="c-x1" />}
      popupIcon={<Typography component="span" sx={{ fontSize: 15, m: 0, p: 0, width: "100%", visibility: "visible !important" }} className="c-abajo-simple" />}
      readOnly={input.readonly}
      renderInput={(params) => (
        <>
          <TextField
            sx={styleFilled(input)}
            variant="filled"
            label={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: error || input.error ? "red.main" : input?.color ? (themeMode == "dark" ? `${input?.color}.300` : `${input?.color}.800`) : `primary.${opositeMode}`,
                }}
              >
                {input.icono && <Icon className={input.icono} sx={{ fontSize: 15, mr: 0.5 }} />}
                {`${input.requerido ? " *" : ""} ${input.label || input.id || ""}`}
              </Box>
            }
            {...params}
            InputProps={{ ...params.InputProps, readOnly: input.readonly }}
            readOnly={input.readonly}
            error={error}
            helperText={errorMessage}
          />
        </>
      )}
      renderOption={(props, option) => (
        <ListItem {...props} key={`${option.label}_${option.value}`}>
          {option?.value == -20 ? <Icon className="c-suma" sx={{ mr: 1 }} /> : null}
          {option?.value == -10 ? <Icon className="c-lupa" sx={{ mr: 1 }} /> : null}
          <ListItemText primary={option.label} />
        </ListItem>
      )}
    />
  );
};

ModalSelectComponent.propTypes = {
  input: inputPropTypes.isRequired,
  onInput: PropTypes.func,
};

export default ModalSelectComponent;
