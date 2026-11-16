import { asText, safeString } from "@/shared/lib/text";

const buildFieldConfig = (
  hasCorr: boolean,
  hasOrig: boolean,
  corrValue: string | undefined,
  origValue: string | undefined,
  suffix: "Prepaid" | "Collect",
  isSwap: boolean,
) => ({ hasCorr, hasOrig, corrValue, origValue, suffix, isSwap });

const fmt = (value: unknown) => (value !== "" && value !== undefined ? safeString(value) : "");
const hasValue = (value: unknown) => value !== "" && value !== undefined;

function applyFieldCorrection(
  result: Record<string, string | boolean>,
  field: ReturnType<typeof buildFieldConfig>,
) {
  if (!field.hasCorr) return;
  result[`correcto${field.suffix}`] = fmt(field.corrValue);
  result[`correcto${field.suffix}Bold`] = true;
  if (field.hasOrig && !field.isSwap) {
    result[`incorrecto${field.suffix}`] = fmt(field.origValue);
  }
}

function resolveFieldPair(
  origPrepaid: string | undefined,
  origCollect: string | undefined,
  corrPrepaid: string | undefined,
  corrCollect: string | undefined,
) {
  const hasOrigPrepaid = hasValue(origPrepaid);
  const hasOrigCollect = hasValue(origCollect);
  const hasCorrPrepaid = hasValue(corrPrepaid);
  const hasCorrCollect = hasValue(corrCollect);

  const isSwapToPrepaid = hasCorrPrepaid && !hasCorrCollect && hasOrigCollect && !hasOrigPrepaid;
  const isSwapToCollect = hasCorrCollect && !hasCorrPrepaid && hasOrigPrepaid && !hasOrigCollect;

  if (!hasCorrPrepaid && !hasCorrCollect) {
    return {
      correctoPrepaid: hasOrigPrepaid ? fmt(origPrepaid) : "",
      correctoPrepaidBold: false,
      incorrectoPrepaid: "",
      correctoCollect: hasOrigCollect ? fmt(origCollect) : "",
      correctoCollectBold: false,
      incorrectoCollect: "",
    };
  }

  const result: Record<string, string | boolean> = {
    correctoPrepaid: "",
    correctoPrepaidBold: false,
    incorrectoPrepaid: "",
    correctoCollect: "",
    correctoCollectBold: false,
    incorrectoCollect: "",
  };

  const prepaidField = buildFieldConfig(
    hasCorrPrepaid,
    hasOrigPrepaid,
    corrPrepaid,
    origPrepaid,
    "Prepaid",
    isSwapToPrepaid,
  );
  const collectField = buildFieldConfig(
    hasCorrCollect,
    hasOrigCollect,
    corrCollect,
    origCollect,
    "Collect",
    isSwapToCollect,
  );

  applyFieldCorrection(result, prepaidField);
  applyFieldCorrection(result, collectField);

  if (isSwapToPrepaid) {
    result.incorrectoCollect = fmt(origCollect);
  }
  if (isSwapToCollect) {
    result.incorrectoPrepaid = fmt(origPrepaid);
  }

  return result;
}

function resolveField(origValue: string, corrValue: string) {
  const hasOrigValue = hasValue(origValue);
  const hasCorrValue = hasValue(corrValue);

  const result = { correcto: "", incorrecto: "", bold: false };

  if (!hasCorrValue) {
    if (hasOrigValue) result.correcto = fmt(origValue);
    return result;
  }

  result.correcto = fmt(corrValue);
  result.bold = true;
  if (hasOrigValue) result.incorrecto = fmt(origValue);
  return result;
}

const pdfFields = [
  { id: "tarifa", pdfKey: "Tarifa" },
  { id: "flete", pdfKey: "Flete" },
  { id: "iva", pdfKey: "IVA" },
  { id: "dueAgent", pdfKey: "DueAgent" },
  { id: "dueCarrier", pdfKey: "DueCarrier" },
];

export function buildCcaPdfData(params: {
  today: string;
  correlativoGuia: string;
  embarqueData: Record<string, unknown> | null | undefined;
  originalValues: Record<string, unknown>;
  correctionValues: Record<string, unknown>;
}): Record<string, unknown> {
  const { today, correlativoGuia, embarqueData, originalValues, correctionValues } = params;

  const sharedCorrection = (correctionValues.shared as Record<string, string>) || {};
  const op = (originalValues.prepaid as Record<string, string>) || {};
  const oc = (originalValues.collect as Record<string, string>) || {};
  const cp = (correctionValues.prepaid as Record<string, string>) || {};
  const cc = (correctionValues.collect as Record<string, string>) || {};

  const raw = embarqueData;

  const pdfData: Record<string, unknown> = {
    fecha: today,
    noReferencia: correlativoGuia || raw?.embarqueId || "",
    destinatario: raw?.consignatario || "",
    atencion: "",
    awb:
      raw?.correlativoGuiaMaster ||
      raw?.correlativo_guia_master ||
      raw?.mawbNumber ||
      raw?.guiaMaster ||
      raw?.correlativoGuia ||
      raw?.guia_master ||
      "",
    origen: raw?.paisOrigen || raw?.origen || "",
    destino: raw?.paisDestino || raw?.destino || "",
    fechaEmision: today,
    remitente: raw?.shipper || raw?.remitente || "",
    consignatario: raw?.entidadConsignatarioNombre || raw?.consignatario || "",
  };

  const bultos = resolveField(asText(originalValues.bultos), sharedCorrection.bultos ?? "");
  pdfData.correctosNoBultos = bultos.correcto;
  pdfData.correctosNoBultosBold = bultos.bold;
  pdfData.incorrectosNoBultos = bultos.incorrecto;

  const peso = resolveField(asText(originalValues.peso), sharedCorrection.peso ?? "");
  pdfData.correctosPesoKilos = peso.correcto;
  pdfData.correctosPesoKilosBold = peso.bold;
  pdfData.incorrectosPesoKilos = peso.incorrecto;

  for (const { id, pdfKey } of pdfFields) {
    const pair = resolveFieldPair(op[id], oc[id], cp[id], cc[id]);
    pdfData[`correctos${pdfKey}Prepaid`] = pair.correctoPrepaid;
    pdfData[`correctos${pdfKey}PrepaidBold`] = pair.correctoPrepaidBold;
    pdfData[`incorrectos${pdfKey}Prepaid`] = pair.incorrectoPrepaid;
    pdfData[`correctos${pdfKey}Collect`] = pair.correctoCollect;
    pdfData[`correctos${pdfKey}CollectBold`] = pair.correctoCollectBold;
    pdfData[`incorrectos${pdfKey}Collect`] = pair.incorrectoCollect;
  }

  return pdfData;
}
