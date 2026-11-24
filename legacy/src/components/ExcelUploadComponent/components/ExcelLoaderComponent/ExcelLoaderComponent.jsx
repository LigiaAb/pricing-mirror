import { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { styled, Box, Button, Icon, Typography, Grid } from "@mui/material";
import TablaComponent from "../../../Tabla/TablaComponent";
import LoaderComponent from "../../../Loader/LoaderComponent";
import { useDropzone } from "react-dropzone";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import * as Yup from "yup";

const DropzoneStyles = styled("div")(({ theme }) => ({
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  textAlign: "center",
  cursor: "pointer",
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const columnNumberToLetter = (columnNumber) => {
  let temp = "";
  while (columnNumber > 0) {
    let residuo = (columnNumber - 1) % 26;
    temp = String.fromCharCode(65 + residuo) + temp;
    columnNumber = Math.floor((columnNumber - residuo - 1) / 26);
  }
  return temp;
};

const convertToText = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "object") {
    return value.text;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
};

const ExcelLoaderComponent = ({ columnas, filas, setFilas, onUpload, onReset, disabled = false }) => {
  const [loading, setLoading] = useState(false);
  const [abortController, setAbortController] = useState({});

  const readExcelFile = async (file, signal) => {
    // Espera finctica de 2 segundos para simular una carga de datos
    await new Promise((resolve) => setTimeout(resolve, 3000));

    try {
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);

      const extractedData = [];
      workbook.eachSheet((sheet) => {
        sheet.eachRow((row, rowNumber) => {
          if (signal.aborted) throw new Error("Carga cancelada");

          if (rowNumber === 1) return;

          const rowObject = columnas.reduce((acc, col, index) => {
            const valorCelda = row.getCell(index + 1).value;
            acc[col.label] = convertToText(valorCelda);
            return acc;
          }, {});
          rowObject._rowNumber = rowNumber;
          extractedData.push(rowObject);
        });
      });
      return extractedData;
    } catch (error) {
      return [];
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    setLoading(true);

    const controller = new AbortController();
    setAbortController(controller);

    const file = acceptedFiles[0];
    if (file && !controller.signal.aborted) {
      const data = await readExcelFile(file, controller.signal);
      setFilas(data);
    }
    setLoading(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: false,
  });

  const handleDownloadSample = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Datos");

    // Añadir encabezados de columnas
    const headers = columnas.map((col) => col.label);
    worksheet.addRow(headers);

    // Ajustar el ancho de las columnas
    worksheet.columns.forEach((column, index) => {
      column.width = headers[index].length < 20 ? 20 : headers[index].length;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, "Plantilla.xlsx");
  };

  const handleConfirmUpload = async () => {
    if (filas.length === 0) return;
    const schema = Yup.array().of(
      Yup.object().shape(
        columnas.reduce((acc, col) => {
          if (col.yupSchema) {
            acc[col.label] = col.yupSchema;
          } else {
            acc[col.label] = Yup.mixed().nullable();
          }
          return acc;
        }, {})
      )
    );

    const filasErroneas = [];
    const erroresPorFila = {};
    try {
      await schema.validate(filas, { abortEarly: false });
    } catch (error) {
      error.inner.forEach((err) => {
        const filaIndex = err.path.match(/\d+/)[0];
        const filaErronea = filas[filaIndex];

        if (!erroresPorFila[filaErronea._rowNumber]) {
          erroresPorFila[filaErronea._rowNumber] = {
            fila: filaErronea,
            errores: [],
          };
          filasErroneas.push(filaErronea);
        }

        erroresPorFila[filaErronea._rowNumber].errores.push(err.message);
      });
    }

    const indicesFilasErroneas = Object.keys(erroresPorFila).map(Number);
    const filasCorrectas = filas.filter((f) => !indicesFilasErroneas.includes(f._rowNumber));

    onUpload({
      filasCorrectas,
      filasErroneas,
      erroresPorFila,
    });
  };

  const reset = () => {
    setFilas([]);
    if (abortController instanceof AbortController) {
      abortController.abort();
      setAbortController(null);
    }
    setLoading(false);
    onReset();
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Grid container rowSpacing={2}>
        <Grid size={{ xs: 12, md: "grow" }}>
          <Box
            display="flex"
            flexWrap="wrap"
            columnGap={2}
            rowGap={2}
            sx={{
              justifyContent: {
                xs: "center",
                md: "start",
              },
            }}
          >
            <Button variant="outlined" color="primary" onClick={handleDownloadSample} startIcon={<Icon className="c-descargar" />} sx={{ width: { xs: "100%", md: "auto" } }}>
              Descargar Plantilla
            </Button>
          </Box>
        </Grid>

        <Grid ize={{ xs: 12, md: "grow" }}>
          <Box
            display="flex"
            flexWrap="wrap"
            columnGap={1}
            rowGap={1}
            sx={{
              justifyContent: {
                xs: "center",
                md: "flex-end",
              },
            }}
          >
            <Button variant="outlined" color="success" onClick={handleConfirmUpload} sx={{ width: { xs: "100%", md: "auto" } }} disabled={disabled || loading || filas.length === 0}>
              Confirmar
            </Button>

            <Button variant="outlined" color="error" onClick={reset} sx={{ width: { xs: "100%", md: "auto" } }}>
              Reiniciar
            </Button>
          </Box>
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <LoaderComponent sx={{ position: "block" }} texto="Se esta leyendo el excel provisto" />
        </Box>
      ) : filas.length > 0 ? (
        <TablaComponent titulo="Filas Cargadas" id="_rowNumber" encabezado={columnas} datos={filas} />
      ) : (
        <DropzoneStyles {...getRootProps()} sx={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <input {...getInputProps()} />
          <Typography>{isDragActive ? "Suelta el archivo aquí..." : "Arrastra y suelta un archivo Excel aquí, o haz clic para seleccionar uno"}</Typography>
        </DropzoneStyles>
      )}
    </Box>
  );
};

ExcelLoaderComponent.propTypes = {
  columnas: PropTypes.array.isRequired,
  filas: PropTypes.array.isRequired,
  setFilas: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default ExcelLoaderComponent;
