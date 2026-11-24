import { useState, useMemo, useEffect, useCallback } from "react";
import { Box, Button, Icon, Typography, Grid, CircularProgress } from "@mui/material";
import TarjetaCoordinaciones from "../components/tarjetaCoordinacion";
import PropTypes from "prop-types";
import CargasTabla from "../components/cargasTabla";
import PdfEtiqueta from "../../Embarques/pdfEtiqueta";
import { encryptId } from "../../../api/encryptDecrypt";
import ActionAlertComponent from "../../../components/Dialog/ActionAlertComponent";
import { useCoordinacionCargas, useFetchTipos, useFetchEntidades, useUpdateCoordinacionEstado, useFetchPaises, useFetchGuiasCoordinacion } from "../../../hooks/Bpm";
import { useQueryClient } from "@tanstack/react-query";
import FormularioComponent from "@/components/Formulario/FormularioComponent";
import { api } from "../../../api";
import moment from "moment";
import LoaderComponent from "@/components/Loader/LoaderComponent";

function ImprimirEtiquetas({ coodinacion, etiquetas }) {
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [errorPDF, setErrorPDF] = useState(null);
  const [pdfUri, setPdfUri] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [funcionDeDescarga, setFuncionDeDescarga] = useState(() => {});
  const [data, setData] = useState({
    inicio: 1, final: 1
  });

  useEffect(() => {
    setData(prev => ({...prev, final: coodinacion.etiq_bultos}))
    setPdfUri(null)
  }, [coodinacion]);

 
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const recuperarArhivo = async (
    archivoData,
    maxIntentos = 5,
    delayMs = 3000
  ) => {
    for (let intento = 1; intento <= maxIntentos; intento++) {

      try{
        
        const archivo = await api.post("/api/appweb/recuperar-archivo", { ruta_archivo: archivoData.url_documento}, { responseType: "arraybuffer" });
        const contentType = archivo.headers.get('content-type') || '';
        if (contentType.includes('application/pdf')) {
          return archivo
        } 
        throw Error()
      } catch(e){
        console.log("retry")
        const esUltimoIntento = intento === maxIntentos;
        // console.warn(`Intento ${intento}: archivo no localizado todavía`);

        if (esUltimoIntento) {
          return null;
        }

        await sleep(delayMs * intento); 
      }
    }
  };

  const onGenerar = async () => {
    setPdfUri(null)
    setIsLoading(true);
    await api
      .post("api/appweb/generar-etiquetas-oracle", { ...coodinacion, inicio:data.inicio, final: data.final })
      .then(({ data }) => handleObtenerArchivo(data.data))
      .catch((e) => console.error(e));
    setIsLoading(false);
  }

  const handleObtenerArchivo = useCallback(async (row) => {
    try {
      const archivo = await recuperarArhivo(row)
      if(!archivo){
        throw new Error("No se ha podido recuperar el archivo");
      }

      const nombreArchivo = `ETIQUETAS-${coodinacion.etiq_mawb}_${moment().format("YYYY-MM-DD")}.pdf`;
      const blob = new Blob([archivo.data], { type: "application/pdf" });
      const file = new File([archivo.data], nombreArchivo, { type: "application/pdf" });

      const url = URL.createObjectURL(file);

      const localFuncionDescarga = () => {
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      };

      setFuncionDeDescarga(() => localFuncionDescarga);
      setPdfUri(url);
    } catch (err) {
      console.error("Error al subir archivo:", err);

      const errorMessage = err.response?.data?.message || err.message || "Error al subir archivo";
      // setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      // setIsLoading(false);
    }
  }, []);

  const inputs = useMemo(
    () => [
      {
        tipo: "number",
        id: "inicio",
        size: 6,
        val: data?.inicio || 0,
        label: "Inicio",
        readonly: false,
        requerido: true,
      },
     {
        tipo: "number",
        id: "final",
        size: 6,
        val: data?.final || 0,
        label: "Final",
        readonly: false,
        requerido: true,
      },
    ],
    [data, coodinacion],
  );

  return (
    <Box sx={{ p: 2 }}>
      <Grid width="100%">
        <Grid size={12} sx={{mt: 2}}>
          <Typography
            variant="h5"
            sx={{ color: "text.primary", fontWeight: 400 }}
          >
            Coordinación MAWB {coodinacion.etiq_mawb || ""} / HAWB {coodinacion.etiq_hawb || ""}
          </Typography>
        </Grid>
        <Grid size={12}>
          <FormularioComponent
            inputs={inputs}
            onInput={({ id, val }) => setData((inp) => ({ ...inp, [id]: val }))}
            botones={{
              generar: {
                texto: "Generar Etiquetas",
                visible: true,
                onClick: () => onGenerar(),
                readonly: isLoading,
              },
              agregar: { visible: false, onClick: null },
              cancelar: { visible: false, onClick: null },
              guardar: { visible: false, onClick: null },
              filtrar: { visible: false, onClick: null },
            }}
          />
        </Grid>
        <Grid container size={12} mt={3} px={2}>
          {pdfUri && <iframe src={`${pdfUri}#toolbar=0&navpanes=0&scrollbar=0`} width="100%" height="800px" />}
          {pdfUri && (
            <Grid size={12} px={2}>
              <Button variant="contained" size="small" sx={{ width: "100%" }} onClick={funcionDeDescarga}>
                Descargar
              </Button>
            </Grid>
          )}
        </Grid>
      </Grid>
      {isLoading && 
        <LoaderComponent sx={{ position: "block" }} 
          texto={"Cargando"}
        />
      }
    </Box>
  );
}

export default ImprimirEtiquetas;

