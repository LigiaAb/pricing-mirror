export const MAX_BARCODE_LENGTH = 18;

interface Ruta {
  origenNombre?: string;
  destinoCodigo?: string;
  destinoNombre?: string;
  entidadNombreProv?: string;
  flightNumber?: string;
}

export interface GastoPdf {
  isDueAgent?: boolean;
  isDueCarrier?: boolean;
  siglas?: string;
  venta?: string | number;
  tipoPago?: string;
}

interface Item {
  descripcion?: string;
  natureOfGoods?: string;
  dimensiones?: string;
  noPieces?: string | number;
  pieces?: string | number;
  volumen?: string | number;
  grossWeight?: string | number;
  chargeableWeight?: string | number;
  total?: string | number;
  /** Unidad de medida de la carga (§7.D.4); dato del payload, no se imprime en el AWB. */
  pesoUnidad?: string;
}

export interface DatosPdf {
  horizontal?: boolean;
  tamano?: string;
  mawbNumber?: string;
  guiaMaster?: string;
  correlativoGuiaMaster?: string;
  correlativoGuia?: string;
  hawbNumber?: string;
  guiaHouse?: string;
  hideAirwayBillGuias?: boolean;
  shipperName?: string;
  shipperAddress?: string;
  shipperPhone?: string;
  shipperEmail?: string;
  consigneeName?: string;
  consigneeAddress?: string;
  consigneePhone?: string;
  consigneeAccount?: string;
  agentNameCity?: string;
  agentIATACode?: string;
  agentAccount?: string;
  airportDepartureRouting?: string;
  requestedRouting?: string;
  routing?: string;
  ruta?: string;
  rutaSolicitada?: string;
  ruta_solicitada?: string;
  sitioRecoleccion?: string;
  currency?: string;
  rutas?: Ruta[];
  enlaceOrigen?: string;
  enlaceDestino?: string;
  ciudadDestino?: string;
  airportDestination?: string;
  handlingInformation?: string;
  observaciones?: string;
  observacion?: string;
  accountingInformation?: string;
  referenceNumber?: string;
  optionalShippingInfo?: string;
  incoterm?: string | { label?: string; value?: string };
  declaredValueCarriage?: string | number;
  declaredValueCustoms?: string | number;
  chgsPPD?: boolean | string;
  chgsCOLL?: boolean | string;
  wtValPPD?: boolean | string;
  wtValCOLL?: boolean | string;
  afRateCosto?: string | number;
  afTipoPagoCodigo?: string | number;
  valuationCharge?: string | number;
  tax?: string | number;
  taxTipoPago?: string;
  totalPrepaid?: string | number;
  totalCollect?: string | number;
  totalCollectCharges?: string | number;
  otherCharges?: string;
  gastosParaPdf?: GastoPdf[];
  items?: Item[];
  executedOnDate?: string | Date;
  executedAtPlace?: string;
  signature?: string;
  copias?: string[];
  /** Modo de transporte como dato del payload (el generador unificado no despacha por él). */
  transportMode?: "aereo" | "maritimo" | "terrestre";
}
