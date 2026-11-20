import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Grid, Icon, IconButton, MenuItem, TextField, Tooltip, Typography, Input, Box } from "@mui/material";
import { useForm } from "../../hooks/useForm";
import { menuItemStyles, menuPaperPropsStyles } from "../MenuComponent/menuStyles";
import { inputPropTypes, styleGenerar } from "./";
import { styleFilled /* placeholder, style, styleStandard */ } from "./textComponentStyles";
import { useSelector } from "react-redux";
import InputLabelComponent from "./InputLabelComponent";
import generatePlaceholderFromRegex from "../../utils/generateBaseFromRegex";
import TextMaskCustom from "./TextMaskCustom";

function normalizeRegexInput(input) {
  let s = input instanceof RegExp ? input.source : input.trim();

  // Quitar delimitadores /.../
  if (s.startsWith("/")) s = s.slice(1);
  if (s.endsWith("/")) s = s.slice(0, -1);

  // Quitar ^ y $
  s = s.replace(/^\^/, "");
  s = s.replace(/\$$/, "");

  // 🔥 Quitar escapes de paréntesis
  s = s.replace(/\\\(/g, "(");
  s = s.replace(/\\\)/g, ")");

  return s;
}

function regexToMask(input) {
  const str = normalizeRegexInput(input);
  const mask = [];

  let i = 0;
  while (i < str.length) {
    const rest = str.slice(i);

    // ---------------------------------------------------
    // 1) ( ) lógicos: SOLO literales ya que desescapamos antes
    // ---------------------------------------------------
    if (rest[0] === "(" || rest[0] === ")") {
      mask.push(rest[0]);
      i++;
      continue;
    }

    // ---------------------------------------------------
    // 2) espacio literal
    // ---------------------------------------------------
    if (rest[0] === " ") {
      mask.push(" ");
      i++;
      continue;
    }

    // ---------------------------------------------------
    // 3) \d{n}
    // ---------------------------------------------------
    const dCount = rest.match(/^\\d\{(\d+)\}/);
    if (dCount) {
      const count = parseInt(dCount[1], 10);
      for (let k = 0; k < count; k++) mask.push(/[0-9]/);
      i += dCount[0].length;
      continue;
    }

    // ---------------------------------------------------
    // \w{n} → alfanumérico
    // ---------------------------------------------------
    const wCount = rest.match(/^\\w\{(\d+)\}/);
    if (wCount) {
      const count = parseInt(wCount[1], 10);
      for (let k = 0; k < count; k++) mask.push(/[a-zA-Z0-9_]/);
      i += wCount[0].length;
      continue;
    }

    // ---------------------------------------------------
    // \w simple → alfanumérico
    // ---------------------------------------------------
    if (/^\\w/.test(rest)) {
      mask.push(/[a-zA-Z0-9_]/);
      i += 2;
      continue;
    }

    // ---------------------------------------------------
    // 4) [0-9]{n}
    // ---------------------------------------------------
    const classCount = rest.match(/^\[([^\]]+)\]\{(\d+)\}/);
    if (classCount) {
      const regex = new RegExp("[" + classCount[1] + "]");
      const count = parseInt(classCount[2], 10);
      for (let k = 0; k < count; k++) mask.push(regex);
      i += classCount[0].length;
      continue;
    }

    // ---------------------------------------------------
    // 5) [0-9] simple
    // ---------------------------------------------------
    const classSingle = rest.match(/^\[([^\]]+)\]/);
    if (classSingle) {
      const regex = new RegExp("[" + classSingle[1] + "]");
      mask.push(regex);
      i += classSingle[0].length;
      continue;
    }

    // ---------------------------------------------------
    // 6) \d simple
    // ---------------------------------------------------
    if (/^\\d/.test(rest)) {
      mask.push(/[0-9]/);
      i += 2;
      continue;
    }

    // ---------------------------------------------------
    // 7) literales simples: -, ., /
    // ---------------------------------------------------
    if (/^[\-\./]/.test(rest[0])) {
      mask.push(rest[0]);
      i++;
      continue;
    }

    // ---------------------------------------------------
    // 8) ignorar {n} sueltos
    // ---------------------------------------------------
    if (/^\{\d+\}/.test(rest)) {
      i += rest.match(/^\{\d+\}/)[0].length;
      continue;
    }

    // fallback
    mask.push(rest[0]);
    i++;
  }

  console.log(mask);
  return mask;
}

const TextComponent = (props) => {
  const { input, onInput, id, sx } = props;
  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);
  // const input = useMemo(() => input, [input]);

  const { formState, onInputChange, onInputChangeExternal, onResetForm } = useForm({
    [input.id]: input.val,
  });

  useEffect(() => {
    onInputChangeExternal(input.id, input.val);
  }, [input]);

  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [mostrar, setMostrar] = useState(false);
  // const [input, setInput] = useState(input);

  const mask = useMemo(() => (input.formato ? (!input.mask ? undefined : Array.isArray(input.mask) ? input.mask : regexToMask(input.formato)) : undefined), [input]);

  const obtenerHelperDeInputSegunTipo = (input) => {
    const propiedades = {
      color: "text.main_5",
      sx: {
        m: 0,
        p: 0,
        color: "text.main_50",
        fontSize: 12,
        fontWeight: "bold",
        width: "auto",
        ".Mui-readOnly &.MuiTypography-span": { color: "text.200_5", WebkitTextFillColor: "rgba(0, 0, 0, 0.2)" },
      },
      variant: "span",
      fontWeight: "bold",
    };

    if (input.readonly) return "";

    if (input.formato) return <Typography {...propiedades}>{generatePlaceholderFromRegex(input.formato)}</Typography>;
    switch (input.tipo) {
      case "number":
      case "quetzales":
      case "dolares":
        return <Typography {...propiedades}>123</Typography>;
      case "textarea":
      case "text":
        return <Typography {...propiedades}>Abc</Typography>;
      case "icono":
        return <Typography {...propiedades}>c-abc123</Typography>;
      case "email":
        return <Typography {...propiedades}>a@b.c</Typography>;
      case "password":
        return <Typography {...propiedades}>{mostrar ? "Abc123" : "✱✱✱"}</Typography>;
      case "date":
        return <Typography {...propiedades}>00/00/0000</Typography>;
      default:
        return "";
    }
  };

  const verificarInputSegunTipo = useCallback(
    (val) => {
      let isValid = true;
      let message = "";

      if (input.requerido && input.intento > 0 && (val === "" || !val)) {
        isValid = false;
        message = `El campo ${input.label} es requerido`;
      } else if (input.tipo === "icono" || input.formato) {
        const regex = input.tipo === "icono" ? /^c-.*$/ : input.formato;
        if (!regex.test(val) && val !== "") {
          isValid = false;
          message = input.errorMessage || `El texto ingreado no coincide con el formato ${generatePlaceholderFromRegex(input.formato || regex)}.`;
        }
      } else if (input.message) {
        message = input.message;
      } else if (input.error) {
        isValid = false;

        message = input.errorMessage || `Hay un error en el campo ${input.label}.`;
      } else {
        switch (input.tipo) {
          case "number":
            if (isNaN(val)) {
              isValid = false;
              message = "Debe ser un número.";
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
    [input],
  );

  const onChange = (ev) => {
    const { value } = ev.target;
    // verificarInputSegunTipo(value);
    ev.preventDefault();
    onInputChange(ev);
    onInput(value);
  };

  const clearInput = (ev) => {
    ev.preventDefault();
    onInputChange({ target: { name: input.id, value: "" } });
    onInput("");
    // verificarInputSegunTipo("");
  };

  // const placeholder = (input) => `${input?.placeholder || input?.label || ""}${input?.requerido ? " *" : ""}`.toUpperCase();

  useEffect(() => verificarInputSegunTipo(input.val), [input, verificarInputSegunTipo]);

  useEffect(() => {
    formState[input.id] = input.val;
  }, [input, formState]);

  useEffect(() => {
    if (input.error) {
      setError(true);
      setErrorMessage(input.errorMessage || "Error");
    }
  }, [input]);

  const generarStarAdorment = (input) => {
    if (["icono", "quetzales", "dolares"].includes(input.tipo))
      return input.tipo === "icono" ? (
        <Grid size="auto" ml={0.5}>
          <Typography color="primary.main_70" fontWeight="bolder" sx={{ m: 0, p: 0, fontSize: 12 }} className={input.val} />
        </Grid>
      ) : input.tipo === "quetzales" ? (
        <Grid size="auto" ml={0.5}>
          <Typography variant="span" color="text.900_50">
            Q.
          </Typography>
        </Grid>
      ) : input.tipo === "dolares" ? (
        <Grid size="auto" ml={0.5}>
          <Typography variant="span" color="text.900_50">
            $.
          </Typography>
        </Grid>
      ) : undefined;
    if (input.prefijo)
      return (
        <Grid size="auto" ml={0.5}>
          <Typography variant="span" color="text.900_50">
            {input.prefijo}
          </Typography>
        </Grid>
      );

    if (input.moneda)
      return (
        <Grid size="auto" ml={0.5}>
          <Typography variant="span" color="text.900_50">
            {input.moneda}
          </Typography>
        </Grid>
      );

    return undefined;
  };

  const obtenerColorDeFondo = (input, transparencia = 20, defaultcolor = "white") => {
    if (input.readonly) return undefined;
    if (input.color) {
      if (input.color.includes("_")) {
        return `${input.color.split("_")[0]}_${transparencia}`;
      } else return `${input.color}_${transparencia}`;
    }
    return `${defaultcolor}.main_${transparencia}`;
  };

  const obtenerColorDeTexto = (input, transparencia = 20, defaultcolor = "white") => {
    const nombreColor = input.color?.split(".")[1] || defaultcolor;
    if (input.readonly) return undefined;
    if (input.color) {
      if (input.color.includes("_")) {
        return `${nombreColor}.main_${transparencia}`;
      } else return `${nombreColor}.main_${transparencia}`;
    }
    return `${defaultcolor}.main_${transparencia}`;
  };

  return (
    <>
      {/* <pre>{JSON.stringify(mask?.map((i) => `${i}`))}</pre> */}
      <TextField
        fullWidth
        size="small"
        // color
        color={input?.color?.split(".")[0] || "text.main"}
        label={<InputLabelComponent input={input} error={error} />}
        sx={{ ...styleGenerar(input) }}
        type={input.tipo === "password" ? (mostrar ? "text" : "password") : input.tipo === "archivo" ? undefined : ["quetzales", "dolars"].includes(input.tipo) ? "number" : input.tipo}
        onChange={onChange}
        placeholder={input.placeholder}
        inputProps={{ min: "0" }}
        disabled={input.readonly}
        name={input.id}
        value={formState[input.id]}
        error={error}
        autoComplete="newPassword"
        helperText={errorMessage}
        multiline={input.tipo === "textarea" || input.tipo === "texteditor"}
        maxRows={input.tipo === "textarea" ? input.rows || 5 : undefined}
        minRows={input.tipo === "textarea" ? input.rows || 5 : undefined}
        onKeyDown={input.teclaPresionada}
        aria-readonly={input.readonly}
        slotProps={{
          htmlInput: {
            step: input.step,
            maxLength: input.max,
            max: input.max,
            min: input.min || 0,
            style: { resize: "vertical" },
            wrap: input.tipo === "textarea" ? "hard" : undefined,
          },
          sx: sx?.input,
          inputLabel: { shrink: mask || input.val ? true : undefined },
          input: {
            ...(mask
              ? {
                  inputComponent: TextMaskCustom,
                  inputProps: {
                    id: `${id}_mask`,
                    mask: mask, // ← recibe tu regex convertido a máscara
                    valor_ingresado: input.val,
                    input,
                  },
                }
              : {}),
            readOnly: input.readonly,
            startAdornment: generarStarAdorment(input),
            endAdornment: (
              <Grid container wrap="nowrap" direction="row" height="100%" position="end" alignItems="center" justifyContent="flex-end" columnSpacing={0.3} mr={1} className="endAdornment">
                {input.sufijo && (
                  <Grid size="auto" sx={{ m: 0, p: 0, width: "auto", fontWeight: "bold" }}>
                    <IconButton color="text.500_20" sx={{ m: 0, p: 0, width: "auto", fontWeight: "bold" }} size="small" component="label">
                      {input.sufijo}
                    </IconButton>
                  </Grid>
                )}
                {(input.helper === undefined || input.helper) && (
                  <Grid size="auto" sx={{ m: 0, p: 0, height: "100%", opacity: 1 }}>
                    {obtenerHelperDeInputSegunTipo(input)}
                  </Grid>
                )}
                {input.tipo === "password" && (
                  <Grid size="auto">
                    <IconButton sx={{ m: 0, p: 0, width: "auto" }} size="small" onClick={() => setMostrar((v) => !v)}>
                      <Icon color="text.500_20" sx={{ m: 0, p: 0, fontSize: fontSize + 5, width: "auto" }} className={`${mostrar ? "c-ver" : "c-no-ver"}`} />
                    </IconButton>
                  </Grid>
                )}
                {input.tipo === "archivo" && (
                  <Grid size="auto">
                    <IconButton sx={{ m: 0, p: 0, width: "auto" }} size="small" component="label">
                      <Icon color="text.900_20" sx={{ m: 0, p: 0, fontSize: 12, fontWeight: "bold", width: "auto" }} className="c-subir" />
                      <input
                        hidden
                        type="file"
                        // onChange={(e) => scriptUpload(e)}
                      />
                    </IconButton>
                  </Grid>
                )}
                {[...(input.actions || []), ...(input.acciones || [])]?.map((action, index) => {
                  const { visible = true, enabled } = action;
                  const isDisabled = enabled ? !enabled : input.readonly || !enabled;
                  return (
                    visible && (
                      <Grid size="auto" key={`action_text_${id}_${action.nombre}`}>
                        <Tooltip title={action.nombre}>
                          <IconButton sx={{ m: 0, p: 0, textAlign: "center" }} size="small" onClick={action.onClick} disabled={!isDisabled}>
                            <Icon color="text.900_20" sx={{ m: 0, p: 0, fontSize: 12, fontWeight: "bold" }} className={action.icono} />
                          </IconButton>
                        </Tooltip>
                      </Grid>
                    )
                  );
                })}
                {!input.readonly && (!!formState[input.id] || formState[input.id] !== "") && (
                  <Grid size="auto">
                    <IconButton tabIndex={-1} sx={{ m: 0, p: 0 }} size="small" onClick={clearInput}>
                      <Icon color="text.900_20" sx={{ m: 0, p: 0, fontSize: 12, fontWeight: "bold", width: "auto" }} className="c-x1" />
                    </IconButton>
                  </Grid>
                )}
              </Grid>
            ),
          },
        }}
      />
      {/* {mask} */}
      {/* <pre>{JSON.stringify(input, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(formState, null, 2)}</pre> */}
    </>
  );
};

TextComponent.propTypes = {
  input: inputPropTypes.isRequired,
  onInput: PropTypes.func,
  id: PropTypes.string,

  sx: PropTypes.object,
};

export default TextComponent;
