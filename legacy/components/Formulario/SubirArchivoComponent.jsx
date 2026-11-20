import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Button, CircularProgress, Grid, Icon, IconButton, MenuItem, styled, TextField, Typography } from "@mui/material";
import { useForm } from "../../hooks/useForm";
import { menuItemStyles, menuPaperPropsStyles } from "../MenuComponent/menuStyles";
import { inputPropTypes } from "./";
// import { placeholder, style, styleFilled, styleStandard } from "./SubirArchivoComponentStyles";
import { useSelector } from "react-redux";
import imageCompression from "browser-image-compression";

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

const SubirArchivoComponent = (props) => {
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
    const value = currentInput.multiple ? ev.target.files : ev.target.files[0];

    if (currentInput.useB64 && value) {
      const reader = new FileReader();
      setNombre(value.name);

      const options = {
        maxSizeMB: 0.9,
        // maxWidthOrHeight: 600,
        useWebWorker: true,
        alwaysKeepResolution: true,
      };

      try {
        setCargando(true);
        const compressedFile = await imageCompression(value, options);

        reader.onload = () => {
          const base64String = reader.result;
          onInput(base64String);
          formState.onInputChange({ target: { value: base64String, name: currentInput.id } });
        };
        reader.readAsDataURL(compressedFile);
      } catch (e) {
        console.log(e);
      }
    } else {
      formState.onInputChange({ target: { value: value, name: currentInput.id } });
      onInput(value);
    }
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
    <>
      {input.pegar && (
        <IconButton role={undefined} variant="contained" tabIndex={-1} size="small" color="primary" onClick={handlePasteFromButton}>
          <Icon className="c-pegar" sx={{ "&.MuiIcon-root": { fontSize: 14 }, my: 0.3 }} />
        </IconButton>
      )}
      <Button component="label" role={undefined} variant="contained" tabIndex={-1} startIcon={<Icon className="c-cargar" />} size="small">
        Subir Archivo
        <VisuallyHiddenInput
          id={id}
          ref={fileInputRef}
          type="file"
          onChange={onChange}
          multiple={currentInput.multiple}
          accept={input.acceptedFiles ? input.acceptedFiles : "image/png, image/gif, image/jpeg"}
        />
      </Button>
      {nombre}
      {cargando && (
        <>
          <br />
          <CircularProgress size="1rem" /> Procesando imagen
        </>
      )}
      {/* <pre>{JSON.stringify(currentInput, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(formState, null, 2)}</pre> */}
    </>
  );
};

SubirArchivoComponent.propTypes = {
  input: inputPropTypes.isRequired,
  onInput: PropTypes.func,
};

export default SubirArchivoComponent;
