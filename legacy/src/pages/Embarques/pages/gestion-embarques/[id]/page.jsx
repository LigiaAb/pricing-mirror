import { useState, useCallback, useMemo } from "react";
import SeleccionarCopiasModal from "../../../../../components/bpm/coordinaciones/modals/SeleccionarCopiasModal";
import LoaderComponent from "../../../../../components/Loader/LoaderComponent";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Icon,
    CircularProgress,
} from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { FileDigit, TrendingUpDown } from "lucide-react";
import StepperNav from "../../../components/StepperNav";
import { useParams, useNavigate } from "react-router-dom";
import { decryptId } from "../../../../../api/encryptDecrypt";
import {
    useCoordinacionData,
    useCoordinacionCargas,
    useFetchTipos,
    useFetchIncoterms,
    useListarCoordinacionGastos,
    useObtenerUltimaVersionCoordinacionGastos,
    useFetchGuiasCoordinacion
} from "../../../../../hooks/Bpm";
import { useInformacionPdf } from "../../../hooks/useInformacionPdf";
import SeleccionarDestinoModal, { DEFAULT_DESTINO_OPTIONS } from "../../../components/SeleccionarDestino";
import {
    ShipperSection,
    ConsignatarioSection,
    NotificacionesSection,
    CargasSection,
    FacturacionSection,
    DetallesSection,
    GastosSection,
    RutasSection,
    FechasSection,
    DocumentosSection,
    CCASection,
    // SeguimientoSection
} from "../../../components";
import { InfoCoordinacion } from "@/pages/Embarques/components";

const steps = ["Shipper", "Consignatario", "Notificaciones", "Producto", "Facturacion", "Detalles", "Gastos", "Documentos", "Rutas", "Fechas", "CCA"];

const getPdfButtonLabel = (isGeneratingPdf, correlativoGuiaMaster) => {
    if (isGeneratingPdf) return "Generando PDF...";
    return correlativoGuiaMaster ? "Descargar PDF" : "Descargar Draft House";
};

const Page = () => {
    const { id: encryptedId } = useParams();
    const id = encryptedId ? decryptId(encryptedId) : null;
    const navigate = useNavigate();
    const [estado, setEstado] = useState(0);
    const handleTabChange = useCallback((newEstado) => {
        setEstado(newEstado);
    }, []);
    const [stepValidity, setStepValidity] = useState(() => {
        const obj = {};
        steps.forEach((label, idx) => {
            // CCA y Fechas no bloquean el flujo en esta versión
            obj[idx] = idx === steps.length - 1 || label === "Fechas" ? true : null;
        });
        return obj;
    });

    const [sectionLoading, setSectionLoading] = useState({ 0: true, 1: true, 8: true });
    const [facturacionValues, setFacturacionValues] = useState({ cliente: {}, detalles: {} });
    const handleFacturacionValuesChange = useCallback((partial) => {
        setFacturacionValues((prev) => ({ ...prev, ...partial }));
    }, []);
    const [notificacionesValues, setNotificacionesValues] = useState({});
    const [destinoSeleccionado, setDestinoSeleccionado] = useState(false);
    const handleDestinoExitoso = useCallback(() => {
        setDestinoSeleccionado(true);
    }, []);
    const [entidadesValues, setEntidadesValues] = useState({});
    const handleShipperValuesChange = useCallback((vals) => {
        setEntidadesValues((prev) => ({ ...prev, shipper: vals }));
    }, []);
    const handleConsignatarioValuesChange = useCallback((vals) => {
        setEntidadesValues((prev) => ({ ...prev, consignatario: vals }));
    }, []);
    const { data: embarqueData, isLoading: isLoadingEmbarque } = useCoordinacionData(id);
    const { data: cargas = [], isLoading: isLoadingCargas } = useCoordinacionCargas(id);
    const codFile = (cargas.length > 0 ? cargas[0].codFile : "") || embarqueData?.cod_file || embarqueData?.COD_FILE || embarqueData?.codFile || "";
    const { data: ultimaVersionData, isSuccess: isVersionLoaded } = useObtenerUltimaVersionCoordinacionGastos(id || null);
    const embarqueVersion = ultimaVersionData?.embarque_version ?? null;
    const { data: gastos = [] } = useListarCoordinacionGastos({ embarque_id: id, embarque_version: embarqueVersion, enabled: !!id && isVersionLoaded });
    const { data: tiposPagoCatalog = [], isLoading: isLoadingTiposPago } = useFetchTipos({ tipo_tabla: 'PAGO' });
    const { data: incotermsCatalog = [], isLoading: isLoadingIncoterms } = useFetchIncoterms();
    const { data: tiposCargaCatalog = [], isLoading: isLoadingTiposCarga } = useFetchTipos({ tipo_tabla: 'TIPO_CARGA' });
    const { data: guiasData = [], isLoading: isLoadingGuias } = useFetchGuiasCoordinacion(
        { embarque_id: Number(id) },
        { enabled: !!id }
    );
    const correlativoGuia = guiasData.length > 0 ? guiasData[0].correlativoGuia || "" : "";
    const correlativoGuiaMaster = guiasData.length > 0 ? guiasData[0].correlativoGuiaMaster || "" : "";
    // Determinar si se debe mostrar la sección de documentos CROPA:
    // solo si algún gasto de la coordinación tiene cod_rubro = 127.
    // Mismo criterio que la vista pública (src/pages/Embarques/public/page.jsx),
    // pero aquí los gastos provienen de `listar-coordinacion-gastos` sin mapeo
    // (las claves ya vienen en minúsculas por el interceptor de api.js), de
    // ahí el uso de `cod_rubro` en vez de `codRubro`.
    const showCropaDocs = useMemo(() => {
        return gastos.some((g) => Number(g.cod_rubro) === 127);
    }, [gastos]);
    const allStepsValid = Object.values(stepValidity).every(
        (value) => value === true || value === "valid" || value === "pending",
    );
    // Una sección reporta null mientras no ha disparado onValidityChange (está cargando).
    const allSectionsInitialized = Object.values(stepValidity).every(v => v !== null);

    const embarqueDataForPdf = {
        ...embarqueData,
        correlativoGuia,
        correlativoGuiaMaster,
    };

    const { isGeneratingPdf, handleDownloadPdf, isLoadingPdfGastos } = useInformacionPdf(
        embarqueDataForPdf,
        cargas,
        incotermsCatalog,
        tiposPagoCatalog,
        tiposCargaCatalog,
        !allStepsValid,
        facturacionValues,
        null,
        notificacionesValues,
        false,        // usePdfInformacionEmbarque: usa pdfGeneratorEmbarques (NO el de CTS)
        entidadesValues
    );
    const isLoadingPdfData =
        isLoadingEmbarque || isLoadingCargas ||
        isLoadingIncoterms || isLoadingTiposPago || isLoadingTiposCarga || isLoadingGuias || isLoadingPdfGastos;
    const [isSeleccionarDestinoOpen, setIsSeleccionarDestinoOpen] = useState(false);
    const [isAsignarMasterOpen, setIsAsignarMasterOpen] = useState(false);
    const [isCopiasModalOpen, setIsCopiasModalOpen] = useState(false);

    const handleOpenCopiasModal = useCallback(() => {
        setIsCopiasModalOpen(true);
    }, []);

    const handleGeneratePdfConCopias = useCallback((copias) => {
        setIsCopiasModalOpen(false);
        handleDownloadPdf({ copias });
    }, [handleDownloadPdf]);

    const servicioNombre = String(
        embarqueData?.servicio ??
        embarqueData?.servicio_nombre ??
        embarqueData?.SERVICIO_NOMBRE ??
        ""
    ).trim().toUpperCase();

    const opcionesDestino = (() => {
        if (servicioNombre === "COURIER") {
            return DEFAULT_DESTINO_OPTIONS.filter((opcion) => opcion.id === "bodega");
        }
        if (servicioNombre === "CONSOLIDADO" || servicioNombre === "DIRECTO") {
            return DEFAULT_DESTINO_OPTIONS.filter((opcion) => opcion.id !== "bodega");
        }
        return DEFAULT_DESTINO_OPTIONS;
    })();

    const handleValidityChange = useCallback((stepIndex, isValid) => {
        setStepValidity((prev) => {
            if (prev[stepIndex] === isValid) return prev;
            return { ...prev, [stepIndex]: isValid };
        });
    }, []);

    const getValidityHandler = useCallback(
        (index) => (isValid) => {
            handleValidityChange(index, isValid);
        },
        [handleValidityChange],
    );

    const getLoadingHandler = useCallback(
        (index) => (isLoading) => {
            setSectionLoading((prev) => {
                if (prev[index] === isLoading) return prev;
                return { ...prev, [index]: isLoading };
            });
        },
        [],
    );

    const opciones = steps.map((label, idx) => {
        let contentComponent;

        switch (idx) {
            case 0:
                contentComponent = (
                    <ShipperSection
                        embarque_id={Number(id)}
                        onValidityChange={getValidityHandler(0)}
                        onValuesChange={handleShipperValuesChange}
                        onLoadingChange={getLoadingHandler(0)}
                    />
                );
                break;
            case 1:
                contentComponent = (
                    <ConsignatarioSection
                        embarque_id={Number(id)}
                        onValidityChange={getValidityHandler(1)}
                        onValuesChange={handleConsignatarioValuesChange}
                        onLoadingChange={getLoadingHandler(1)}
                    />
                );
                break;
            case 2:
                contentComponent = (
                    <NotificacionesSection
                        embarque_id={Number(id)}
                        onValidityChange={getValidityHandler(2)}
                        onValuesChange={setNotificacionesValues}
                    />
                );
                break;
            case 3:
                contentComponent = (
                    <CargasSection
                        embarqueId={Number(id)}
                        onValidityChange={getValidityHandler(3)}
                        onLoadingChange={getLoadingHandler(3)}
                    />
                );
                break;
            case 4:
                contentComponent = (
                    <FacturacionSection
                        embarque_id={Number(id)}
                        onValidityChange={getValidityHandler(4)}
                        onValuesChange={handleFacturacionValuesChange}
                    />
                );
                break;
            case 5:
                contentComponent = (
                    <DetallesSection
                        embarque_id={Number(id)}
                        onValidityChange={getValidityHandler(5)}
                        onValuesChange={handleFacturacionValuesChange}
                        showCropaDocs={showCropaDocs}
                    />
                );
                break;
            case 6:
                contentComponent = (
                    <GastosSection
                        embarqueId={id}
                        onValidityChange={getValidityHandler(6)}
                    />
                );
                break;
            case 7:
                contentComponent = (
                    <DocumentosSection
                        embarque_id={id}
                        cod_file={codFile}
                        onValidityChange={getValidityHandler(7)}
                        onLoadingChange={getLoadingHandler(7)}
                    />
                );
                break;
            case 8:
                contentComponent = (
                    <RutasSection
                        embarque_id={Number(id)}
                        onValidityChange={getValidityHandler(8)}
                        onLoadingChange={getLoadingHandler(8)}
                    />
                );
                break;
            case 9:
                contentComponent = (
                    <FechasSection
                        embarque_id={Number(id)}
                    />
                );
                break;
            case 10:
                contentComponent = (
                    <CCASection
                        embarque_id={Number(id)}
                        correlativoGuia={correlativoGuia}
                        cargas={cargas}
                        gastos={gastos}
                    />
                );
                break;
            default:
                contentComponent = (
                    <>
                        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                            {label}
                        </Typography>
                        <Typography>
                            Contenido del paso {idx + 1}: {label}
                        </Typography>
                    </>
                );
        }

        return {
            id: idx,
            label,
            // No pasar content a TabComponent; se renderiza manualmente abajo
            content: null,
            _realContent: contentComponent,
        };
    });

    return (
        <Box sx={{ p: { xs: 1, md: 2 }, width: "100%", maxWidth: "100%", minWidth: 0, position: "relative" }}>
            <LoaderComponent open={isLoadingPdfData || Object.values(sectionLoading).some(Boolean)} sx={{ position: "fixed" }} />
            <Card sx={{ mb: 2, width: "100%", minWidth: 0, overflow: "hidden" }}>
                <CardContent sx={{ minWidth: 0 }}>
                    {/* información de la coordinación (mostrada debajo de los botones) */}
                    <InfoCoordinacion
                        cargas={cargas}
                        isLoading={isLoadingEmbarque || isLoadingCargas}
                        coordinacion={{ ...embarqueData, correlativoGuia, correlativoGuiaMaster }}
                        showObservaciones={false}
                    />
                </CardContent>
            </Card>

            <Box
                sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    bgcolor: "background.default",
                    pt: { xs: 1, md: 2 },
                    mt: { xs: -1, md: -2 },
                }}
            >
                <Card sx={{ mb: 2, width: "100%", minWidth: 0, overflow: "hidden" }}>
                    <CardContent sx={{ minWidth: 0 }}>
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: { xs: "column", md: "row" },
                                gap: 1,
                                justifyContent: "space-between",
                                alignItems: { xs: "stretch", md: "center" },
                                flexWrap: "wrap",
                            }}
                        >
                            <Button
                                variant="outlined"
                                size="small"
                                sx={{ width: { xs: "100%", md: "auto" } }}
                                startIcon={<Icon className="c-izquierda" />}
                                onClick={() => navigate(-1)}
                            >
                                Regresar
                            </Button>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: { xs: "column", sm: "row" },
                                    gap: 1,
                                    justifyContent: "center",
                                    flexWrap: "wrap",
                                    flexGrow: 1,
                                }}
                            >
                                <Tooltip title={correlativoGuiaMaster ? "" : "Draft de House, ya que aun no tiene asignado una Master"} slotProps={{ tooltip: { sx: { fontSize: '0.875rem' } } }}>
                                    <Box component="span" sx={{ display: "inline-block", width: { xs: "100%", sm: "auto" } }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            fullWidth
                                            sx={{ width: { xs: "100%", sm: "auto" } }}
                                            startIcon={
                                                isGeneratingPdf || isLoadingPdfData || !allSectionsInitialized ? (
                                                    <CircularProgress size={18} color="inherit" />
                                                ) : (
                                                    <Icon className="c-pdf" />
                                                )
                                            }
                                            onClick={handleOpenCopiasModal}
                                            disabled={isGeneratingPdf || isLoadingPdfData || !allSectionsInitialized}
                                        >
                                            {getPdfButtonLabel(isGeneratingPdf, correlativoGuiaMaster)}
                                        </Button>
                                    </Box>
                                </Tooltip>
                                {correlativoGuiaMaster ? (
                                    <Tooltip title={allStepsValid ? "" : "Complete todos los datos obligatorios en todas las secciones para continuar"}>
                                        <Box component="span" sx={{ display: "inline-block", width: { xs: "100%", sm: "auto" } }}>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                color="primary"
                                                fullWidth
                                                sx={{ width: { xs: "100%", sm: "auto" } }}
                                                startIcon={<TrendingUpDown size={16} />}
                                                onClick={() => setIsSeleccionarDestinoOpen(true)}
                                                disabled={!allStepsValid || isGeneratingPdf || isLoadingPdfData || !allSectionsInitialized || destinoSeleccionado}
                                            >
                                                Seleccionar destino
                                            </Button>
                                        </Box>
                                    </Tooltip>
                                ) : (
                                    <Button
                                        variant="contained"
                                        size="small"
                                        fullWidth
                                        startIcon={<FileDigit size={16} />}
                                        onClick={() => setIsAsignarMasterOpen(true)}
                                        disabled={!allStepsValid || isGeneratingPdf || isLoadingPdfData || !allSectionsInitialized}
                                        sx={{ width: { xs: "100%", sm: "auto" }, bgcolor: '#1e3a5f', color: '#fff', '&:hover': { bgcolor: '#152d4a' } }}
                                    >
                                        Asignar Master
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                <Card sx={{ mb: 2, width: "100%", minWidth: 0, overflow: "hidden" }}>
                    <CardContent sx={{ minWidth: 0 }}>
                        <StepperNav
                            steps={steps}
                            activeStep={estado}
                            stepValidity={stepValidity}
                            onStepClick={handleTabChange}
                        />
                    </CardContent>
                </Card>
            </Box>

            <Card sx={{ mb: 2, width: "100%", minWidth: 0, overflow: "hidden" }}>
                <CardContent sx={{ minWidth: 0 }}>
                    {/* Renderizar todas las secciones para que la validación corra siempre */}
                    {opciones.map((opcion, idx) => (
                        <Box
                            key={opcion.id}
                            sx={{
                                p: { xs: 1, md: 2 },
                                display: estado === idx ? "block" : "none",
                                width: "100%",
                            }}
                        >
                            {opcion._realContent}
                        </Box>
                    ))}
                </CardContent>
            </Card>

            <SeleccionarCopiasModal
                open={isCopiasModalOpen}
                onClose={() => setIsCopiasModalOpen(false)}
                onGenerate={handleGeneratePdfConCopias}
                isGenerating={isGeneratingPdf}
            />

            <SeleccionarDestinoModal
                open={isSeleccionarDestinoOpen}
                onClose={() => setIsSeleccionarDestinoOpen(false)}
                options={opcionesDestino}
                currentFile={embarqueData?.cod_file || ""}
                servicioNombre={servicioNombre}
                embarqueId={id}
                codFile={embarqueData?.cod_file || ''}
                navigate={navigate}
                existingGuia={
                    servicioNombre === 'CONSOLIDADO' || servicioNombre === 'DIRECTO'
                        ? correlativoGuiaMaster
                        : correlativoGuia
                }
                onSuccess={handleDestinoExitoso}
                modo="seleccionar_destino"
            />

            <SeleccionarDestinoModal
                open={isAsignarMasterOpen}
                onClose={() => setIsAsignarMasterOpen(false)}
                options={opcionesDestino}
                currentFile={embarqueData?.cod_file || ""}
                servicioNombre={servicioNombre}
                embarqueId={id}
                codFile={embarqueData?.cod_file || ''}
                navigate={navigate}
                existingGuia={
                    servicioNombre === 'CONSOLIDADO' || servicioNombre === 'DIRECTO'
                        ? correlativoGuiaMaster
                        : correlativoGuia
                }
                onSuccess={() => setIsAsignarMasterOpen(false)}
                modo="asignar_master"
            />
        </Box>
    );
};

Page.propTypes = {};
export default Page;