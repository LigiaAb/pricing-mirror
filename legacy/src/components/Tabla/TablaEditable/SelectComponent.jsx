import React, { forwardRef, useCallback, useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import { Popper, Autocomplete, Chip, Grid, Icon, TextField, Typography, Box, Tooltip, IconButton, autocompleteClasses } from "@mui/material";
import { useSelector } from "react-redux";
import { styled } from "@mui/material/styles";
import { VariableSizeList } from "react-window";
import { inputPropTypes, styleGenerar } from "../../Formulario";
import { style } from "./selectComponentStyles";
import { styleFilled } from "./textComponentStyles";

const LISTBOX_PADDING = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const extractText = (node) => {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  if (React.isValidElement(node)) return extractText(node.props?.children);
  return "";
};

// ─── Virtualización ───────────────────────────────────────────────────────────

const OuterElementContext = React.createContext({});

const OuterElementType = forwardRef((props, ref) => {
  const outerProps = React.useContext(OuterElementContext);
  return <div ref={ref} {...props} {...outerProps} />;
});
OuterElementType.displayName = "OuterElementType";

function useResetCache(data) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.resetAfterIndex(0, true);
  }, [data]);
  return ref;
}

const ListboxComponent = forwardRef(function ListboxComponent({ children, ...other }, ref) {
  const itemData = [];
  children.forEach((item) => {
    itemData.push(item);
    itemData.push(...(item.children || []));
  });

  const itemCount = itemData.length;
  const gridRef = useResetCache(itemCount);
  const sizeMapRef = useRef({});
  const rafRef = useRef(null);

  const [isScrolling, setIsScrolling] = useState(false);
  const scrollStopTimer = useRef(null);

  const onScroll = () => {
    setIsScrolling(true);
    if (scrollStopTimer.current) clearTimeout(scrollStopTimer.current);
    scrollStopTimer.current = setTimeout(() => setIsScrolling(false), 90);
  };

  const getItemSize = (index) => sizeMapRef.current[index] || 36;

  const setSize = (index, el) => {
    if (!el || isScrolling) return;
    const next = Math.ceil(el.scrollHeight);
    const prev = sizeMapRef.current[index];
    if (prev !== next) {
      sizeMapRef.current[index] = next;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        gridRef.current?.resetAfterIndex(index, false);
      });
    }
  };

  return (
    <div ref={ref} {...other} style={{ padding: 0 }}>
      <OuterElementContext.Provider value={other}>
        <VariableSizeList
          itemData={itemData}
          height={Math.min(itemCount * 36, 8 * 60) + 20}
          width="100%"
          ref={gridRef}
          outerElementType={OuterElementType}
          innerElementType="ul"
          itemSize={getItemSize}
          overscanCount={8}
          itemCount={itemCount}
          onScroll={onScroll}
        >
          {({ data, index, style }) => (
            <div style={{ ...style, top: style.top + LISTBOX_PADDING }}>
              <div ref={(el) => setSize(index, el)} style={{ width: "100%" }}>
                {data[index]}
              </div>
            </div>
          )}
        </VariableSizeList>
      </OuterElementContext.Provider>
    </div>
  );
});

ListboxComponent.propTypes = {
  children: PropTypes.node,
  labeloptionkey: PropTypes.string,
};

const StyledPopper = styled(Popper)({
  [`& .${autocompleteClasses.listbox}`]: {
    boxSizing: "border-box",
    "& ul": { padding: 0, margin: 0 },
  },
});

// ─── Componente principal ─────────────────────────────────────────────────────

const SelectComponent = (props) => {
  const { input, onInput, id } = props;

  const [valor, setValor] = useState(input.multiple ? [] : null);
  const [options, setOptions] = useState([]);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const { fontSize, colors } = useSelector((state) => state.theme);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (input.options) setOptions(input.options);
  }, [input.options]);

  useEffect(() => {
    if (valor !== input.val) setValor(!input.val ? (input.multiple ? [] : null) : input.val);
  }, [input, valor]);

  const verificarInputSegunTipo = useCallback(
    (val) => {
      let isValid = true;
      let message = "";
      if (input.requerido && input.intento > 0 && !val) {
        isValid = false;
        message = `El campo ${input.label} es requerido`;
      } else if (input.message) {
        message = input.message;
      }
      setError(!isValid);
      setErrorMessage(message);
    },
    [input],
  );

  useEffect(() => verificarInputSegunTipo(input.val), [input.val, verificarInputSegunTipo]);

  const onChange = (ev, val) => {
    ev.preventDefault();
    setValor(val);
    onInput?.(val);
  };

  const clearInput = (ev) => {
    ev.preventDefault();
    setValor(input.multiple ? [] : null);
    setInputValue("");
    onInput?.(input.multiple ? [] : null);
    setOptions(input.options || []); // ← garantiza que siempre se restauren
  };

  const searchFromApi = async (searchTerm) => {
    if (typeof input.fetchOptions !== "function") {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const results = await input.fetchOptions(searchTerm);
      setOptions(results || []);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const onInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (newInputValue.length === 0) {
      // ← siempre restaurar opciones base al limpiar, sin importar si hay fetchOptions
      setOptions(input.options || []);
      return;
    }

    if (newInputValue.length >= 3) {
      debounceRef.current = setTimeout(() => searchFromApi(newInputValue), 500);
    }
  };

  const labelKey = input.labelOption || "label";
  const valueKey = input.valueOption || "value";
  const renderKey = input.renderOption;

  const getVisualContent = (option) => {
    if (!option) return "";
    if (renderKey && option?.[renderKey] != null) {
      return typeof option[renderKey] === "function" ? option[renderKey](option) : option[renderKey];
    }
    return option?.[labelKey];
  };

  // ── Modo readonly: igual que código 2 ──────────────────────────────────────
  if (input.readonly) {
    return (
      <Grid container direction="row" width="100%">
        <Grid size="grow" width="100%">
          <Typography width="100%" textAlign="center">
            {valor ? valor[labelKey] : ""}
          </Typography>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container direction="row" width="100%">
      <Grid size="grow" width="100%">
        <Autocomplete
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          fullWidth
          disableCloseOnSelect={input.multiple}
          id={id}
          options={options}
          sx={{
            ...style(input),
            "& .MuiFormControl-root": { mt: "0px", width: "100%" },
            "& .MuiInputBase-root": { pr: 0 },
          }}
          isOptionEqualToValue={(op, val) => op?.[valueKey] === val?.[valueKey]}
          getOptionLabel={(option) => extractText(option?.[labelKey] ?? "")}
          getOptionKey={(option) => option[valueKey]}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            return (
              <Box
                key={key}
                component="li"
                {...optionProps}
                sx={{
                  minHeight: "unset",
                  height: "auto",
                  py: 0.25,
                  alignItems: "flex-start",
                  whiteSpace: "normal",
                  lineHeight: 1.15,
                }}
              >
                {getVisualContent(option)}
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
          noOptionsText={inputValue.length === 0 ? "Empieza a escribir para ver opciones" : "No se encontraron resultados"}
          loadingText="🔎 Buscando opciones..."
          renderTags={(value, getTagProps) =>
            (Array.isArray(value) ? value : [value]).map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              const visual = getVisualContent(option);
              return (
                <Chip
                  {...tagProps}
                  key={option?.[valueKey] ?? key}
                  label={React.isValidElement(visual) ? extractText(visual) : String(visual ?? "")}
                  size="small"
                  sx={{ lineHeight: 1, height: "auto" }}
                />
              );
            })
          }
          disableClearable
          popupIcon={
            <Typography
              color={error ? "accent.main" : input.color || "text"}
              component="span"
              sx={{ fontSize: 15, m: 0, p: 0, width: "100%", visibility: "visible !important" }}
              className={open ? "c-arriba-simple" : "c-abajo-simple"}
            />
          }
          disableListWrap
          slots={{ popper: StyledPopper }}
          slotProps={{ listbox: { component: ListboxComponent, labeloptionkey: labelKey } }}
          renderInput={(params) => (
            <TextField
              sx={{
                ...styleFilled(input),
                "& .MuiInputBase-root": { p: "0px !important", m: 0, bgcolor: "transparent" },
                ...(error && {
                  "& .MuiFormLabel-root.Mui-error": { color: "accent.main" },
                  "& .MuiInputBase-root.Mui-error:before": {
                    borderColor: `${colors?.accent?.main} !important`,
                  },
                  "& .MuiInputBase-root.Mui-error:after": {
                    borderColor: `${colors?.accent?.main} !important`,
                  },
                  "& .MuiFormHelperText-root.Mui-error": { color: "accent.main" },
                }),
              }}
              variant="filled"
              autoComplete="new-password"
              label={`${input.label || input.id || ""}${input.requerido ? " *" : ""}`}
              {...params}
              fullWidth
              slotProps={{
                htmlInput: {
                  ...params.inputProps,
                  autoComplete: "none",
                  "data-lpignore": "true",
                  "data-form-type": "other",
                  autocapitalize: "off",
                  autocorrect: "off",
                  spellcheck: "false",
                },
                input: {
                  ...params.InputProps,
                  readOnly: input.readonly,
                  endAdornment: (
                    <Grid direction="row" size="auto" container flexWrap="nowrap" sx={{ "&.*": { color: error ? "error" : input.color || "text" } }}>
                      {/* Flecha open/close */}
                      <Grid ml={0.5}>
                        <IconButton sx={{ m: 0, p: 0, ml: 0.5, pr: "1px", width: "auto", maxWidth: 20 }} size="small" onClick={() => setOpen((prev) => !prev)}>
                          <Icon color="text" sx={{ m: 0, p: 0, fontSize: 12, width: "auto" }} className={open ? "c-arriba-simple" : "c-abajo-simple"} />
                        </IconButton>
                      </Grid>

                      {/* Limpiar */}
                      {valor && !input.readonly && (
                        <Grid ml={0.5}>
                          <IconButton tabIndex={-1} sx={{ m: 0, p: 0, ml: 0.5, pr: "1px", width: "auto", maxWidth: 20 }} size="small" onClick={clearInput}>
                            <Icon sx={{ m: 0, p: 0, fontSize: 12, width: "auto" }} className="c-x1" />
                          </IconButton>
                        </Grid>
                      )}

                      {/* Error */}
                      {error && (
                        <Grid ml={0.5}>
                          <Tooltip title={errorMessage}>
                            <Typography sx={{ m: 0, p: 0, fontSize, width: "auto" }} className="c-ayuda" />
                          </Tooltip>
                        </Grid>
                      )}

                      {/* Acciones */}
                      {input.actions?.map((action) => {
                        const { visible = true, enabled = true } = action;
                        const isDisabled = input.readonly || !enabled;
                        return (
                          visible && (
                            <Tooltip key={`action_select_${id}_${action.nombre}`} title={action.nombre}>
                              <IconButton sx={{ m: 0, p: 0, ml: 0.5, pr: "1px", width: "auto", maxWidth: 20 }} size="small" onClick={isDisabled ? undefined : action.onClick}>
                                <Icon sx={{ m: 0, p: 0, fontSize: fontSize, width: "auto" }} className={action.icono} />
                              </IconButton>
                            </Tooltip>
                          )
                        );
                      })}
                    </Grid>
                  ),
                },
              }}
              error={error}
              helperText={errorMessage}
            />
          )}
        />
      </Grid>
    </Grid>
  );
};

SelectComponent.propTypes = {
  input: inputPropTypes.isRequired,
  id: PropTypes.any,
  onInput: PropTypes.func,
};

export default SelectComponent;
