// Superficie usada por otros features/app
export {
  fetchEtiquetasEmbarques,
  type GenerarEtiquetasPayload,
  type ListaEtiquetasEmbarques,
} from "./api/etiquetas-emb";
export { AsignacionCtsPage } from "./components/asignacion-cts/asignacion-cts-page";
export { EmbarqueProvider } from "./components/context";
export { DetalleCtsPage } from "./components/cts-detalle/detalle-cts-page";
export { default as EtiquetasClientEmbarque } from "./components/etiquetas/etiquetas-client";
export { InfoCoordinacion } from "./components/info-coordinacion/info-coordinacion";
export { LoaderInicial } from "./components/loader-inicial";
export { default as SeleccionarCopiasModal } from "./components/modales/seleccionar-copias-modal";
export { SeleccionarDestinoModal } from "./components/modales/seleccionar-destino/seleccionar-destino-modal";
export { ClientCtsPage } from "./components/pages/client-cts-page";
export { ClientGestionEmbarquesPage } from "./components/pages/client-gestion-embarques-page";
export { PublicCtsPage } from "./components/public/public-cts-page";
export { CargasSection } from "./components/secciones/cargas";
export { CcaSection } from "./components/secciones/cca";
export { ConsignatarioSection } from "./components/secciones/consignatario";
export { DetallesSection } from "./components/secciones/detalles";
export { DocumentosSection } from "./components/secciones/documentos";
export { FacturacionSection } from "./components/secciones/facturacion";
export { FechasSection } from "./components/secciones/fechas";
export { GastosSection } from "./components/secciones/gastos";
export { RutasSection } from "./components/secciones/rutas";
export { ShipperSection } from "./components/secciones/shipper";
export { StepperNav } from "./components/stepper";
export { DETALLE_EMBARQUE_STEPS, useDetalleEmbarque } from "./hooks/use-detalle-embarque";
export { useGenerarEtiquetasPdf } from "./hooks/use-generar-etiquetas-pdf";
export { default as generarIataPdf } from "./lib/pdf-generator-embarques";
