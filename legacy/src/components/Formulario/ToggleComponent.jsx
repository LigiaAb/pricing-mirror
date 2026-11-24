import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Box, FormControlLabel, Icon, Switch } from "@mui/material";
import { inputPropTypes } from ".";
import { useSelector } from "react-redux";
import { useForm } from "../../hooks/useForm";

const ToggleComponent = (props) => {
  const { input, onInput, id } = props;
  const label = useMemo(() => ({ inputProps: { "aria-label": input.label || input.id } }), [input]);
  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);

  const formState = useForm({
    [input.id]: input.val,
  });

  const onChange = (ev) => {
    const { checked } = ev.target;
    // verificarInputSegunTipo(value);
    // ev.preventDefault();
    // formState.onInputChange(ev);

    onInput(checked);
  };

  const GenerarIcon = ({ icon, bgcolor, color }) => {
    console.log(props);
    return (
      <Box
        sx={{
          boxShadow: "0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12)",
          borderRadius: "100%",
          bgcolor: bgcolor,
          color,
          p: 0.5,
          pt: 0.6,
          m: 0,
          minWidth: 20,
          minHeight: 20,
          maxWidth: 20,
          maxHeight: 20,
        }}
      >
        {icon && <Icon className={`${icon}`} sx={{ fontSize: 12 }} color={color} />}
      </Box>
    );
  };

  GenerarIcon.propTypes = {
    icon: PropTypes.string,
    bgcolor: PropTypes.string,
    color: PropTypes.string,
  };

  return (
    <FormControlLabel
      sx={{
        px: 1,
      }}
      control={
        <Switch
          {...(input.iconTrue ? { checkedIcon: <GenerarIcon icon={input.iconTrue} bgcolor={input.readonly ? "primary.light" : "primary.main"} color={input.readonly ? "white" : "white"} /> } : {})}
          {...(input.iconFalse ? { icon: <GenerarIcon icon={input.iconFalse} bgcolor={input.readonly ? "grey.100" : "white.main"} color={input.readonly ? "grey" : "primary"} /> } : {})}
          name={input.id}
          onChange={onChange}
          {...label}
          checked={input.val}
          id={id}
          disabled={input.readonly}
        />
      }
      label={
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            color: input?.color ? (themeMode == "dark" ? `${input?.color}.300` : `${input?.color}.800`) : `primary.${opositeMode}`,
          }}
        >
          {`${input.requerido ? " " : ""}${input.label || input.id || ""}`.toUpperCase()}
          {input.icono && <Icon className={input.icono} sx={{ fontSize: 15, ml: 0.5 }} />}
        </Box>
      }
    />
  );
};

ToggleComponent.propTypes = {
  input: inputPropTypes.isRequired,
  onInput: PropTypes.func,
  id: PropTypes.string,
};

export default ToggleComponent;
