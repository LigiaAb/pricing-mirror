import {
  firstDefined,
  type GastoRow,
  getRowByPayment,
  numbersEqual,
  PAYMENT_CONFIG,
  roundNumber,
  sumByPayment,
  toDisplayValue,
  toNumberOrNull,
} from "@/features/embarques/components/cca";

export function computePaymentCorrections(
  values: Record<string, unknown>,
  params: {
    originalTarifaRows: GastoRow[];
    draftTarifas: GastoRow[];
    originalDueAgentRows: GastoRow[];
    draftDueAgentRows: GastoRow[];
    originalDueCarrierRows: GastoRow[];
    draftDueCarrierRows: GastoRow[];
  },
) {
  const {
    originalTarifaRows,
    draftTarifas,
    originalDueAgentRows,
    draftDueAgentRows,
    originalDueCarrierRows,
    draftDueCarrierRows,
  } = params;

  for (const { key, codTipo } of PAYMENT_CONFIG) {
    const originalTarifaRow = getRowByPayment(originalTarifaRows, codTipo);
    const draftTarifaRow = getRowByPayment(draftTarifas, codTipo);
    const tarifaUnchanged = numbersEqual(originalTarifaRow?.rateCosto, draftTarifaRow?.rateCosto);

    (values[key] as Record<string, string>).tarifa = tarifaUnchanged
      ? ""
      : toDisplayValue(draftTarifaRow?.rateCosto);

    const originalDueAgentTotal = sumByPayment(originalDueAgentRows, codTipo, "ventaRubro");
    const draftDueAgentTotal = sumByPayment(draftDueAgentRows, codTipo, "ventaRubro");
    const dueAgentUnchanged = numbersEqual(originalDueAgentTotal, draftDueAgentTotal);
    (values[key] as Record<string, string>).dueAgent = dueAgentUnchanged
      ? ""
      : toDisplayValue(draftDueAgentTotal);

    const originalDueCarrierTotal = sumByPayment(originalDueCarrierRows, codTipo, "ventaRubro");
    const draftDueCarrierTotal = sumByPayment(draftDueCarrierRows, codTipo, "ventaRubro");
    const dueCarrierUnchanged = numbersEqual(originalDueCarrierTotal, draftDueCarrierTotal);
    (values[key] as Record<string, string>).dueCarrier = dueCarrierUnchanged
      ? ""
      : toDisplayValue(draftDueCarrierTotal);
  }
}

export function computeFleteAndIva(
  values: Record<string, unknown>,
  effectivePeso: number | null,
  bultosChanged: boolean,
  pesoChanged: boolean,
  params: {
    originalValues: Record<string, unknown>;
    originalIvaRows: GastoRow[];
  },
) {
  const { originalValues, originalIvaRows } = params;

  for (const { key, codTipo } of PAYMENT_CONFIG) {
    const orig = originalValues[key] as Record<string, string>;
    const corr = values[key] as Record<string, string>;

    const originalFlete = toNumberOrNull(orig.flete);
    const hasTarifaCorrection = corr.tarifa !== "";
    const effectiveTarifa = hasTarifaCorrection
      ? toNumberOrNull(corr.tarifa)
      : toNumberOrNull(orig.tarifa);
    const shouldComputeFlete = bultosChanged || pesoChanged || hasTarifaCorrection;
    const computedFlete =
      effectiveTarifa === null || effectivePeso === null
        ? null
        : roundNumber(effectivePeso * effectiveTarifa);
    const fleteUnchanged = numbersEqual(originalFlete, computedFlete);
    const hasFleteCorrection = shouldComputeFlete && !fleteUnchanged;

    corr.flete = hasFleteCorrection ? toDisplayValue(computedFlete) : "";

    const ivaRow = getRowByPayment(originalIvaRows, codTipo);
    const ivaRate = toNumberOrNull(firstDefined(ivaRow?.rawRateCosto, 0.12));
    const originalIva = toNumberOrNull(orig.iva);
    const computedIva =
      !hasFleteCorrection || computedFlete === null || ivaRate === null
        ? null
        : roundNumber(computedFlete * ivaRate);
    const ivaUnchanged = numbersEqual(originalIva, computedIva);
    const hasIvaCorrection = computedIva !== null && !ivaUnchanged;

    corr.iva = hasIvaCorrection ? toDisplayValue(computedIva) : "";
  }
}
