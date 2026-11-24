import { Autocomplete, Box, TextField, Typography } from "@mui/material";
import PropTypes from "prop-types";

const sx1 = (color) => ({
  "& *": { color: `${color}.main` },
  padding: "2px", // Ajusta el padding
  fontSize: "12px", // Tamaño de la fuente más pequeño
  width: "100%", // Ajusta para que el input ocupe todo el ancho
  color, // Color del texto en blanco
  "&.MuiInputBase-root": {
    m: "0px !important",
    p: "0px !important",
    "& .MuiInputBase-input": {
      width: "100% !important", // El input ocupa todo el espacio disponible
      color: `${color}.main`, // Color del texto en blanco
      "&.Mui-disabled": {
        color: `${color} !important`, // Color del texto en blanco
        WebkitTextFillColor: "inherit !important",
        "&::after": { borderBottomColor: "#002664 !important" },
        "&::before": { borderBottomColor: "#002664 !important" },
      },
    },

    "&.MuiInputBase-readOnly": {
      "&::after, &:hover::after, &::before, &:hover::before": {
        borderBottomColor: "primary.main",
        borderBottomStyle: "solid",
        borderBottomWidth: 2,
      },
    },
    "&::after, &:hover::after, &::before, &:hover::before": {
      borderBottomColor: `${color}.100_50`,
      borderBottomStyle: "solid",
      borderBottomWidth: 2,
    },
  },
});
const sx2 = (color) => ({
  "& .MuiOutlinedInput-root": {
    // padding: "0px", // Elimina el padding adicional
    minWidth: "auto", // Tamaño mínimo del input
    width: "fit-content", // El input ocupa todo el espacio disponible
    "& fieldset": {
      borderColor: color, // Color del borde
    },
    "&.Mui-focused fieldset": {
      borderColor: color, // Color del borde cuando está enfocado
    },
    m: 0,
    p: 0,
  },
  "& input": {
    // padding: "2px", // Reduce el padding interno del input
    color: color + " !important", // Color de la fuente en blanco
  },
});

const GenerarInputSelect = ({ options, value, pathname, onChange, option_label, option_value, tooltip, color = "white" }) => {
  const iconoCerrar = <Typography component="span" color={`${color}.main`} sx={{ fontSize: 8, m: 0, p: 0, width: "100%", visibility: "visible !important" }} className="c-x1" />;

  const iconoAbrir = <Typography component="span" color={`${color}.main`} sx={{ fontSize: 10, m: 0, p: 0, width: "100%", visibility: "visible !important" }} className="c-abajo-simple" />;

  return (
    <Autocomplete
      sx={{ "& .MuiFormControl-root": { width: "100%" } }}
      renderInput={(params) => (
        <TextField
          sx={sx2(color)}
          variant="filled"
          {...params}
          value={[value]}
          InputProps={{
            ...params.InputProps,
            sx: sx1(color),
            onKeyDown: (e) => {
              if ((e.key === "Backspace" || e.key === "Delete") && value) {
                onChange(null);
                e.preventDefault();
              }
            },
          }}
          placeholder={tooltip}
        />
      )}
      renderOption={(props, option, state, ownerState) => {
        const { key, ...optionProps } = props;
        return (
          <Box key={key} {...optionProps}>
            {ownerState.getOptionLabel(option)}
          </Box>
        );
      }}
      disablePortal
      clearIcon={iconoCerrar}
      popupIcon={iconoAbrir}
      disabled={!(pathname.split("/").length === 2 || pathname.split("/")[1] === "")}
      value={value}
      size="small"
      ListboxProps={{
        sx: { maxHeight: "10rem", p: 0.4, bgcolor: "transparent", "& li": { p: "0.2em !important", m: "0px !important", bgcolor: "transparent !important" } },
      }}
      getOptionLabel={(option) => {
        return option[option_label] || "";
      }}
      getOptionKey={(option) => {
        return option[option_value] || "";
      }}
      onChange={(e, v) => {
        onChange(v);
      }}
      options={options}
    />
  );
};

GenerarInputSelect.propTypes = {
  options: PropTypes.arrayOf(PropTypes.object).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.array, PropTypes.object]),
  pathname: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  option_label: PropTypes.string.isRequired,
  option_value: PropTypes.string.isRequired,
  tooltip: PropTypes.string,
  color: PropTypes.string,
};

export default GenerarInputSelect;
