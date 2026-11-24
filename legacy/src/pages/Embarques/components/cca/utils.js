import { computeCW, computeVolumenTotal, getFactorCmPorUnidadMedida } from "@/components/bpm/modal/modalCargas";

export const PAYMENT_CONFIG = [
    { key: "prepaid", codTipo: 128, label: "PREPAID" },
    { key: "collect", codTipo: 127, label: "COLLECT" },
];

export const PAYMENT_OPTIONS = PAYMENT_CONFIG.map(({ codTipo, label }) => ({
    value: codTipo,
    label,
}));

export const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

export const toNumberOrNull = (value) => {
    if (value === "" || value === null || value === undefined) return null;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

export const toIntegerOrNull = (value) => {
    const parsed = toNumberOrNull(value);
    if (parsed === null) return null;
    return Math.max(0, Math.trunc(parsed));
};

export const roundNumber = (value, decimals = 3) => {
    const parsed = toNumberOrNull(value);
    if (parsed === null) return null;
    return Number(parsed.toFixed(decimals));
};

export const toDisplayValue = (value, { blankIfZero = false } = {}) => {
    const rounded = roundNumber(value);
    if (rounded === null) return "";
    if (blankIfZero && Math.abs(rounded) < 0.0001) return "";
    return String(rounded);
};

export const numbersEqual = (left, right, epsilon = 0.0001) => {
    const normalizedLeft = toNumberOrNull(left);
    const normalizedRight = toNumberOrNull(right);

    if (normalizedLeft === null && normalizedRight === null) return true;
    if (normalizedLeft === null || normalizedRight === null) return false;

    return Math.abs(normalizedLeft - normalizedRight) < epsilon;
};

export const normalizeDecimalInput = (value) => {
    if (value === "") return "";
    const parsed = Number(value);
    return Number.isFinite(parsed) ? String(roundNumber(parsed)) : "";
};

export const normalizeIntegerInput = (value) => {
    if (value === "") return "";
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return "";
    return String(Math.max(0, Math.trunc(parsed)));
};

export const cloneRows = (rows = []) => rows.map((row) => ({ ...row }));

export const getPaymentLabel = (codTipo) => PAYMENT_CONFIG.find((config) => config.codTipo === Number(codTipo))?.label || "Sin tipo";

export const getRowByPayment = (rows, codTipo) => rows.find((row) => Number(row.codTipoPago) === Number(codTipo));

export const sumField = (rows, field) => roundNumber(
    rows.reduce((sum, row) => sum + (toNumberOrNull(row[field]) ?? 0), 0)
) ?? 0;

export const sumByPayment = (rows, codTipo, field) => roundNumber(
    rows
        .filter((row) => Number(row.codTipoPago) === Number(codTipo))
        .reduce((sum, row) => sum + (toNumberOrNull(row[field]) ?? 0), 0)
) ?? 0;

export const normalizeCargaRow = (carga, index, unidadesMedida = []) => {
    const bultos = toIntegerOrNull(firstDefined(carga.bultos, carga.BULTOS, carga.cantidad, carga.CANTIDAD));
    const alto = roundNumber(firstDefined(carga.alto, carga.ALTO, carga.alto_cm));
    const ancho = roundNumber(firstDefined(carga.ancho, carga.ANCHO, carga.ancho_cm));
    const largo = roundNumber(firstDefined(carga.largo, carga.LARGO, carga.largo_cm));
    const peso = roundNumber(firstDefined(carga.peso, carga.PESO, carga.pesoTotal, carga.PESO_TOTAL));
    const providedVolumetrico = roundNumber(firstDefined(
        carga.volumenTotal,
        carga.volumen,
        carga.metrosCubicos,
        carga.METROS_CUBICOS,
    ));
    const factorCm = getFactorCmPorUnidadMedida(
        firstDefined(carga.unidadMedida, carga.tipoUnidadMedidaId, carga.tipo_id_unidad_medida, carga.TIPO_ID_UNIDAD_MEDIDA),
        unidadesMedida,
    );
    const computedVolumetrico = computeVolumenTotal({
        cantidad: bultos ?? 0,
        largo: largo ?? 0,
        ancho: ancho ?? 0,
        alto: alto ?? 0,
        factorCm,
    });
    const pesoVolumetrico = providedVolumetrico ?? (computedVolumetrico > 0 ? roundNumber(computedVolumetrico) : null);
    const providedCw = roundNumber(firstDefined(carga.cw, carga.CW));
    const computedCw = computeCW({
        pesoTotal: peso ?? 0,
        volumenTotal: pesoVolumetrico ?? 0,
    });

    return {
        key: String(firstDefined(carga.embCargaId, carga.EMB_CARGA_ID, carga.id, carga.ID, `carga-${index}`)),
        descripcion: firstDefined(carga.descripcionCarga, carga.DESCRIPCION_CARGA, carga.descripcion, carga.DESCRIPCION, ""),
        bultos: bultos ?? "",
        alto: alto ?? "",
        ancho: ancho ?? "",
        largo: largo ?? "",
        peso: peso ?? "",
        pesoVolumetrico: pesoVolumetrico ?? "",
        cw: providedCw ?? (computedCw > 0 ? roundNumber(computedCw) : ""),
    };
};

export const deriveCargaDraft = (row, unidadesMedida = []) => {
    const factorCm = getFactorCmPorUnidadMedida(
        firstDefined(row.unidadMedida, row.tipoUnidadMedidaId, row.tipo_id_unidad_medida, row.TIPO_ID_UNIDAD_MEDIDA),
        unidadesMedida,
    );
    const pesoVolumetrico = computeVolumenTotal({
        cantidad: row.bultos || 0,
        largo: row.largo || 0,
        ancho: row.ancho || 0,
        alto: row.alto || 0,
        factorCm,
    });

    const cw = computeCW({
        pesoTotal: row.peso || 0,
        volumenTotal: pesoVolumetrico || 0,
    });

    return {
        ...row,
        pesoVolumetrico: pesoVolumetrico > 0 ? roundNumber(pesoVolumetrico) : "",
        cw: cw > 0 ? roundNumber(cw) : "",
    };
};

export const normalizeGastoRow = (gasto, index) => ({
    key: String(firstDefined(gasto.emb_gasto_id, gasto.EMB_GASTO_ID, gasto.id, gasto.ID, `gasto-${index}`)),
    codRubro: toNumberOrNull(firstDefined(gasto.cod_rubro, gasto.COD_RUBRO)),
    codTipoPago: toNumberOrNull(firstDefined(gasto.cod_tipo_pago, gasto.COD_TIPO_PAGO)),
    entidadId: toNumberOrNull(firstDefined(gasto.entidad_id, gasto.ENTIDAD_ID, gasto.codigo_entidad, gasto.cod_proveedor)),
    gruporubroNombre: firstDefined(gasto.gruporubro_nombre, gasto.GRUPORUBRO_NOMBRE, gasto.servicio_nombre, gasto.SERVICIO_NOMBRE, ""),
    servicioSiglas: firstDefined(gasto.servicio_siglas, gasto.SERVICIO_SIGLAS, ""),
    rawRateCosto: toNumberOrNull(firstDefined(gasto.rate_costo, gasto.RATE_COSTO)),
    rateCosto: roundNumber(firstDefined(gasto.rate_costo, gasto.RATE_COSTO, gasto.costo_rubro, gasto.COSTO_RUBRO)) ?? "",
    rateVenta: roundNumber(firstDefined(gasto.rate_venta, gasto.RATE_VENTA, gasto.venta_rubro, gasto.VENTA_RUBRO)) ?? "",
    costoRubro: roundNumber(firstDefined(gasto.costo_rubro, gasto.COSTO_RUBRO, gasto.rate_costo, gasto.RATE_COSTO)) ?? "",
    ventaRubro: roundNumber(firstDefined(gasto.venta_rubro, gasto.VENTA_RUBRO, gasto.rate_venta, gasto.RATE_VENTA)) ?? "",
});

export const resolveEmbarqueId = (embarqueData = {}, embarqueId = null) => firstDefined(
    embarqueId,
    embarqueData?.embarqueId,
    embarqueData?.EMBARQUE_ID,
    embarqueData?.embarque_id,
    embarqueData?.id,
) ?? null;