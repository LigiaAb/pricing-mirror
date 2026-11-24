import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Button, CircularProgress, Grid, Icon, IconButton, Box, styled, TextField, Typography } from "@mui/material";
import { useForm } from "../../hooks/useForm";
import { menuItemStyles, menuPaperPropsStyles } from "../MenuComponent/menuStyles";
import { inputPropTypes } from "./";
// import { placeholder, style, styleFilled, styleStandard } from "./SubirArchivoComponentStyles";
import { useSelector } from "react-redux";
import imageCompression from "browser-image-compression";
import lightScroll from "../../style/scrollStyle";
import InputLabelComponent from "./InputLabelComponent";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const SubirArchivoComponent2 = (props) => {
  const { input, onInput, id } = props;
  const currentInput = useMemo(() => input, [input]);
  const fileInputRef = useRef(null);

  const formState = useForm({
    [currentInput.id]: currentInput.val,
  });

  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [mostrar, setMostrar] = useState(false);

  const [cargando, setCargando] = useState(false);

  const [nombre, setNombre] = useState("");

  const onChange = async (ev) => {
    ev.preventDefault();
    const files = currentInput.multiple ? ev.target.files : ev.target.files[0];
    setNombre(currentInput.multiple ? (files.length > 1 ? `${files.length} archivos cargados` : files[0]?.name) : files?.name);

    formState.onInputChange({ target: { value: files, name: currentInput.id } });
    onInput(files);
    setCargando(false);
  };

  const clearInput = (ev) => {
    ev.preventDefault();
    formState.onInputChange({ target: { name: currentInput.id, value: "" } });
    onInput("");
  };

  useEffect(() => {
    formState.formState[currentInput.id] = currentInput.val;
  }, [currentInput, formState.formState]);

  useEffect(() => {
    if (currentInput.error) {
      setError(true);
      setErrorMessage(currentInput.errorMessage || "Error");
    }
  }, [currentInput]);

  const handlePasteFromButton = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (let item of clipboardItems) {
        if (item.types.includes("image/png") || item.types.includes("image/jpeg")) {
          const blob = await item.getType("image/png");
          const file = new File([blob], "pasted-image.png", { type: blob.type });

          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInputRef.current.files = dataTransfer.files;
          onChange({ preventDefault: () => {}, target: { files: fileInputRef.current.files } });
        }
      }
    } catch (err) {
      console.error("Failed to read clipboard contents: ", err);
    }
  };
  return (
    <Grid container display={"flex"} flexDirection={"row"} justifyContent={"flex-start"} alignContent={"center"}>
      <Grid size={12} p={0} m={0}>
        <Box
          sx={{
            m: 0,
            p: 0,
            mb: 0.3,
            ml: 1.5,
            display: "flex",
            alignItems: "center",
            color: error ? "red.main" : input?.color ? (themeMode == "dark" ? `${input?.color}.300` : `${input?.color}.800`) : "text.main",
            fontSize: "0.8rem",
          }}
        >
          {`${input.requerido ? "* " : ""}${input.label || input.id || ""}`}
        </Box>
      </Grid>

      {input.pegar && (
        <Grid size={2}>
          <IconButton role={undefined} variant="contained" tabIndex={-1} size="small" color="primary" onClick={handlePasteFromButton}>
            <Icon className="c-pegar" sx={{ "&.MuiIcon-root": { fontSize: 14 }, my: 0.3 }} />
          </IconButton>
        </Grid>
      )}
      <Grid>
        <Button component="label" role={undefined} variant="contained" tabIndex={-1} startIcon={<Icon className={input.icono ? input.icono : "c-cargar"} />} size="small">
          {input.buttonText || "Subir Archivo"}
          <VisuallyHiddenInput
            id={id}
            ref={fileInputRef}
            type="file"
            onChange={onChange}
            multiple={currentInput.multiple}
            accept={input.acceptedFiles ? input.acceptedFiles : "image/png, image/gif, image/jpeg"}
          />
        </Button>
      </Grid>
      <Grid size={4} ml={1} alignContent={"center"}>
        <Typography textAlign={"left"}>{nombre}</Typography>
        {cargando && (
          <>
            <br />
            <CircularProgress size="1rem" /> Procesando imagen
          </>
        )}
      </Grid>
    </Grid>
  );
};

SubirArchivoComponent2.propTypes = {
  input: inputPropTypes.isRequired,
  onInput: PropTypes.func,
};

export default SubirArchivoComponent2;
