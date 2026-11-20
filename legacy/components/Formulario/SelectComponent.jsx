import React, { forwardRef, useCallback, useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import { Popper, Autocomplete, Chip, Grid, Icon, TextField, Typography, Box, Tooltip, IconButton, autocompleteClasses } from "@mui/material";
import { useSelector } from "react-redux";
import { styled } from "@mui/material/styles";
import { VariableSizeList } from "react-window";
import { inputPropTypes, styleGenerar } from "./";
import InputLabelComponent from "./InputLabelComponent";

const LISTBOX_PADDING = 10;

// --- helpers (afuera para no re-crear en cada render) ---
const extractText = (node) => {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  if (React.isValidElement(node)) return extractText(node.props?.children);
  return "";
};

// contexto externo para react-window
const OuterElementContext = React.createContext({});
const OuterElementType = forwardRef((props, ref) => {
  const outerProps = React.useContext(OuterElementContext);
  return <div ref={ref} {...props} {...outerProps} />;
});
OuterElementType.displayName = "OuterElementType";

// reset cache
function useResetCache(signature, sizeMapRef) {
  const ref = useRef(null);
  useEffect(() => {
    // 🔧 el contenido cambió (nuevas opciones de búsqueda, filtrado, etc.)
    // los índices ya no representan el mismo texto -> las alturas guardadas
    // quedaron obsoletas y hay que descartarlas
    sizeMapRef.current = {};
    if (ref.current) ref.current.resetAfterIndex(0, true);
  }, [signature]);
  return ref;
}

const ListboxComponent = forwardRef(function ListboxComponent({ children, ...other }, ref) {
  const itemData = [];
  children.forEach((item) => {
    itemData.push(item);
    itemData.push(...(item.children || []));
  });

  const itemCount = itemData.length;

  // 🔧 huella del contenido actual: si cambia (aunque itemCount sea igual),
  // sabemos que las opciones no son las mismas y hay que remedir todo
  const signature = itemData.map((it) => it?.key ?? "").join("|");

  const sizeMapRef = useRef({});
  const gridRef = useResetCache(signature, sizeMapRef);

  const rafRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollStopTimer = useRef(null);

  const onScroll = () => {
    setIsScrolling(true);
    if (scrollStopTimer.current) clearTimeout(scrollStopTimer.current);
    scrollStopTimer.current = setTimeout(() => {
      setIsScrolling(false);
      gridRef.current?.resetAfterIndex(0, true);
    }, 90);
  };

  const getItemSize = (index) => sizeMapRef.current[index] || 36;

  const setSize = (index, el) => {
    if (!el) return;

    const next = Math.ceil(el.scrollHeight);
    const prev = sizeMapRef.current[index];

    if (prev !== next) {
      sizeMapRef.current[index] = next;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        // 🔧 shouldForceUpdate = true: aplica la altura correcta YA,
        // en vez de dejarla "pendiente" y mostrar el hueco en blanco
        gridRef.current?.resetAfterIndex(index, true);
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
          // ref={gridRef}
          outerElementType={OuterElementType}
          innerElementType="ul"
          itemSize={getItemSize}
          overscanCount={8}
          itemCount={itemCount}
          // onScroll={onScroll}
        >
          {({ data, index, style }) => {
            const child = data[index];

            return React.cloneElement(child, {
              style: {
                ...child.props.style,
                ...style,
                top: style.top + LISTBOX_PADDING,
              },
              ref: (el) => setSize(index, el),
            });
          }}
        </VariableSizeList>
      </OuterElementContext.Provider>
    </div>
  );
});

ListboxComponent.propTypes = {
  children: PropTypes.node,
  labeloptionkey: PropTypes.string,
};

// popper
const StyledPopper = styled(Popper)({
  [`& .${autocompleteClasses.listbox}`]: {
    boxSizing: "border-box",
    "& ul": { padding: 0, margin: 0 },
  },
});

const SelectComponent = (props) => {
  const { input, onInput, id } = props;

  const [valor, setValor] = useState(input.multiple ? [] : null);
  const { fontSize } = useSelector((state) => state.theme);
  const [options, setOptions] = useState([]);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef(null);

  useEffect(() => {
    // if (input.options && input.options.length > 0) setOptions(input.options);
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
        message = "El campo es requerido";
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
    if (input.options) setOptions(input.options);
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
    } catch (e) {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const onInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (newInputValue.length >= 3) {
      debounceRef.current = setTimeout(() => searchFromApi(newInputValue), 500);
    } else if (newInputValue.length === 0 && input.options) {
      setOptions(input.options);
    }
  };

  const labelKey = input.labelOption || "label";
  const valueKey = input.valueOption || "value";
  const renderKey = input.renderOption; // puede ser undefined

  // ✅ contenido visual (renderOption si viene, si no labelOption)
  const getVisualContent = (option) => {
    if (!option) return "";
    if (renderKey && option?.[renderKey] != null) {
      return typeof option[renderKey] === "function" ? option[renderKey](option) : option[renderKey];
    }
    return option?.[labelKey];
  };

  return (
    <Autocomplete
      disableCloseOnSelect={input.multiple}
      id={id}
      options={options}
      sx={{ ...styleGenerar(input), mt: 0 }}
      isOptionEqualToValue={(op, val) => op?.[valueKey] === val?.[valueKey]}
      // ✅ búsqueda SIEMPRE por labelOption (string)
      getOptionLabel={(option) => extractText(option?.[labelKey] ?? "")}
      // ✅ render SIEMPRE por renderOption si existe, si no labelOption
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return (
          <Box
            key={key}
            component="li"
            {...optionProps}
            sx={{
              minHeight: "unset", // 👈 clave
              height: "auto",
              py: 0.25, // 👈 menos padding
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
      onKeyDown={(ev) => {
        // IMPORTANTE:
        // Dejamos que MUI Autocomplete maneje estas teclas.
        // Si input.teclaPresionada hace preventDefault(), bloquea la navegación.
        if (["ArrowDown", "ArrowUp", "Enter", "Escape", "Home", "End"].includes(ev.key)) {
          return;
        }

        input.teclaPresionada?.(ev);
      }}
      name={input.id}
      multiple={input.multiple}
      value={valor}
      loading={loading}
      noOptionsText={inputValue.length === 0 ? "Empieza a escribir para ver opciones" : "No se encontraron resultados"}
      loadingText="🔎 Buscando opciones..."
      // ✅ lo que se ve dentro del input (single/multi) sigue la misma regla visual
      renderValue={(value, getTagProps) => {
        if (inputValue) return null;
        return (Array.isArray(value) ? value : [value]).map((option, index) => {
          const { key, ...tag } = getTagProps({ index });
          const visual = getVisualContent(option);

          return input.multiple ? (
            <Chip {...tag} key={option?.[valueKey] ?? key} label={React.isValidElement(visual) ? extractText(visual) : String(visual ?? "")} size="small" sx={{ lineHeight: 1, height: "auto" }} />
          ) : (
            <Box
              sx={{
                pointerEvents: "none",
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              pl={0.5}
              maxWidth="90%"
            >
              {visual}
            </Box>
          );
        });
      }}
      disableClearable
      popupIcon={<Typography component="span" sx={{ fontSize: fontSize, m: 0, p: 0, width: "100%", fontWeight: "bold", visibility: "visible !important" }} className="c-abajo-simple" />}
      readOnly={input.readonly}
      disabled={input.readonly}
      disableListWrap
      slots={{ popper: StyledPopper }}
      // ✅ PASAMOS labelOption al Listbox para el fallback del cálculo de altura
      // slotProps={{ listbox: { component: ListboxComponent, labeloptionkey: labelKey } }}
      renderInput={(params) => (
        <TextField
          sx={{ ...styleGenerar(input) }}
          label={<InputLabelComponent input={input} error={error} />}
          {...params}
          size="small"
          InputProps={{ readOnly: input.readonly }}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <Grid className="MuiAutocomplete-endAdornment css-1uhhrmm-MuiAutocomplete-endAdornment" {...params.InputProps.endAdornment.props} sx={{ whiteSpace: "nowrap", mr: 1 }} size="auto">
                  {input.actions?.map((action) => {
                    const { visible = true, enabled } = action;
                    const isDisabled = enabled ? !enabled : input.readonly || !enabled;
                    return (
                      visible && (
                        <Tooltip key={`action_text_${id}_${action.nombre}`} title={action.nombre}>
                          <IconButton sx={{ m: 0, p: 0, textAlign: "center" }} size="small" onClick={action.onClick} disabled={input.readonly || isDisabled}>
                            <Icon color="text.900_20" sx={{ m: 0, p: 0, fontSize: 12, fontWeight: "bold" }} className={action.icono} />
                          </IconButton>
                        </Tooltip>
                      )
                    );
                  })}
                  {params?.InputProps?.endAdornment?.props?.children}
                  {input.val && !input.readonly && (
                    <IconButton tabIndex={-1} sx={{ m: 0, p: 0, ml: 1, pr: "1px", width: "auto", maxWidth: 20 }} size="small" onClick={clearInput}>
                      <Icon tabIndex={-1} sx={{ m: 0, p: 0, fontSize: 12, fontWeight: "bold", width: "auto" }} className="c-x1" />
                    </IconButton>
                  )}
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
  );
};

SelectComponent.propTypes = {
  input: inputPropTypes.isRequired,
  id: PropTypes.any,
  onInput: PropTypes.func,
};

export default SelectComponent;
