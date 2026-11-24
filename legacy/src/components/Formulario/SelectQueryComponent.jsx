import React, { forwardRef, useCallback, useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import { Popper, Autocomplete, Chip, Grid, Icon, TextField, Typography, Box, Tooltip, IconButton, autocompleteClasses } from "@mui/material";
import { useSelector } from "react-redux";
import { styled, useTheme } from "@mui/material/styles";
import { VariableSizeList } from "react-window";
import { styleFilled } from "./textComponentStyles";
import { inputPropTypes } from "./";
import { style } from "./selectComponentStyles";
import InputLabelComponent from "./InputLabelComponent";

// padding del listbox virtualizado
const LISTBOX_PADDING = 10;

// contexto externo para react-window
const OuterElementContext = React.createContext({});
const OuterElementType = forwardRef((props, ref) => {
  const outerProps = React.useContext(OuterElementContext);
  return <div ref={ref} {...props} {...outerProps} />;
});
OuterElementType.displayName = "OuterElementType";

// reset del cache de react-window cuando cambian los datos
function useResetCache(data) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.resetAfterIndex(0, true);
    }
  }, [data]);
  return ref;
}

// Listbox virtualizado fusionado
const ListboxComponent = forwardRef(function ListboxComponent({ children, ...other }, ref) {
  const itemData = [];
  children.forEach((item) => {
    itemData.push(item);
    itemData.push(...(item.children || []));
  });

  const itemCount = itemData.length;
  const getItemSize = () => 25;
  const getChildSize = () => getItemSize();

  const getHeight = () => {
    if (itemCount > 8) return 8 * getItemSize();
    return itemData.map(() => getChildSize()).reduce((a, b) => a + b, 0);
  };

  const gridRef = useResetCache(itemCount);

  return (
    <div ref={ref} {...other} style={{ padding: 0 }}>
      <OuterElementContext.Provider value={other}>
        <VariableSizeList
          itemData={itemData}
          height={getHeight() + 2 * LISTBOX_PADDING}
          width="100%"
          ref={gridRef}
          outerElementType={OuterElementType}
          innerElementType="ul"
          itemSize={getChildSize}
          overscanCount={5}
          itemCount={itemCount}
        >
          {({ data, index, style }) => {
            const child = data[index];
            const inlineStyle = {
              ...style,
              top: style.top + LISTBOX_PADDING,
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
            };
            return <div style={inlineStyle}>{child}</div>;
          }}
        </VariableSizeList>
      </OuterElementContext.Provider>
    </div>
  );
});

// popper estilizado fusionado
const StyledPopper = styled(Popper)({
  [`& .${autocompleteClasses.listbox}`]: {
    boxSizing: "border-box",
    "& ul": { padding: 0, margin: 0 },
  },
});

const SelectComponent = (props) => {
  const { input, onInput, id } = props;

  const [valor, setValor] = useState(input.multiple ? [] : null);
  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);
  const [options, setOptions] = useState([]);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef(null);

  useEffect(() => {
    if (input.options && input.options.length > 0) {
      setOptions(input.options);
    }
  }, [input.options]);

  useEffect(() => {
    if (valor !== input.val) {
      setValor(!input.val ? (input.multiple ? [] : null) : input.val);
    }
  }, [input, valor]);

  const verificarInputSegunTipo = useCallback(
    (val) => {
      let isValid = true;
      let message = "";

      if (input.requerido && input.intento > 0 && !val) {
        isValid = false;
        message = "El campo es requerido";
      } else if (input.message) {
        message = input.message;
      }

      setError(!isValid);
      setErrorMessage(message);
    },
    [input],
  );

  useEffect(() => verificarInputSegunTipo(input.val), [input, verificarInputSegunTipo]);

  const onChange = (ev, val) => {
    ev.preventDefault();
    setValor(val);
    onInput(val);
  };

  const clearInput = (ev) => {
    ev.preventDefault();
    setValor(input.multiple ? [] : null);
    setInputValue("");
    onInput(input.multiple ? [] : null);
  };

  const searchFromApi = async (searchTerm) => {
    if (typeof input.fetchOptions !== "function") {
      console.warn("No hay función fetchOptions definida");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const results = await input.fetchOptions(searchTerm);
      setOptions(results || []);
    } catch (e) {
      console.error("Error fetching options:", e);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const onInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (newInputValue.length >= 3) {
      debounceRef.current = setTimeout(() => {
        searchFromApi(newInputValue);
      }, 500);
    } else if (newInputValue.length === 0 && input.options) {
      setOptions(input.options);
    }
  };

  const extractText = (element) => {
    if (typeof element === "string" || typeof element === "number") return element;
    if (React.isValidElement(element)) {
      return React.Children.toArray(element.props.children).map(extractText).join(" ");
    }
    return "";
  };

  return (
    <Grid container direction="row" width="100%" wrap="nowrap" alignItems="center" columnSpacing={1} pr={0.3}>
      <Grid size="grow">
        <Autocomplete
          disablePortal={false}
          disableCloseOnSelect={input.multiple}
          isOptionEqualToValue={(op, val) => op[input.valueOption || "value"] === val[input.valueOption || "value"]}
          id={id}
          options={options}
          sx={{ ...style(input), "& .MuiFormControl-root": { mt: 0, width: "100%" } }}
          getOptionLabel={(option) => extractText(option[input.labelOption || "label"])}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            const label = option[input.labelOption || "label"];
            return (
              <Box key={key} component="li" {...optionProps}>
                {input.renderOption ? option[input.renderOption] : label}
              </Box>
            );
          }}
          onChange={onChange}
          onInputChange={onInputChange}
          inputValue={inputValue}
          size="small"
          onKeyDown={input.teclaPresionada}
          name={input.id}
          multiple={input.multiple}
          value={valor}
          loading={loading}
          renderTags={(value, getTagProps) =>
            (Array.isArray(value) ? value : [value]).map((option, index) => {
              const { key, ...tag } = getTagProps({ index });
              const lab = React.isValidElement(option[input.labelOption || "label"]) ? option[input.labelOption || "label"] : option?.[input.labelOption || "label"];
              return <Chip {...tag} key={option[input.valueOption || "value"]} label={lab} size="small" sx={{ lineHeight: 1, height: "auto" }} />;
            })
          }
          disableClearable
          popupIcon={<Typography component="span" sx={{ fontSize: fontSize, m: 0, p: 0, width: "100%", fontWeight: "bold", visibility: "visible !important" }} className="c-abajo-simple" />}
          readOnly={input.readonly}
          disabled={input.readonly}
          disableListWrap
          slots={{ popper: StyledPopper }}
          slotProps={{ listbox: { component: ListboxComponent } }}
          renderInput={(params) => (
            <TextField
              variant="filled"
              sx={{ ...styleFilled(input) }}
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
              {...params}
              InputProps={{ readOnly: input.readonly }}
              slotProps={{
                input: {
                  ...params.InputProps,
                  endAdornment: (
                    <Grid className="MuiAutocomplete-endAdornment css-1uhhrmm-MuiAutocomplete-endAdornment" {...params.InputProps.endAdornment.props}>
                      {params.InputProps.endAdornment.props.children}
                      {input.val && (
                        <IconButton tabIndex={-1} sx={{ m: 0, p: 0, ml: 1, pr: "1px", width: "auto", maxWidth: 20 }} size="small" onClick={clearInput}>
                          <Icon tabIndex={-1} sx={{ m: 0, p: 0, fontSize: 12, fontWeight: "bold", width: "auto" }} className={"c-x1"} />
                        </IconButton>
                      )}
                      {input.actions?.map((action, index) => {
                        const { visible = true, enabled = true } = action;
                        const isDisabled = input.readonly || !enabled;

                        return (
                          <>
                            {visible && (
                              <>
                                <Tooltip key={`action_select_${id}_${action.nombre}`} title={action.nombre}>
                                  <IconButton sx={{ m: 0, p: 0, ml: 1, pr: "1px", width: "auto", maxWidth: 20 }} size="small" onClick={isDisabled ? undefined : action.onClick}>
                                    <Icon sx={{ m: 0, p: 0, fontSize: fontSize, fontWeight: "bold", width: "auto" }} className={action.icono} />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </>
                        );
                      })}
                    </Grid>
                  ),
                },
              }}
              readOnly={input.readonly}
              error={error}
              helperText={errorMessage}
            />
          )}
        />
      </Grid>
    </Grid>
  );
};

ListboxComponent.propTypes = {
  children: PropTypes.node,
};
SelectComponent.propTypes = {
  input: inputPropTypes.isRequired,
  id: PropTypes.any,
  onInput: PropTypes.func,
};

export default SelectComponent;
