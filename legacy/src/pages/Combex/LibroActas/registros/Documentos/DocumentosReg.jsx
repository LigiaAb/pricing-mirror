import { useState, useMemo } from "react";
import { Box, Typography, Divider, Grid, Icon } from "@mui/material";
import PropTypes from "prop-types";
import { useQueryClient } from "@tanstack/react-query";
import ActionAlertComponent from "../../../../../components/Dialog/ActionAlertComponent";
import BandaAlertaComponent from "../../../../../components/Alertas/BandaAlertaComponent";
import LoaderComponent from "../../../../../components/Loader/LoaderComponent";
import DocumentoCard from "./DocumentoCard";
import {
  useGuardarArchivo,
  useCreateCoordinacionDocumento,
  useDeleteCoordinacionDocumento,
  useRecuperarArchivo,
  useCoordinacionDocumentos,
} from "../../../../../hooks/Bpm";

const TIPOS_DOCUMENTOS = {
  MANIFIESTO: {
    id: 307,
    nombre: "Manifiesto Sellado",
    descripcion: "Manifiesto sellado por Combex",
    requerido: true,
    color: "primary",
    keywords: ["MANIFIESTO SELLADO COMBEX"],
  },
  PAGO: {
    id: 306,
    nombre: "Boleta de Repeso",
    descripcion: "Comprobante de pago Combex",
    requerido: true,
    color: "success",
    keywords: ["PAGO COMBEX"],
  },
  GUIA_MODIFICADA: {
    id: 308,
    nombre: "Guia Modificada",
    descripcion: "Guía modificada Combex",
    requerido: false,
    color: "info",
    keywords: ["GUIA MODIFICADA COMBEX"],
  },
};

const DocumentosReg = ({ coordinacion }) => {
  const queryClient = useQueryClient();
  const guardarArchivo = useGuardarArchivo();
  const createCoordinacionDocumento = useCreateCoordinacionDocumento();
  const deleteCoordinacionDocumento = useDeleteCoordinacionDocumento();
  const { data: documentos = [], isLoading: isLoadingDocumentos } =
    useCoordinacionDocumentos({ embarque_id: coordinacion.embarqueId });
  const { mutateAsync: recuperarArchivo } = useRecuperarArchivo();

  const [archivos, setArchivos] = useState({
    manifiesto: null,
    pago: null,
    guiaModificada: null,
  });
  const [descripciones, setDescripciones] = useState({
    manifiesto: "",
    pago: "",
    guiaModificada: "",
  });
  const [cargando, setCargando] = useState({
    manifiesto: false,
    pago: false,
    guiaModificada: false,
  });
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [documentoToDelete, setDocumentoToDelete] = useState(null);

  const documentosPorTipo = useMemo(() => {
    const resultado = {
      manifiesto: [],
      pago: [],
      guiaModificada: [],
    };

    documentos.forEach((doc) => {
      const tipoDesc = (doc.tipoDescripcion || "").toUpperCase();

      if (
        TIPOS_DOCUMENTOS.MANIFIESTO.keywords.some((kw) => tipoDesc.includes(kw))
      ) {
        resultado.manifiesto.push(doc);
      } else if (
        TIPOS_DOCUMENTOS.PAGO.keywords.some((kw) => tipoDesc.includes(kw))
      ) {
        resultado.pago.push(doc);
      } else if (
        TIPOS_DOCUMENTOS.GUIA_MODIFICADA.keywords.some((kw) =>
          tipoDesc.includes(kw)
        )
      ) {
        resultado.guiaModificada.push(doc);
      }
    });

    return resultado;
  }, [documentos]);

  const handleFileSelect = (tipo, event) => {
    const file = event.target.files?.[0];
    if (file?.type === "application/pdf") {
      setArchivos((prev) => ({ ...prev, [tipo]: file }));
    } else if (file) {
      console.error("Tipo de archivo inválido seleccionado (se requiere PDF):", file.type);
      alert("Por favor selecciona un archivo PDF");
    }
  };

  const handleSubirDocumento = async (tipo, tipoConfig) => {
    try {
      const archivo = archivos[tipo];
      if (!archivo) {
        console.error("Intento de subir documento sin seleccionar archivo para tipo:", tipo);
        alert("Por favor selecciona un archivo");
        return;
      }

      setCargando((prev) => ({ ...prev, [tipo]: true }));

      const ruta = await guardarArchivo.mutateAsync({
        archivo: archivo,
        tipo_documento: "coordinaciones",
        embarque_id: coordinacion?.embarqueId,
        cod_file: coordinacion?.codFile ?? coordinacion?.cod_file,
        descripcion: tipoConfig.descripcion,
      });

      const descripcionParaEnviar = descripciones[tipo] || tipoConfig.descripcion;

      await createCoordinacionDocumento.mutateAsync({
        embarque_id: coordinacion.embarqueId,
        cod_tipo_documento: tipoConfig.id,
        ubicacion: "coordinaciones",
        url_archivo: ruta,
        descripcion: descripcionParaEnviar,
        estado_cod: 1,
      });

      queryClient.invalidateQueries([
        "coordinacion-documentos",
        coordinacion.embarqueId,
      ]);

      setArchivos((prev) => ({ ...prev, [tipo]: null }));
      const fileInput = document.getElementById(`file-input-${tipo}`);
      if (fileInput) fileInput.value = "";
    } catch (err) {
      console.error(`Error al guardar ${tipo}:`, err);
      const serverData = err?.response?.data;
      if (serverData) {
        console.error("Respuesta del servidor al intentar guardar documento:", serverData);
      }

      const isFkTipoError =
        (serverData?.cod_mensaje === 1042) ||
        (typeof serverData?.error === "string" && serverData.error.includes("FK_COORDINACION_DOCUMENTOS_TIPO_ID_DOCUMENTO")) ||
        (typeof err?.message === "string" && err.message.includes("FK_COORDINACION_DOCUMENTOS_TIPO_ID_DOCUMENTO"));

      if (isFkTipoError) {
        alert(
          "Error al subir el documento: tipo de documento inválido (TIPO_ID). Verifica la configuración de TIPOS_DOCUMENTOS o contacta al administrador."
        );
      } else {
        alert(`Error al subir el documento: ${err?.message || "Error desconocido"}`);
      }
    } finally {
      setCargando((prev) => ({ ...prev, [tipo]: false }));
    }
  };

  const handleDescargar = async (documento, nombreTipo) => {
    try {
      const urlArchivo =
        documento?.urlArchivo ?? documento?.URL_ARCHIVO ?? documento?.url;
      if (!urlArchivo) {
        throw new Error("URL del archivo no disponible");
      }

      const blob = await recuperarArchivo({ ruta_archivo: urlArchivo });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${nombreTipo}_${coordinacion?.cod_file ?? coordinacion?.codFile}_${documento?.documentoIdCoord ?? "doc"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar archivo:", err);
      alert("Error al descargar el documento");
    }
  };

  const handleVer = async (documento) => {
    try {
      const urlArchivo =
        documento?.urlArchivo ?? documento?.URL_ARCHIVO ?? documento?.url;
      if (!urlArchivo) {
        throw new Error("URL del archivo no disponible");
      }

      const blob = await recuperarArchivo({ ruta_archivo: urlArchivo });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error("Error al visualizar archivo:", err);
      alert("Error al visualizar el documento");
    }
  };

  const handleEliminar = (documento) => {
    setDocumentoToDelete(documento);
    setShowDeleteAlert(true);
  };

  const handleCancelSeleccion = (tipo) => {
    setArchivos((prev) => ({ ...prev, [tipo]: null }));
    const fileInput = document.getElementById(`file-input-${tipo}`);
    if (fileInput) fileInput.value = "";
  };

  const handleDescripcionChange = (tipo, value) => {
    setDescripciones((prev) => ({ ...prev, [tipo]: value }));
  };

  const confirmarEliminacion = async () => {
    try {
      if (!documentoToDelete) return;

      await deleteCoordinacionDocumento.mutateAsync({
        documento_id_coord: documentoToDelete?.documentoIdCoord,
      });

      queryClient.invalidateQueries([
        "coordinacion-documentos",
        coordinacion.embarqueId,
      ]);

      setShowDeleteAlert(false);
      setDocumentoToDelete(null);
    } catch (err) {
      console.error("Error al eliminar documento:", err);
      alert("Error al eliminar el documento");
      setShowDeleteAlert(false);
      setDocumentoToDelete(null);
    }
  };

  const cancelarEliminacion = () => {
    setShowDeleteAlert(false);
    setDocumentoToDelete(null);
  };

  if (isLoadingDocumentos) {
    return (
      <LoaderComponent
        open={true}
        texto="CARGANDO DOCUMENTOS DE COORDINACIÓN"
      />
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
      <Grid container spacing={3} sx={{ mb: 2 }}>
        {/* Manifiesto Combex */}
        <Grid item xs={12} md={6} lg={4}>
          <DocumentoCard
            tipo="manifiesto"
            tipoConfig={TIPOS_DOCUMENTOS.MANIFIESTO}
            documento={documentosPorTipo.manifiesto[0]}
            archivoSeleccionado={archivos.manifiesto}
            estaCargando={cargando.manifiesto}
            onFileSelect={handleFileSelect}
            onSubir={handleSubirDocumento}
            onDescargar={handleDescargar}
            onVer={handleVer}
            onEliminar={handleEliminar}
            onCancel={handleCancelSeleccion}
            descripcion={descripciones.manifiesto}
            onDescripcionChange={handleDescripcionChange}
          />
        </Grid>

        {/* Pago Combex */}
        <Grid item xs={12} md={6} lg={4}>
          <DocumentoCard
            tipo="pago"
            tipoConfig={TIPOS_DOCUMENTOS.PAGO}
            documento={documentosPorTipo.pago[0]}
            archivoSeleccionado={archivos.pago}
            estaCargando={cargando.pago}
            onFileSelect={handleFileSelect}
            onSubir={handleSubirDocumento}
            onDescargar={handleDescargar}
            onVer={handleVer}
            onEliminar={handleEliminar}
            onCancel={handleCancelSeleccion}
            descripcion={descripciones.pago}
            onDescripcionChange={handleDescripcionChange}
          />
        </Grid>

        {/* Guía Modificada Combex */}
        <Grid item xs={12} md={6} lg={4}>
          <DocumentoCard
            tipo="guiaModificada"
            tipoConfig={TIPOS_DOCUMENTOS.GUIA_MODIFICADA}
            documento={documentosPorTipo.guiaModificada[0]}
            archivoSeleccionado={archivos.guiaModificada}
            estaCargando={cargando.guiaModificada}
            onFileSelect={handleFileSelect}
            onSubir={handleSubirDocumento}
            onDescargar={handleDescargar}
            onVer={handleVer}
            onEliminar={handleEliminar}
            onCancel={handleCancelSeleccion}
            descripcion={descripciones.guiaModificada}
            onDescripcionChange={handleDescripcionChange}
          />
        </Grid>
      </Grid>

      <ActionAlertComponent
        openDialog={showDeleteAlert}
        handleClose={cancelarEliminacion}
        aceptar={confirmarEliminacion}
        cancelar={cancelarEliminacion}
        tipo="error"
        activarAceptar={true}
        activarCanecelar={true}
        textoConfirmar="Sí, Eliminar"
        content={
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              ¿Estás seguro de eliminar este documento?
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight="bold"
                >
                  Tipo de documento:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {documentoToDelete?.tipoDescripcion}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight="bold"
                >
                  Descripción:
                </Typography>
                <Typography variant="body2">
                  {documentoToDelete?.descripcion ?? "Sin descripción"}
                </Typography>
              </Box>
              {documentoToDelete?.fechaCarga && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight="bold"
                  >
                    Fecha de carga:
                  </Typography>
                  <Typography variant="body2">
                    {new Date(documentoToDelete.fechaCarga).toLocaleDateString(
                      "es-ES",
                      {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ mt: 2 }}>
              <BandaAlertaComponent tipo="warning">
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 1,
                    py: 0.5,
                  }}
                >
                  <Icon className="c-alerta" sx={{ fontSize: 20 }} />
                  <Typography variant="body2" fontWeight="medium">
                    Esta acción no se puede deshacer
                  </Typography>
                </Box>
              </BandaAlertaComponent>
            </Box>
          </Box>
        }
      />
    </Box>
  );
};

DocumentosReg.propTypes = {
  coordinacion: PropTypes.object.isRequired,
};

export default DocumentosReg;
