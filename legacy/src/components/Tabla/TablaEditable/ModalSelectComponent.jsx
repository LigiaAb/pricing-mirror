import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Grid, Icon, TextField, Typography, ListItem, ListItemText, createFilterOptions, Autocomplete } from "@mui/material";
import { inputPropTypes } from "./";
import { style } from "./selectComponentStyles";
import { styleFilled } from "./textComponentStyles";

const filter = createFilterOptions();

const ModalSelectComponent = (props) => {
  const { input, onInput, id } = props;
  const [valor, setValor] = useState(input.multiple ? [] : null);
  const [options, setOptions] = useState([]);

  useEffect(() => {
    if (valor !== input["val"]) setValor(!input["val"] ? (input.multiple ? [] : null) : input["val"]);
    if (JSON.stringify(options) !== JSON.stringify(input["options"])) setOptions(input["options"] || []);
  }, [input, options, valor]);

  const onChange = (ev, val) => {
    ev.preventDefault();

    if (!val) {
      setValor(val);
      onInput(val);
      return;
    }

    if (val[input.valueOption] == -10) {
      input.onBuscar();
      setValor(input.multiple ? [] : null);
      onInput(input.multiple ? [] : null);
    } else if (val[input.valueOption] == -20) {
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

  return (
    <Grid container direction="row" width="100%">
      <Grid size="grow">
        <Autocomplete
          // disablePortal
          disableCloseOnSelect={input.multiple}
          isOptionEqualToValue={(op, val) => op[input.valueOption || "value"] === val[input.valueOption || "value"]}
          id={id}
          options={options}
          style={{ width: "100%" }}
          sx={{ ...style(input), "& .MuiFormControl-root": { mt: "0px", width: "100%" } }}
          ListboxProps={{ style: { maxHeight: "10rem" } }}
          getOptionLabel={(option) => {
            return option[input.labelOption || "label"];
          }}
          getOptionKey={(option) => {
            return option[input.valueOption || "value"];
          }}
          onChange={onChange}
          size="small"
          onKeyDown={input.teclaPresionada}
          name={input.id}
          multiple={input.multiple}
          value={valor}
          clearIcon={
            <Typography color={input.readonly ? "grey" : input.color || "text"} component="span" sx={{ fontSize: 10, m: 0, p: 0, width: "100%", visibility: "visible !important" }} className="c-x1" />
          }
          popupIcon={
            <Typography
              color={input.readonly ? "grey" : input.color || "text"}
              component="span"
              sx={{ fontSize: 15, m: 0, p: 0, width: "100%", visibility: "visible !important" }}
              className="c-abajo-simple"
            />
          }
          readOnly={input.readonly}
          renderInput={(params) => (
            <TextField
              color={input.readonly ? "grey" : input.color || "text"}
              sx={styleFilled(input)}
              variant="filled"
              label={`${input.label || input.id || ""}${input.requerido ? " *" : ""}`}
              {...params}
              InputProps={{ ...params.InputProps, readOnly: input.readonly }}
              readOnly={input.readonly}
            />
          )}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);
            const { inputValue } = params;
            // filtered.push({
            //   inputValue,
            //   [input.labelOption]: "Buscar...",
            //   [input.valueOption]: -10
            // });
            filtered.push({
              inputValue,
              [input.labelOption]: "Crear...",
              [input.valueOption]: -20,
            });
            return filtered;
          }}
          renderOption={(props, option) => (
            <ListItem {...props} key={`${option[input.labelOption || "label"]}_${option[input.valueOption || "value"]}`}>
              {option[input.valueOption || "value"] == -20 ? <Icon className="c-suma" sx={{ mr: 1 }} /> : null}
              {option[input.valueOption || "value"] == -10 ? <Icon className="c-lupa" sx={{ mr: 1 }} /> : null}
              <ListItemText primary={option[input.labelOption || "label"]} primaryTypographyProps={{ fontSize: 12 }} />
            </ListItem>
          )}
        />
      </Grid>
    </Grid>
  );
};

ModalSelectComponent.propTypes = {
  input: inputPropTypes.isRequired,
  onInput: PropTypes.func,
};

export default ModalSelectComponent;
