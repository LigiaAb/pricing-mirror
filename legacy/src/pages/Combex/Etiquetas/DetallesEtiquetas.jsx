import { useState } from "react";
import { Box, Button, Icon, Typography, CircularProgress } from "@mui/material";
import TarjetaCoordinaciones from "../components/tarjetaCoordinacion";
import PropTypes from "prop-types";
import CargasTabla from "../components/cargasTabla";
import PdfEtiqueta from "../../Embarques/pdfEtiqueta";
import { encryptId } from "../../../api/encryptDecrypt";
import ActionAlertComponent from "../../../components/Dialog/ActionAlertComponent";
import { useCoordinacionCargas, useFetchTipos, useFetchEntidades, useUpdateCoordinacionEstado, useFetchPaises, useFetchGuiasCoordinacion } from "../../../hooks/Bpm";
import { useQueryClient } from "@tanstack/react-query";

function ManifiestoDetalles({ coordinacion, onVolver }) {
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [errorPDF, setErrorPDF] = useState(null);

  const { data: cargasData, isLoading: cargasLoading, refetch: refetchCargas } = useCoordinacionCargas(
    coordinacion?.embarqueId
  );
  const { data: tiposData } = useFetchTipos(
    { cod_tipo: coordinacion?.tipoPago },
    { enabled: !!coordinacion?.tipoPago }
  );

  // Obtener dirección del Shipper
  const { data: shipperData } = useFetchEntidades(
    { entidad_id: coordinacion?.entidadIdShipper, tipo_entidad: 'shipper' },
    { enabled: !!coordinacion?.entidadIdShipper }
  );

  // Obtener dirección del Consignee
  const { data: consigneeData } = useFetchEntidades(
    { entidad_id: coordinacion?.entidadIdConsignatario, tipo_entidad: 'consignatario' },
    { enabled: !!coordinacion?.entidadIdConsignatario }
  );

  // Obtener correlativo de la Guía para esta coordinación
  const { data: guiasData = [] } = useFetchGuiasCoordinacion(
    { embarqueId: coordinacion?.embarqueId },
    { enabled: !!coordinacion?.embarqueId }
  );

  const correlativoGuia = guiasData && guiasData.length > 0 ? guiasData[0].correlativoGuia || "" : "";
  const correlativoGuiaMaster = guiasData && guiasData.length > 0 ? guiasData[0].correlativoGuiaMaster || "" : "";

  // Obtener ref_pais para origen y destino
  const { data: paisesOrigenData = [] } = useFetchPaises(
    coordinacion?.cod_pais_origen ? { cod_pais: coordinacion.cod_pais_origen } : {}
  );
  const { data: paisesDestinoData = [] } = useFetchPaises(
    coordinacion?.cod_pais_destino ? { cod_pais: coordinacion.cod_pais_destino } : {}
  );

  const refPaisOrigen = paisesOrigenData.length > 0 ? paisesOrigenData[0].ref_pais || "" : "";
  const refPaisDestino = paisesDestinoData.length > 0 ? paisesDestinoData[0].ref_pais || "" : "";

  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const { mutateAsync: updateEstado } = useUpdateCoordinacionEstado();
  const queryClient = useQueryClient();

  const getFirstAddress = (data) => {
    if (!Array.isArray(data) || data.length === 0) return "";
    const item = data[0] || {};
    return `${item.nombre_ciudad || ""}, ${item.nombre_pais || ""}`.trim();
  };

  const getTypeName = (types) => (Array.isArray(types) && types.length > 0 ? types[0].nomTipo : "");

  const fmtNumber = (val) => {
    if (val === null || val === undefined || val === "") return "";
    const num = Number(String(val).replaceAll(",", ""));
    if (Number.isNaN(num)) return String(val);
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const buildRegistros = (cargasArray) =>
    (cargasArray ?? []).map((it) => {
      const bultos = it.bultos ?? "";
      const descripcion = it.descripcionCarga ?? "";
      const repeso = it.repeso ?? null;
      const pesoOriginal = it.peso ?? null;
      const pesoRaw = repeso != null && repeso !== "" ? repeso : (pesoOriginal ?? "");
      const peso = fmtNumber(pesoRaw);
      const parsedBultos = Number(String(bultos).replaceAll(",", ""));
      const numeroPiezas = Number.isFinite(parsedBultos) && parsedBultos > 0 ? Math.trunc(parsedBultos) : 1;

      return {
        numeroPiezas,
        bultos,
        descripcion,
        peso,
      };
    });

  const openPdfString = (pdfString) => {
    if (!pdfString || typeof pdfString !== "string") return;

    if (pdfString.startsWith("data:")) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.open();
        newWindow.document.write(
          `<iframe src="${pdfString}" frameborder="0" style="border:0; width:100%; height:100%;" allowfullscreen></iframe>`
        );
        newWindow.document.close();
        newWindow.document.title = "Etiquetas";
      } else {
        window.open(pdfString, "_blank");
      }
      return;
    }

    try {
      const base64 = pdfString.split(",")[1] || pdfString;
      const binary = atob(base64);
      const len = binary.length;
      const buffer = new Uint8Array(len);
      for (let i = 0; i < len; i += 1) buffer[i] = binary.charCodeAt(i);
      const blob = new Blob([buffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
    } catch (err) {
      console.error("No se pudo abrir el PDF generado:", err);
      setErrorPDF("Error al generar PDF");
    }
  };

  const handleGenerarManifiesto = async () => {
    setLoadingPDF(true);
    setErrorPDF(null);

    try {
      const cargasArray = cargasData ?? [];
      const nomTipo = getTypeName(tiposData);
      const shipperDireccion = getFirstAddress(shipperData);
      const consigneeDireccion = getFirstAddress(consigneeData);

      const encabezado = {
        paisOrigen: coordinacion.paisOrigen,
        paisDestino: coordinacion.paisDestino,
        shipper: coordinacion.entidadShipperNombre,
        shipperDireccion,
        consignatario: coordinacion.entidadConsignatarioNombre,
        consignatarioDireccion: consigneeDireccion,
        observaciones: coordinacion.observaciones,
        nomTipo,
        horizontal: false,
        format: "letter",
      };

      const registros = buildRegistros(cargasArray);

      const pdfData = {
        ...encabezado,
        codGuia: correlativoGuia || "",
        codGuiaMaster: correlativoGuiaMaster || "",
        origen: coordinacion.paisOrigen || encabezado.paisOrigen,
        destino: coordinacion.paisDestino || encabezado.paisDestino,
        refPaisOrigen: refPaisOrigen || "",
        refPaisDestino: refPaisDestino || "",
        tipoTrasnporte: coordinacion.tipoTransporte || coordinacion.tipoTrasnporte || null,
        codOrigen: coordinacion.codOrigen || "",
        codDestino: coordinacion.codDestino || "",
        shipperNombre: encabezado.shipper || "",
        shipperDireccion: encabezado.shipperDireccion || "",
        consignedNombre: encabezado.consignatario || "",
        consignedDireccion: encabezado.consignatarioDireccion || "",
        qrUrl: `${window.location.origin}/embarques/embarques/gestion-embarques/${encryptId(coordinacion?.embarqueId)}`,
      };

      const pdfString = await PdfEtiqueta(pdfData, registros);
      openPdfString(pdfString);
    } catch (err) {
      console.error("Error al generar PDF:", err);
    } finally {
      setLoadingPDF(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Button
          variant="outlined"
          startIcon={<Icon className="c-derecha-abajo-izquierda" />}
          onClick={onVolver}
          size="small"
          sx={{
            borderColor: "info.light",
            color: "info.light",
            "&:hover": {
              bgcolor: "info.light",
              color: "background.paper",
            },
          }}
        >
          Regresar
        </Button>
        <Typography
          variant="h5"
          sx={{ color: "text.primary", fontWeight: 600 }}
        >
          Guía: {correlativoGuia || "-"}
        </Typography>
        <Box sx={{ width: 48 }} />
      </Box>
      <TarjetaCoordinaciones coordinacion={coordinacion} />
      <Box sx={{ width: "90%", mx: "auto", mb: 2 }}>
        <CargasTabla
          cargasData={cargasData}
          isLoading={cargasLoading}
          error={null}
          useVer={false}
          useCheck={false}
          onRefetch={refetchCargas}
        />
      </Box>
      <Box
        sx={{
          mt: 1,
          display: "flex",
          justifyContent: "center",
          flexDirection: "row",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<Icon className="c-pdf" />}
          disabled={
            loadingPDF || (Array.isArray(cargasData) && cargasData.length === 0)
          }
          onClick={handleGenerarManifiesto}
        >
          {loadingPDF ? "Generando..." : "Generar Etiquetas"}
        </Button>
        <Button
          variant="contained"
          color="success"
          size="large"
          startIcon={<Icon className="c-guardar" />}
          disabled={
            loadingPDF || (Array.isArray(cargasData) && cargasData.length === 0)
          }
          onClick={() => setMostrarConfirmar(true)}
        >
          Confirmar Etiquetado
        </Button>
        {loadingPDF && <CircularProgress size={32} sx={{ mt: 2 }} />}
        {errorPDF && (
          <Typography color="error" sx={{ mt: 2 }}>
            {errorPDF}
          </Typography>
        )}
        <ActionAlertComponent
          openDialog={mostrarConfirmar}
          tipo="alert"
          content={"¿Confirma el etiquetado?."}
          onConfirm={async () => {
            try {
              setConfirmLoading(true);
              const embarque_id = coordinacion?.embarqueId ?? coordinacion?.embarque_id;
              const cod_file = coordinacion?.codFile ?? coordinacion?.cod_file;

              // Cambiar estado a 73
              await updateEstado({
                embarque_id,
                cod_file,
                cod_estado_actual: coordinacion?.estadoId ?? coordinacion?.estado_id,
                cod_estado_siguiente: 73,
              });

              // Invalidar queries relacionadas y refetch
              if (embarque_id !== undefined) {
                try {
                  await queryClient.invalidateQueries({ queryKey: ["coordinacion-cargas", embarque_id] });
                  await queryClient.invalidateQueries({ queryKey: ["coordinacion-fecha-mov", { embarque_id }] });
                } catch (err) {
                  console.warn("No se pudieron invalidar queries:", err);
                }
              }

              if (typeof refetchCargas === "function") await refetchCargas();

              // Asegurar que la lista de coordinaciones se invalide antes de regresar
              try {
                await queryClient.invalidateQueries({ queryKey: ["coordinaciones"] });
              } catch (err) {
                console.warn("No se pudo invalidar cache de coordinaciones:", err);
              }

              // Volver a la vista principal
              if (typeof onVolver === "function") onVolver();
            } catch (err) {
              console.error("Error al confirmar etiquetado:", err);
            } finally {
              setConfirmLoading(false);
              setMostrarConfirmar(false);
            }
          }}
          onCancel={() => setMostrarConfirmar(false)}
          textoConfirmar={confirmLoading ? "Procesando..." : "Confirmar"}
        />
      </Box>
    </Box>
  );
}

ManifiestoDetalles.propTypes = {
  coordinacion: PropTypes.object,
  onVolver: PropTypes.func.isRequired,
  onConfirmEtiquetado: PropTypes.func,
};

export default ManifiestoDetalles;

