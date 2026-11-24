import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { CircularProgress, Autocomplete, Grid, Icon, TextField, Typography, ListItem, ListItemText, createFilterOptions } from "@mui/material";
import { inputPropTypes } from "./";
import { style } from "./selectComponentStyles";
import { styleFilled } from "./textComponentStyles";
import { useDebounce } from "../../../utils/debounce";
import { api } from "../../../api";

const filter = createFilterOptions();

const SelectQueryComponent = (props) => {
  const { input, onInput, id } = props;
  const [valor, setValor] = useState(input.multiple ? [] : null);
  const [options, setOptions] = useState([
    ...(input.val ? [{ [input.labelOption]: input.val[input.labelOption], [input.valueOption]: input.val[input.valueOption] }] : []),
    { [input.labelOption]: "Crear...", [input.valueOption]: -20 },
  ]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const DEBOUNCE_DELAY = 300;

  const debouncedSearchTerm = useDebounce(inputValue, DEBOUNCE_DELAY);

  useEffect(() => {
    setValor(!input["val"] ? (input.multiple ? [] : null) : input["val"]);
  }, [input.val]);

  const onChange = (ev, val) => {
    ev.preventDefault();

    if (!val) {
      setValor(val);
      onInput(val);
      return;
    }

    if (val[input.valueOption] == -20) {
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

  const convertKeysToLowerCase = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map((v) => convertKeysToLowerCase(v));
    } else if (obj !== null && obj.constructor === Object) {
      return Object.keys(obj).reduce((acc, key) => {
        acc[key.toLowerCase()] = convertKeysToLowerCase(obj[key]);
        return acc;
      }, {});
    }
    return obj;
  };

  function removeDuplicates(items, id) {
    const seenIds = new Set();
    return items.filter((item) => {
      if (seenIds.has(item[id])) {
        return false;
      }
      seenIds.add(item[id]);
      return true;
    });
  }

  const fetchData = async (query) => {
    setLoading(true);
    setOptions([]);
    try {
      if (input.method == "GET") {
        api
          .get(input.url, {
            params: {
              ...input.params,
              [input.queryField]: debouncedSearchTerm,
            },
          })
          .then(({ data }) => {
            setOptions([...removeDuplicates(convertKeysToLowerCase(data.data.data), input.valueOption), { [input.labelOption]: "Crear...", [input.valueOption]: -20 }]);
          })
          .catch((e) => console.error(e));
      } else {
        api
          .post(input.url, {
            ...input.params,
            [input.queryField]: debouncedSearchTerm,
          })
          .then(({ data }) => {
            setOptions([...removeDuplicates(convertKeysToLowerCase(data.data.data), input.valueOption), { [input.labelOption]: "Crear...", [input.valueOption]: -20 }]);
          })
          .catch((e) => console.error(e));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
      fetchData(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <Grid container direction="row" width="100%">
      <Grid size="grow">
        <Autocomplete
          // disablePortal
          disableCloseOnSelect={input.multiple}
          isOptionEqualToValue={(op, val) => op[input.valueOption || "value"] === val[input.valueOption || "value"]}
          id={id}
          onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
          loading={loading}
          options={options}
          style={{ width: "100%" }}
          sx={{ ...style(input), "& .MuiFormControl-root": { mt: "0px", width: "100%" } }}
          ListboxProps={{ style: { maxHeight: "10rem" } }}
          getOptionLabel={(option) => {
            return option[input.labelOption || "label"] || "";
          }}
          getOptionKey={(option) => {
            return option[input.valueOption || "value"] || "";
          }}
          onChange={onChange}
          size="small"
          // onKeyDown={input.teclaPresionada}
          name={input.id}
          // multiple={input.multiple}
          value={valor}
          inputValue={inputValue}
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
              sx={{
                ...styleFilled(input),
                ...styleFilled(input),
                "& .MuiFormLabel-root.Mui-error": {
                  color: "accent.main",
                },
                "& .MuiInput-underline.Mui-error:before": {
                  borderBottomColor: "accent.main",
                },
                "& .MuiInput-underline.Mui-error:after": {
                  borderBottomColor: "accent.main",
                },
                "& .MuiFormHelperText-root.Mui-error": {
                  color: "accent.main",
                },
              }}
              variant="filled"
              label={`${input.label || input.id || ""}${input.requerido ? " *" : ""}`}
              {...params}
              InputProps={{ ...params.InputProps, readOnly: input.readonly }}
              readOnly={input.readonly}
              placeholder=" Escribe algo para buscar..."
            />
          )}
          filterOptions={(x) => x}
          renderOption={(props, option) => (
            <ListItem {...props} key={`${option[input.labelOption || "label"]}_${option[input.valueOption || "value"]}`}>
              {option[input.valueOption || "value"] == -20 ? <Icon className="c-suma" sx={{ mr: 1 }} /> : null}
              {/* {option[input.valueOption || "value"] == -10 ? <Icon className="c-lupa" sx={{ mr: 1 }} /> : null} */}
              <ListItemText primary={option[input.labelOption || "label"]} primaryTypographyProps={{ fontSize: 12 }} />
            </ListItem>
          )}
        />
      </Grid>
    </Grid>
  );
};

SelectQueryComponent.propTypes = {
  input: inputPropTypes.isRequired,
  onInput: PropTypes.func,
};

export default SelectQueryComponent;
