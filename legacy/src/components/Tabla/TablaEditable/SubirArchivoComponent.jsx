import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Icon, IconButton, TextField, Typography } from "@mui/material";
import { useForm } from "../../../hooks/useForm";
import { useSelector } from "react-redux";
import { styleFilled } from "./textComponentStyles";
import DialogComponent from "../../Dialog/DialogComponent";
import { api } from "../../../api";

const SubirArchivoComponent = (props) => {
  const { input, onInput, id } = props;
  const { fontSize } = useSelector((state) => state.theme);

  const [fileName, setFileName] = useState(" ");
  const [archivo, setArchivo] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [contentType, setContentType] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const currentInput = useMemo(() => input, [input]);

  const formState = useForm({
    [currentInput.id]: currentInput.val,
  });

  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const limpiarNombreArchivo = useCallback((archivo) => {
    const partes = archivo.split("."); // Dividir por los puntos
    return `${partes[0]}${partes[0] ? "." : ""}${partes[partes.length - 1]}`; // Reconstruir solo el primer y último segmento
  }, []);

  // const obtenerArchivoDesdeApi = useCallback(async () => {
  //   if (typeof input.val === "string") {
  //     let file = await api.post("/api/appweb/recuperar-archivo", { ruta_archivo: input.val }, { responseType: "blob" }).then((response) => {
  //       const { data, headers } = response;
  //       // Obtener tipo MIME desde `Content-Type`
  //       const contentType = response.headers["content-type"]; // Ejemplo: "image/png"

  //       // Obtener nombre del archivo desde `Content-Disposition`
  //       const contentDisposition = response.headers["content-disposition"];
  //       let fileName = "archivo_descargado"; // Nombre por defecto
  //       if (contentDisposition) {
  //         const match = contentDisposition.match(/filename="(.+)"/);
  //         if (match && match[1]) {
  //           fileName = match[1]; // Nombre del archivo extraído
  //         }
  //       }

  //       // Crear un objeto URL para el archivo descargado
  //       const fileURL = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));

  //       // Crear un enlace dinámico y activarlo para descargar el archivo
  //       const downloadLink = document.createElement("a");
  //       downloadLink.href = fileURL;
  //       downloadLink.download = fileName; // Nombre del archivo dinámico
  //       document.body.appendChild(downloadLink);
  //       downloadLink.click();
  //       downloadLink.remove();

  //       // Limpiar el objeto URL creado
  //       window.URL.revokeObjectURL(fileURL);
  //     });
  //   }
  // }, [input]);

  const obtenerArchivoDesdeApi = useCallback(async () => {
    if (typeof input.val === "string") {
      try {
        const response = await api.post("/api/appweb/recuperar-archivo", { ruta_archivo: input.val }, { responseType: "blob" });

        const contentType = response.headers["content-type"];
        const contentDisposition = response.headers["content-disposition"];

        // Determinar el nombre del archivo desde content-disposition
        // let fileName = "archivo_descargado";
        console.log({ headers: response });
        // if (contentDisposition) {
        //   const match = contentDisposition.match(/attachment; filename="(.+)"/);
        //   console.log({ match });
        //   if (match && match[1]) {
        //     fileName = match[1];
        //   }
        // }

        const fileURL = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
        // const blob = new Blob([response.data], { type: response.headers["content-type"] });
        // const fileURL = window.URL.createObjectURL(blob);

        // setFileName(fileName);
        setFileUrl(fileURL);
        setContentType(response.headers["content-type"]);

        // Comprobar si el archivo es visualizable
        const visualizableMimeTypes = ["image/png", "image/svg+xml", "image/jpeg", "image/gif", "application/pdf", "text/plain"];
        if (visualizableMimeTypes.some((type) => contentType.startsWith(type))) {
          setIsDialogOpen(true);
        } else {
          const downloadLink = document.createElement("a");
          downloadLink.href = fileURL;
          downloadLink.download = limpiarNombreArchivo(typeof input.val === "string" ? input.val.split("/").pop() : Array.isArray(archivo) ? archivo.map((i) => i.name).join(", ") : archivo.name);
          document.body.appendChild(downloadLink);
          downloadLink.click();
          downloadLink.remove();
          window.URL.revokeObjectURL(fileURL);
        }

        // Liberar memoria
      } catch (error) {
        console.error("Error al obtener el archivo desde la API:", error);
      }
    }
  }, [archivo, input, limpiarNombreArchivo]);

  const verificarInputArchivo = useCallback(
    (file) => {
      let isValid = true;
      let message = "";

      if (input.requerido && !file) {
        isValid = false;
        message = `Debe seleccionar un archivo.`;
      }

      setError(!isValid);
      setErrorMessage(message);
    },
    [input]
  );

  const onChange = (ev) => {
    if (!input.multiple) {
      const file = ev.target.files[0];
      // console.log(file);
      setArchivo(file);
      formState.onInputChange(ev);
      onInput && onInput(file);
      setFileName(file.name);
      verificarInputArchivo(file);
    } else {
      const file = Array.from(ev.target.files);
      // console.log(file);
      setArchivo(file);
      formState.onInputChange(ev);
      onInput && onInput(file);
      setFileName(file.map((i) => i.name).join(", "));
      // console.log(file.map((i) => i.name).join(", "));
      verificarInputArchivo(file);
    }
  };

  const clearInput = (ev) => {
    ev.preventDefault();
    formState.onInputChange({ target: { name: currentInput.id, value: "" } });
    onInput && onInput(null);
  };

  useEffect(() => verificarInputArchivo(currentInput.val), [currentInput, verificarInputArchivo]);
  useEffect(() => setFileName(input.val ? input.val.name : " "), [input]);
  useEffect(() => {
    // console.log(input.val);
    setArchivo(input.val ? input.val : null);
  }, [input]);

  const cerrarDialogo = () => {
    setIsDialogOpen(false);
    if (fileUrl) window.URL.revokeObjectURL(fileUrl); // Limpiar memoria
    setFileUrl(null);
    setContentType("");
  };

  return (
    <>
      {/* <TextField
        sx={{ ...styleFilled(currentInput) }}
        label={`${currentInput.label || currentInput.id || ""}${currentInput.requerido ? " *" : ""}`}
        variant="filled"
        size="small"
        type="file"
        fullWidth
        name={currentInput.id}
        onChange={onChange}
        InputProps={{
          endAdornment: (
            <Grid size="auto">
              <Grid container direction="row" position="end">
                {!currentInput.readonly && formState[currentInput.id] !== "" && (
                  <Grid>
                    <IconButton sx={{ m: 0, p: 0, mr: 0.3, pr: "1px", width: "auto", maxWidth: 20 }} size="small" color="black" onClick={clearInput}>
                      <Icon sx={{ m: 0, p: 0, fontSize: fontSize + 5, width: "auto" }} className="c-delete" />
                    </IconButton>
                  </Grid>
                )}
              </Grid>
            </Grid>
          ),
        }}
        error={error}
        helperText={errorMessage}
      /> */}
      {archivo ? (
        <Grid container alignItems="center" direction="row" width="100%" sx={{ px: 0.5 }}>
          <Grid
            size="grow"
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {limpiarNombreArchivo(typeof input.val === "string" ? input.val.split("/").pop() : Array.isArray(archivo) ? archivo.map((i) => i.name).join(", ") : archivo.name)}
          </Grid>
          <Grid size="auto">
            {
              <IconButton sx={{ m: 0, p: 0, mr: 0.3, pr: "1px", width: "auto", maxWidth: 20 }} size="small" color="secondary" onClick={obtenerArchivoDesdeApi}>
                <Icon color={input.color || "text"} sx={{ m: 0, p: 0, fontSize: 12, width: "auto" }} className="c-descargar" />
              </IconButton>
            }
            {!input.readonly && (
              <IconButton sx={{ m: 0, p: 0, mr: 0.3, pr: "1px", width: "auto", maxWidth: 20 }} size="small" color="black" onClick={clearInput}>
                <Icon color={input.readonly ? "grey" : input.color || "text"} sx={{ m: 0, p: 0, fontSize: 12, width: "auto" }} className="c-x1" />
              </IconButton>
            )}
          </Grid>
        </Grid>
      ) : (
        <TextField
          sx={{ ...styleFilled(currentInput) }}
          label={`${input.label || input.id || ""}${input.requerido ? " *" : ""}`}
          variant={input.inputTipo || "filled"}
          disabled={input.readonly}
          size="small"
          fullWidth
          name={id}
          id={id}
          autoComplete="new-password"
          value={fileName}
          onKeyDown={input.teclaPresionada}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <Grid container alignItems="center">
                {!input.readonly && (
                  <>
                    <input
                      multiple={input.multiple}
                      accept="*"
                      style={{ display: "none" }}
                      name={`upload-button-${id}`}
                      id={`upload-button-${id}`}
                      type="file"
                      onChange={onChange}
                      disabled={input.readonly}
                    />
                    <label htmlFor={`upload-button-${id}`}>
                      <IconButton sx={{ m: 0, p: 0, mr: 0.3, pr: "1px", width: "auto", maxWidth: 20 }} size="small" component="span" disabled={input.readonly} color="primary">
                        <Icon color={input.readonly ? "grey" : input.color || "text"} sx={{ m: 0, p: 0, fontSize: fontSize, fontWeight: "bold", width: "auto" }} className="c-cargar" />
                      </IconButton>
                    </label>
                  </>
                )}
              </Grid>
            ),
          }}
        />
      )}
      <DialogComponent titulo="Vista previa del archivo" width="90vw" height="60vh" handleClose={cerrarDialogo} openDialog={isDialogOpen}>
        <Grid container>
          <Grid size={12}>
            <iframe src={fileUrl} style={{ width: "100%", height: "40vh" }} title="PDF Viewer" />
          </Grid>
          <Grid size={12} textAlign="right">
            <Button
              variant="contained"
              onClick={() => {
                const downloadLink = document.createElement("a");
                downloadLink.href = fileUrl;
                downloadLink.download = limpiarNombreArchivo(
                  typeof input.val === "string" ? input.val.split("/").pop() : Array.isArray(archivo) ? archivo.map((i) => i.name).join(", ") : archivo.name
                );
                document.body.appendChild(downloadLink);
                downloadLink.click();
                downloadLink.remove();
              }}
              sx={{ m: 0, "&*": { p: 0 }, p: 0, px: 2, textTransform: "none" }}
            >
              DESCARGAR EL ARCHIVO{" "}
              {archivo ? limpiarNombreArchivo(typeof input.val === "string" ? input.val.split("/").pop() : Array.isArray(archivo) ? archivo.map((i) => i.name).join(", ") : archivo.name) : ""}
            </Button>
          </Grid>
        </Grid>
      </DialogComponent>
      {/* Dialog para mostrar archivo */}
      {/* <Dialog open={isDialogOpen} onClose={cerrarDialogo} maxWidth="lg" fullWidth>
        <DialogTitle>
          {fileUrl} {contentType} {fileUrl && ["image/png", "image/svg+xml", "image/jpeg", "image/gif", "application/pdf", "text/plain"].some((type) => contentType == type) ? "true" : "false"} Vista
          previa del archivo
        </DialogTitle>
        <DialogContent>
          {fileUrl && ["image/png", "image/svg+xml", "image/jpeg", "image/gif", "application/pdf", "text/plain"].some((type) => contentType == type) ? (
            <iframe src={fileUrl} style={{ width: "100%", height: "500px" }} title="PDF Viewer" />
          ) : (
            // contentType.startsWith("image/") ? (
            //   <img src={fileUrl} alt={fileName} style={{ maxWidth: "100%", maxHeight: "100%" }} />
            // ) : contentType === "application/pdf" ? (
            // ) : (
            //   <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
            //     <Typography>{fileName}</Typography>
            //     {fileUrl && <iframe src={fileUrl} style={{ width: "100%", height: "500px" }} title="Archivo Texto" />}
            //   </pre>
            // )
            <Typography> Este archivo no es visualizable. Puedes descargarlo usando el botón a continuación.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => cerrarDialogo()} color="secondary">
            Cerrar
          </Button>
          <Button
            onClick={() => {
              // Crear un enlace dinámico y activarlo para descargar el archivo
              const downloadLink = document.createElement("a");
              downloadLink.href = fileUrl;
              downloadLink.download = limpiarNombreArchivo(typeof input.val === "string" ? input.val.split("/").pop() : Array.isArray(archivo) ? archivo.map((i) => i.name).join(", ") : archivo.name);
              document.body.appendChild(downloadLink);
              downloadLink.click();
              downloadLink.remove();

              // Limpiar el objeto URL creado
              // window.URL.revokeObjectURL(fileUrl);
            }}
            color="primary"
            variant="contained"
          >
            Descargar
          </Button>
        </DialogActions>
      </Dialog> */}
    </>
  );
};

SubirArchivoComponent.propTypes = {
  input: PropTypes.shape({
    id: PropTypes.string.isRequired,
    val: PropTypes.any,
    requerido: PropTypes.bool,
    label: PropTypes.string,
    tipo: PropTypes.string,
    inputTipo: PropTypes.string,
    teclaPresionada: PropTypes.func,
    readonly: PropTypes.bool,
    errorMessage: PropTypes.string,
    error: PropTypes.bool,
    multiple: PropTypes.bool,
    formato: PropTypes.string,
    message: PropTypes.string,
    ruta: PropTypes.string,
    color: PropTypes.string,
  }).isRequired,
  onInput: PropTypes.func,
};

export default SubirArchivoComponent;
