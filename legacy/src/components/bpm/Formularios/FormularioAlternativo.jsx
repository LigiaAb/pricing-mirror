import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Autocomplete, Box, Button, Icon, IconButton, InputAdornment, TextField, Tooltip, Typography, FormControl, FormGroup, FormControlLabel, FormLabel, Checkbox, alpha } from "@mui/material";

// Encabezado reutilizable para el variant="modern": icono en chip + título +
// subtítulo opcional. Sustituye al header centrado por defecto de
// FormularioAlternativo (que se oculta con `hideHeader` en estos casos).
export const ModernFormHeader = ({ icon = "c-informacion", title, subtitle }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
    <Box
      sx={(theme) => ({
        width: 44,
        height: 44,
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.24 : 0.12),
      })}
    >
      <Icon className={icon} sx={{ fontSize: 22, color: "primary.main" }} />
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
);

ModernFormHeader.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
};

// sx aplicado a inputs/selects cuando `variant="modern"` (ver EntidadPublicForm):
// bordes redondeados y un leve realce de fondo en hover/focus, sin tocar el
// resto de formularios que usan este mismo componente con el variant classic.
const modernInputSx = (theme) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    backgroundColor: theme.palette.mode === "dark" ? alpha(theme.palette.common.white, 0.03) : alpha(theme.palette.primary.main, 0.02),
    transition: "background-color .15s ease, box-shadow .15s ease",
  },
  "& .MuiOutlinedInput-root:hover:not(.Mui-disabled)": {
    backgroundColor: theme.palette.mode === "dark" ? alpha(theme.palette.common.white, 0.05) : alpha(theme.palette.primary.main, 0.045),
  },
  "& .MuiOutlinedInput-root.Mui-focused": {
    backgroundColor: theme.palette.mode === "dark" ? alpha(theme.palette.common.white, 0.05) : theme.palette.background.paper,
    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
  },
});

// `field.colSpan` normalmente es un string ("span 4") aplicado desde el
// breakpoint `sm` en adelante (xs siempre es "span 12", full width). Cuando
// un campo necesita un punto de quiebre propio (p.ej. 3 columnas que en
// tablet quedan demasiado angostas para un email), `colSpan` puede pasarse
// como objeto de breakpoints (`{ sm: "span 12", md: "span 4" }`) y se fusiona
// sobre el default `xs: "span 12"`.
const resolveGridColumn = (colSpan) => {
  if (colSpan && typeof colSpan === "object") {
    return { xs: "span 12", ...colSpan };
  }
  return { xs: "span 12", sm: colSpan ?? "span 12" };
};

const isFieldValueEmpty = (val) => {
  if (val === undefined || val === null) return true;
  if (typeof val === "string") return val.trim() === "";
  if (Array.isArray(val)) return val.length === 0;
  return false;
};

const normalizeMultipleFieldValue = (field, rawVal) => {
  const values = Array.isArray(rawVal) ? rawVal : [];
  return values.map((item) => {
    if (item && typeof item === "object") {
      return String(item.value ?? item.label ?? "");
    }
    return String(item);
  });
};

const normalizeSingleFieldValue = (rawVal) => {
  if (rawVal && typeof rawVal === "object") {
    return String(rawVal.value ?? rawVal.label ?? "");
  }
  return rawVal !== undefined && rawVal !== null ? String(rawVal) : "";
};

const normalizeFieldValue = (field, rawVal) => {
  const isMultipleField = field.multiple || field.type === "checkboxes" || field.type === "checkbox";
  return isMultipleField ? normalizeMultipleFieldValue(field, rawVal) : normalizeSingleFieldValue(rawVal);
};

const buildActionAdornment = (field) => {
  const actions = Array.isArray(field.actions) ? field.actions : [];
  if (!actions.length) return null;

  return (
    <InputAdornment position="end" sx={{ mr: 1 }}>
      {actions.map((action, idx) => {
        const { visible = true, enabled = true, nombre, icono, onClick } = action;
        if (!visible) return null;
        return (
          <Tooltip key={nombre} title={nombre}>
            <span>
              <IconButton size="small" onClick={onClick} disabled={!enabled} sx={{ m: 0, p: 0, ml: idx === 0 ? 0 : 1 }}>
                <Icon sx={{ fontSize: 14, fontWeight: "bold" }} className={icono} />
              </IconButton>
            </span>
          </Tooltip>
        );
      })}
    </InputAdornment>
  );
};

const getTextSlotProps = (field, hasActions, actionAdornment) => {
  const props = {};
  if (hasActions) props.input = { endAdornment: actionAdornment };
  if (field.readOnly) props.htmlInput = { readOnly: true };
  return props;
};

const getReadOnlyClickHandler = (field, hasActions) => {
  if (!field.readOnly || !hasActions) return undefined;

  return () => {
    const act = (field.actions || []).find((a) => a.visible !== false && a.enabled !== false);
    act?.onClick?.();
  };
};

const renderSelectField = (field, val, isDisabled, actionAdornment, onInput, identificacionOptions, variant) => {
  const options = field.options ?? identificacionOptions;
  const isMultiple = !!field.multiple;
  const selectedValue = isMultiple
    ? options.filter((opt) => val.includes(String(opt.value)))
    : (options.find((opt) => String(opt.value) === val) ?? null);
  const missingRequired = Boolean(field.required) && !field.readOnly && isFieldValueEmpty(val);

  return (
    <Autocomplete
      key={field.key}
      multiple={isMultiple}
      options={options}
      getOptionKey={(opt) => opt.value}
      getOptionLabel={(opt) => opt.label ?? ""}
      isOptionEqualToValue={(opt, v) => String(opt.value) === String(v.value)}
      value={selectedValue}
      onChange={field.readOnly ? undefined : (_, newVal) => {
        if (isMultiple) {
          onInput(field.key, newVal.map((o) => String(o.value)));
        } else {
          onInput(field.key, newVal ? String(newVal.value) : "");
        }
      }}
      disabled={isDisabled}
      readOnly={field.readOnly}
      size="small"
      fullWidth
      renderOption={field.renderOption}
      onOpen={field.onOpen}
      renderInput={(params) => {
        const { InputProps, ...paramsWithoutInputProps } = params;
        const mergedSlotProps = {
          ...paramsWithoutInputProps.slotProps,
          input: {
            ...InputProps,
            ...paramsWithoutInputProps.slotProps?.input,
            endAdornment: (
              <>
                {InputProps?.endAdornment}
                {actionAdornment}
              </>
            ),
          },
        };

        return (
          <TextField
            {...paramsWithoutInputProps}
            label={field.label}
            size="small"
            required={field.required}
            error={missingRequired}
            helperText={missingRequired ? "Campo obligatorio" : undefined}
            slotProps={mergedSlotProps}
          />
        );
      }}
      sx={(theme) => ({
        gridColumn: resolveGridColumn(field.colSpan),
        minWidth: 0,
        "& .MuiInputBase-input.Mui-disabled": {
          WebkitTextFillColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.7)" : theme.palette.text.primary,
          color: theme.palette.mode === "dark" ? "rgba(255,255,255,0.7)" : theme.palette.text.primary,
        },
        "& .MuiInputBase-root.Mui-disabled": {
          opacity: 1,
        },
        ...(missingRequired ? {
          "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.error.main,
          },
          "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.error.main,
          },
        } : {}),
        ...(variant === "modern" ? modernInputSx(theme) : {}),
      })}
    />
  );
};

const renderCheckboxField = (field, val, isDisabled, onInput, variant) => {
  const options = field.options ?? [];
  const itemsPerRow = field.itemsPerRow || options.length;
  const isModern = variant === "modern";
  const missingRequired = Boolean(field.required) && !field.readOnly && isFieldValueEmpty(val);

  return (
    <FormControl
      key={field.key}
      component="fieldset"
      sx={(theme) => ({
        gridColumn: resolveGridColumn(field.colSpan),
        minWidth: 0,
        border: "1px solid",
        borderColor: missingRequired ? theme.palette.error.main : (isModern ? alpha(theme.palette.primary.main, 0.18) : "divider"),
        borderRadius: 2,
        p: 2,
        pt: 1,
        ...(isModern ? { bgcolor: theme.palette.mode === "dark" ? alpha(theme.palette.common.white, 0.02) : alpha(theme.palette.primary.main, 0.02) } : {}),
      })}
      disabled={isDisabled}
      required={field.required}
      error={missingRequired}
    >
      <FormLabel component="legend" sx={{ display: "flex", alignItems: "center", gap: 0.75, fontWeight: 600, fontSize: "0.875rem", mb: 1, color: missingRequired ? "error.main" : "text.primary" }}>
        {isModern && <Icon className={field.icon || "c-lista-checkbox"} sx={{ fontSize: 15, color: missingRequired ? "error.main" : "primary.main" }} />}
        {field.label}
      </FormLabel>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(1, 1fr)", sm: `repeat(${Math.min(itemsPerRow, 3)}, 1fr)` },
          gap: 1,
        }}
      >
        {options.map((opt) => (
          <Tooltip key={opt.value} title={opt.label} placement="top" arrow>
            <FormControlLabel
              control={
                <Checkbox
                  checked={Array.isArray(val) && val.includes(String(opt.value))}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    let next = Array.isArray(val) ? [...val] : [];
                    if (checked) {
                      next.push(String(opt.value));
                    } else {
                      next = next.filter((v) => v !== String(opt.value));
                    }
                    onInput(field.key, next);
                  }}
                  disabled={field.readOnly}
                />
              }
              label={opt.label}
              sx={{ m: 0, "& .MuiFormControlLabel-label": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }}
            />
          </Tooltip>
        ))}
      </Box>
      {missingRequired && (
        <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.75 }}>
          Campo obligatorio
        </Typography>
      )}
    </FormControl>
  );
};

const buildNativeDateInputSx = (sx) => {
  const dateOverrides = {
    "& input": {
      whiteSpace: "nowrap",
      color: "transparent",
    },
    "& input:focus": {
      color: "inherit",
    },
    "& input.filled": {
      color: "inherit",
    },
    "& input::-webkit-datetime-edit": {
      display: "inline-flex",
      alignItems: "center",
      padding: 0,
      whiteSpace: "nowrap",
    },
    "& input::-webkit-datetime-edit-fields-wrapper": {
      display: "flex",
      alignItems: "center",
      whiteSpace: "nowrap",
    },
    "& input::-webkit-date-and-time-value": {
      minHeight: "1.4375em",
      textAlign: "left",
    },
  };
  // `sx` puede ser un objeto simple o un array de sx (objetos/funciones de tema) —
  // normalizamos a array para no perder ninguna de las dos formas al concatenar.
  return [...(Array.isArray(sx) ? sx : [sx]), dateOverrides];
};

const renderDateField = (fieldKey, fieldProps, value) => {
  const hasValue = Boolean(value && String(value).trim());
  const slotProps = {
    ...fieldProps.slotProps,
    label: {
      ...(fieldProps.slotProps?.label || {}),
      shrink: true,
    },
    htmlInput: {
      ...(fieldProps.slotProps?.htmlInput || {}),
      className: hasValue ? "filled" : undefined,
    },
  };

  return (
    <TextField
      key={fieldKey}
      {...fieldProps}
      type="date"
      slotProps={slotProps}
      sx={buildNativeDateInputSx(fieldProps.sx)}
    />
  );
};

const renderDatetimeField = (fieldKey, fieldProps, value) => {
  const normalizedDatetime = String(value || "").trim();
  let datetimeValue = normalizedDatetime;
  if (datetimeValue && !datetimeValue.includes("T") && /^\d{4}-\d{2}-\d{2}$/.test(datetimeValue)) {
    datetimeValue = `${datetimeValue}T00:00`;
  }

  const hasValue = Boolean(datetimeValue);
  const slotProps = {
    ...fieldProps.slotProps,
    label: {
      ...(fieldProps.slotProps?.label || {}),
      shrink: true,
    },
    htmlInput: {
      ...(fieldProps.slotProps?.htmlInput || {}),
      className: hasValue ? "filled" : undefined,
    },
  };

  return (
    <TextField
      key={fieldKey}
      {...fieldProps}
      type="datetime-local"
      value={datetimeValue}
      slotProps={slotProps}
      sx={buildNativeDateInputSx(fieldProps.sx)}
    />
  );
};

const renderTextareaField = (fieldKey, fieldProps, rows) => (
  <TextField
    key={fieldKey}
    {...fieldProps}
    multiline
    rows={rows}
  />
);

const renderDefaultTextField = (fieldKey, fieldProps, type, handleFieldClick) => (
  <TextField
    key={fieldKey}
    {...fieldProps}
    type={type && type !== "text" ? type : "text"}
    onClick={handleFieldClick}
  />
);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const renderTextField = ({ field, val, isDisabled, hasActions, textSlotProps, onInput, handleFieldClick, variant }) => {
  const slotProps = Object.keys(textSlotProps || {}).length ? textSlotProps : undefined;

  let error = false;
  let helperText = "";
  const missingRequired = Boolean(field.required) && !field.readOnly && isFieldValueEmpty(val);

  if (field.type === "email" && val && val.trim() !== "") {
    if (!EMAIL_REGEX.test(val)) {
      error = true;
      helperText = "El formato del correo no es correcto.";
    }
  }

  if (!error && missingRequired) {
    error = true;
    helperText = "Campo obligatorio";
  }

  const coreSx = {
    gridColumn: resolveGridColumn(field.colSpan),
    minWidth: 0,
    cursor: field.readOnly && hasActions ? "pointer" : undefined,
    "& .MuiInputBase-input.Mui-disabled": {
      WebkitTextFillColor: (theme) => theme.palette.mode === "dark" ? "rgba(255,255,255,0.7)" : theme.palette.text.primary,
      color: (theme) => theme.palette.mode === "dark" ? "rgba(255,255,255,0.7)" : theme.palette.text.primary,
    },
    "& .MuiInputBase-root.Mui-disabled": {
      opacity: 1,
    },
  };

  const fieldProps = {
    label: field.label,
    size: "small",
    value: val,
    onChange: field.readOnly ? undefined : (e) => onInput(field.key, e.target.value),
    fullWidth: true,
    required: field.required,
    disabled: isDisabled,
    slotProps,
    error,
    helperText,
    // array sx: MUI acepta mezclar objetos y funciones de tema, e ignora entradas
    // falsy — así el variant "modern" no pisa los estilos base para los demás
    // formularios que siguen usando el variant "classic" por defecto.
    sx: [coreSx, variant === "modern" && modernInputSx],
  };

  if (field.type === "date") {
    return renderDateField(field.key, fieldProps, val);
  }

  if (field.type === "datetime") {
    return renderDatetimeField(field.key, fieldProps, val);
  }

  if (field.type === "textarea") {
    return renderTextareaField(field.key, fieldProps, field.rows ?? 3);
  }

  return renderDefaultTextField(field.key, fieldProps, field.type, handleFieldClick);
};

const renderFields = (fields, valores, identificacionOptions, onInput, variant) =>
  fields.map((field) => {
    const rawVal = valores[field.key];
    const val = normalizeFieldValue(field, rawVal);
    const hasActions = Array.isArray(field.actions) && field.actions.length > 0;
    const actionAdornment = buildActionAdornment(field);
    const isDisabled = field.readOnly && !hasActions;
    const textSlotProps = getTextSlotProps(field, hasActions, actionAdornment);
    const handleFieldClick = getReadOnlyClickHandler(field, hasActions);

    if (field.type === "section") {
      const sectionActions = Array.isArray(field.actions) ? field.actions : [];

      if (variant === "modern") {
        return (
          <Box
            key={field.key}
            sx={{
              gridColumn: "span 12",
              mt: field.mt ?? 3.5,
              mb: 0.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
              <Box
                sx={(theme) => ({
                  width: 30,
                  height: 30,
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.22 : 0.1),
                })}
              >
                <Icon className={field.icon || "c-informacion"} sx={{ fontSize: 16, color: "primary.main" }} />
              </Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                  color: (theme) => (theme.palette.mode === "dark" ? "primary.light" : "primary.main"),
                  lineHeight: 1,
                }}
              >
                {field.label}
              </Typography>
            </Box>
            {sectionActions.length > 0 && (
              <Box sx={{ display: "flex", gap: 0.5 }}>
                {sectionActions.map((action) => {
                  const { visible = true, enabled = true, nombre, icono, onClick } = action;
                  if (!visible) return null;
                  return (
                    <Tooltip key={nombre} title={nombre}>
                      <span>
                        <IconButton size="small" onClick={onClick} disabled={!enabled}>
                          <Icon sx={{ fontSize: 16 }} className={icono} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  );
                })}
              </Box>
            )}
          </Box>
        );
      }

      return (
        <Box
          key={field.key}
          sx={{
            gridColumn: "span 12",
            mt: field.mt ?? 2,
            mb: 1,
            pb: 0.5,
            borderBottom: "2px solid",
            borderColor: (theme) => (theme.palette.mode === "dark" ? "primary.50" : "primary.main"),
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: (theme) => (theme.palette.mode === "dark" ? "primary.50" : "primary.main") }}>
            {field.label}
          </Typography>
          {sectionActions.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {sectionActions.map((action) => {
                const { visible = true, enabled = true, nombre, icono, onClick } = action;
                if (!visible) return null;
                return (
                  <Tooltip key={nombre} title={nombre}>
                    <span>
                      <IconButton size="small" onClick={onClick} disabled={!enabled}>
                        <Icon sx={{ fontSize: 16 }} className={icono} />
                      </IconButton>
                    </span>
                  </Tooltip>
                );
              })}
            </Box>
          )}
        </Box>
      );
    }

    if (field.type === "spacer") {
      return (
        <Box
          key={field.key}
          sx={{
            gridColumn: resolveGridColumn(field.colSpan),
            minHeight: field.height ?? 48,
          }}
        />
      );
    }

    if (field.type === "note") {
      return (
        <Box
          key={field.key}
          sx={{
            gridColumn: resolveGridColumn(field.colSpan),
            mt: field.mt ?? (variant === "modern" ? 3.5 : 2),
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, textAlign: "center" }}>
            {field.label}
          </Typography>
        </Box>
      );
    }

    if (field.type === "select") {
      return renderSelectField(field, val, isDisabled, actionAdornment, onInput, identificacionOptions, variant);
    }

    if (field.type === "checkbox" || field.type === "checkboxes") {
      return renderCheckboxField(field, val, isDisabled, onInput, variant);
    }

    if (field.type === "button") {
      const btn = field;
      const { visible = true, enabled = true, nombre, icono, onClick } = btn.action || {};
      if (!visible) return null;
      const isModern = variant === "modern";
      return (
        <Box
          key={field.key}
          sx={{
            gridColumn: resolveGridColumn(field.colSpan),
            minWidth: 0,
            display: "flex",
            alignItems: "flex-end",
            pb: field.label ? 0 : "2px",
          }}
        >
          <Button
            variant={isModern ? "text" : "outlined"}
            size="small"
            onClick={onClick}
            disabled={!enabled}
            startIcon={icono ? <Icon className={icono} /> : null}
            sx={(theme) => ({
              minHeight: 40,
              minWidth: 0,
              width: "100%",
              px: { xs: 0.5, sm: 1 },
              fontSize: { xs: "0.65rem", sm: "0.8125rem" },
              lineHeight: 1.2,
              whiteSpace: "normal",
              "& .MuiButton-startIcon": { mr: { xs: 0.25, sm: 1 } },
              ...(isModern ? {
                borderRadius: 999,
                fontWeight: 600,
                bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.16 : 0.08),
                "&:hover": { bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.26 : 0.14) },
              } : {}),
            })}
          >
            {nombre}
          </Button>
        </Box>
      );
    }

    return renderTextField({ field, val, isDisabled, hasActions, textSlotProps, onInput, handleFieldClick, variant });
  });

const FormularioAlternativo = ({
  mensaje,
  initialValues = {},
  identificacionOptions = [],
  validate = null,
  onFieldChange = null,
  onValidityChange = null,
  onValuesChange = null,
  onSubmit = null,
  onRefresh = null,
  title = "Configuración de Masters",
  hideHeader = false,
  labels = { submit: "Guardar", seleccionar: "Seleccione" },
  showSubmitButton = true,
  topContent = null,
  fields = [],
  maxWidth = { xs: "100%", md: 720 },
  variant = "classic",
}) => {
  const [valores, setValores] = useState(() => initialValues);
  const prevInitialRef = useRef(initialValues);

  useEffect(() => {
    const prev = prevInitialRef.current;
    const changed = JSON.stringify(prev) !== JSON.stringify(initialValues);
    if (changed) {
      prevInitialRef.current = initialValues;
      setValores({ ...initialValues });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialValues)]);

  const valoresRef = useRef(valores);
  valoresRef.current = valores;

  const onInput = useCallback((id, val) => {
    // Base = `valoresRef.current` (estado local, incluye lo que el usuario ya
    // tecleó) fusionado con `initialValues` (prop, siempre al día) por encima:
    // si el padre acaba de aplicar un auto-relleno (p.ej. país/departamento/
    // contacto tras seleccionar una entidad) el efecto que sincroniza `valores`
    // con `initialValues` corre en un ciclo aparte y puede no haber terminado
    // todavía cuando el usuario edita el siguiente campo. Como este handler
    // reenvía el objeto COMPLETO al padre (no solo `id`), una base desactualizada
    // pisaría esos auto-rellenos con "" al hacer merge en el padre.
    const currentValores = { ...valoresRef.current, ...initialValues };
    const nextValues = { ...currentValores, [id]: val };
    let finalNext = nextValues;
    if (typeof onFieldChange === "function") {
      const patch = onFieldChange(id, val, nextValues);
      if (patch && typeof patch === "object") {
        finalNext = { ...nextValues, ...patch };
      }
    }

    setValores(finalNext);
    if (typeof onValuesChange === "function") {
      onValuesChange(finalNext);
    }
  }, [onFieldChange, onValuesChange, initialValues]);

  const isValid = useMemo(
    () => (typeof validate === "function" ? validate(valores) : false),
    [validate, valores],
  );

  const onValidityChangeRef = useRef(onValidityChange);
  onValidityChangeRef.current = onValidityChange;

  useEffect(() => {
    if (typeof onValidityChangeRef.current === "function") onValidityChangeRef.current(isValid);
  }, [isValid]);

  const handleSubmit = () => {
    if (typeof onSubmit === "function" && isValid) {
      onSubmit(valores);
    }
  };

  const handleRefresh = () => {
    setValores(initialValues);
    if (typeof onRefresh === "function") {
      onRefresh();
    }
  };

  const isModern = variant === "modern";

  return (
    <Box>
      <Box
        sx={
          isModern
            ? (theme) => ({
                border: 1,
                borderColor: theme.palette.mode === "dark" ? alpha(theme.palette.common.white, 0.08) : "grey.200",
                borderRadius: 3,
                p: { xs: 2, sm: 3 },
                my: 1,
                display: "grid",
                gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
                gap: 2,
                maxWidth,
                mx: "auto",
                bgcolor: theme.palette.background.paper,
                boxShadow: theme.palette.mode === "dark"
                  ? "0 1px 2px rgba(0,0,0,.4), 0 12px 28px rgba(0,0,0,.35)"
                  : "0 1px 2px rgba(15,23,42,.04), 0 12px 28px rgba(15,23,42,.06)",
              })
            : {
                border: 1,
                borderColor: "grey.300",
                borderRadius: 1,
                p: 2,
                my: 1,
                display: "grid",
                gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
                gap: 2,
                maxWidth,
                mx: "auto",
                bgcolor: "#9e9e9e19",
              }
        }
      >
        {!hideHeader && (
          <Box sx={{ gridColumn: "span 12", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, bgcolor: "#9e9e9e19", py: 2, px: 1, borderRadius: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, textAlign: "center", flex: 1 }}>
              {title}
            </Typography>
            <Tooltip title="Actualizar">
              <IconButton size="small" aria-label="Actualizar" onClick={handleRefresh}>
                <Icon className="c-actualizar" />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {topContent && (
          <Box sx={{ gridColumn: "span 12", mb: 1 }}>
            {topContent}
          </Box>
        )}

        {renderFields(fields, valores, identificacionOptions, onInput, variant)}
      </Box>

      {showSubmitButton && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
          <Button variant="contained" size="small" disabled={!isValid} onClick={handleSubmit}>
            {labels.submit}
          </Button>
        </Box>
      )}

      {mensaje && (
        <Box sx={{ mt: 1 }}>
          {mensaje}
        </Box>
      )}
    </Box>
  );
};

FormularioAlternativo.propTypes = {
  mensaje: PropTypes.string,
  initialValues: PropTypes.object,
  identificacionOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  validate: PropTypes.func,
  onFieldChange: PropTypes.func,
  onValidityChange: PropTypes.func,
  onValuesChange: PropTypes.func,
  onSubmit: PropTypes.func,
  onRefresh: PropTypes.func,
  title: PropTypes.string,
  labels: PropTypes.shape({
    submit: PropTypes.string,
    seleccionar: PropTypes.string,
  }),
  showSubmitButton: PropTypes.bool,
  hideHeader: PropTypes.bool,
  topContent: PropTypes.node,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string,
      type: PropTypes.oneOf(["text", "email", "select", "checkbox", "checkboxes", "date", "datetime", "textarea", "section", "button", "spacer", "note"]),
      multiple: PropTypes.bool,
      readOnly: PropTypes.bool,
      required: PropTypes.bool,
      colSpan: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      options: PropTypes.array,
      actions: PropTypes.arrayOf(
        PropTypes.shape({
          visible: PropTypes.bool,
          enabled: PropTypes.bool,
          nombre: PropTypes.string,
          icono: PropTypes.string,
          onClick: PropTypes.func,
        }),
      ),
    }),
  ),
  maxWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object]),
  variant: PropTypes.oneOf(["classic", "modern"]),
};

export default FormularioAlternativo;
