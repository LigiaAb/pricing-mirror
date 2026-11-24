import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
    Box,
    Button,
    Icon,
    IconButton,
    Tooltip,
    Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import pdfCca from "../../lib/pdfCca";
import {
    CargasCorrectionDialog,
    CargasDetailDialog,
    DisplayValue,
    GastosCorrectionDialog,
    TarifaCorrectionDialog,
    cloneRows,
    firstDefined,
    getRowByPayment,
    normalizeCargaRow,
    normalizeGastoRow,
    numbersEqual,
    PAYMENT_CONFIG,
    roundNumber,
    sumByPayment,
    sumField,
    toDisplayValue,
    toNumberOrNull,
} from "../cca";
import { useCoordinacionData, useActualizarCoordinacionCarga, useActualizarCoordinacionGasto } from "@/hooks/Bpm";
import { useQueryClient } from "@tanstack/react-query";
import BannerInformativo from "../banner";

const FLETE_RUBRO = 11;
const IVA_RUBRO = 133;
const DUE_AGENT_ENTITY_ID = 13624;

const baseFields = [
    { id: "tarifa", label: "Tarifa" },
    { id: "flete", label: "Flete" },
    { id: "iva", label: "IVA" },
    { id: "dueAgent", label: "Due Agent" },
    { id: "dueCarrier", label: "Due Carrier" },
];
const CCASection = ({ embarque_id = null, correlativoGuia = "", cargas = [], gastos = [] }) => {
    const queryClient = useQueryClient();
    const { data: embarqueData = {} } = useCoordinacionData(embarque_id);
    const { mutateAsync: actualizarCarga } = useActualizarCoordinacionCarga({ embarque_id });
    const { mutateAsync: actualizarGasto } = useActualizarCoordinacionGasto();
    const [cargasDetailOpen, setCargasDetailOpen] = useState(false);
    const [cargasCorrectionOpen, setCargasCorrectionOpen] = useState(false);
    const [tarifaCorrectionOpen, setTarifaCorrectionOpen] = useState(false);
    const [dueAgentCorrectionOpen, setDueAgentCorrectionOpen] = useState(false);
    const [dueCarrierCorrectionOpen, setDueCarrierCorrectionOpen] = useState(false);

    const normalizedCargas = useMemo(
        () => cargas.map((carga, index) => normalizeCargaRow(carga, index)),
        [cargas],
    );

    const normalizedGastos = useMemo(
        () => gastos.map((gasto, index) => normalizeGastoRow(gasto, index)),
        [gastos],
    );

    const originalTarifaRows = useMemo(
        () => normalizedGastos.filter((row) => Number(row.codRubro) === FLETE_RUBRO),
        [normalizedGastos],
    );

    const originalIvaRows = useMemo(
        () => normalizedGastos.filter((row) => Number(row.codRubro) === IVA_RUBRO),
        [normalizedGastos],
    );

    const originalDueAgentRows = useMemo(
        () => normalizedGastos.filter((row) => Number(row.entidadId) === DUE_AGENT_ENTITY_ID),
        [normalizedGastos],
    );

    const originalDueCarrierRows = useMemo(
        () => normalizedGastos.filter(
            (row) =>
                Number(row.entidadId) !== DUE_AGENT_ENTITY_ID &&
                Number(row.codRubro) !== FLETE_RUBRO &&
                Number(row.codRubro) !== IVA_RUBRO,
        ),
        [normalizedGastos],
    );

    const rawCargasMap = useMemo(() => {
        const map = new Map();
        cargas.forEach((carga) => {
            const id = String(carga.embCargaId ?? carga.EMB_CARGA_ID ?? carga.id ?? carga.ID ?? "");
            if (id) map.set(id, carga);
        });
        return map;
    }, [cargas]);

    const rawGastosMap = useMemo(() => {
        const map = new Map();
        gastos.forEach((gasto) => {
            const id = String(gasto.emb_gasto_id ?? gasto.EMB_GASTO_ID ?? gasto.id ?? gasto.ID ?? "");
            if (id) map.set(id, gasto);
        });
        return map;
    }, [gastos]);

    const normalizedCargasSignature = useMemo(() => JSON.stringify(normalizedCargas), [normalizedCargas]);
    const originalTarifaSignature = useMemo(() => JSON.stringify(originalTarifaRows), [originalTarifaRows]);
    const originalDueAgentSignature = useMemo(() => JSON.stringify(originalDueAgentRows), [originalDueAgentRows]);
    const originalDueCarrierSignature = useMemo(() => JSON.stringify(originalDueCarrierRows), [originalDueCarrierRows]);

    const [draftCargas, setDraftCargas] = useState(() => cloneRows(normalizedCargas));
    const [draftTarifas, setDraftTarifas] = useState(() => cloneRows(originalTarifaRows));
    const [draftDueAgentRows, setDraftDueAgentRows] = useState(() => cloneRows(originalDueAgentRows));
    const [draftDueCarrierRows, setDraftDueCarrierRows] = useState(() => cloneRows(originalDueCarrierRows));

    const previousCargasSignatureRef = useRef(normalizedCargasSignature);
    const previousTarifaSignatureRef = useRef(originalTarifaSignature);
    const previousDueAgentSignatureRef = useRef(originalDueAgentSignature);
    const previousDueCarrierSignatureRef = useRef(originalDueCarrierSignature);

    useEffect(() => {
        if (previousCargasSignatureRef.current === normalizedCargasSignature) {
            return;
        }

        previousCargasSignatureRef.current = normalizedCargasSignature;
        setDraftCargas(cloneRows(normalizedCargas));
    }, [normalizedCargas, normalizedCargasSignature]);

    useEffect(() => {
        if (previousTarifaSignatureRef.current === originalTarifaSignature) {
            return;
        }

        previousTarifaSignatureRef.current = originalTarifaSignature;
        setDraftTarifas(cloneRows(originalTarifaRows));
    }, [originalTarifaRows, originalTarifaSignature]);

    useEffect(() => {
        if (previousDueAgentSignatureRef.current === originalDueAgentSignature) {
            return;
        }

        previousDueAgentSignatureRef.current = originalDueAgentSignature;
        setDraftDueAgentRows(cloneRows(originalDueAgentRows));
    }, [originalDueAgentRows, originalDueAgentSignature]);

    useEffect(() => {
        if (previousDueCarrierSignatureRef.current === originalDueCarrierSignature) {
            return;
        }

        previousDueCarrierSignatureRef.current = originalDueCarrierSignature;
        setDraftDueCarrierRows(cloneRows(originalDueCarrierRows));
    }, [originalDueCarrierRows, originalDueCarrierSignature]);

    const originalCargoTotals = useMemo(() => ({
        bultos: sumField(normalizedCargas, "bultos"),
        peso: sumField(normalizedCargas, "cw"),
    }), [normalizedCargas]);

    const draftCargoTotals = useMemo(() => ({
        bultos: sumField(draftCargas, "bultos"),
        peso: sumField(draftCargas, "cw"),
    }), [draftCargas]);

    const originalValues = useMemo(() => {
        const values = {
            bultos: toDisplayValue(originalCargoTotals.bultos, { blankIfZero: true }),
            peso: toDisplayValue(originalCargoTotals.peso, { blankIfZero: true }),
            prepaid: {},
            collect: {},
        };

        PAYMENT_CONFIG.forEach(({ key, codTipo }) => {
            const tarifaRow = getRowByPayment(originalTarifaRows, codTipo);
            const ivaRow = getRowByPayment(originalIvaRows, codTipo);

            values[key] = {
                tarifa: toDisplayValue(tarifaRow?.rateCosto),
                flete: toDisplayValue(tarifaRow?.costoRubro),
                iva: toDisplayValue(ivaRow?.costoRubro),
                dueAgent: toDisplayValue(sumByPayment(originalDueAgentRows, codTipo, "ventaRubro"), { blankIfZero: true }),
                dueCarrier: toDisplayValue(sumByPayment(originalDueCarrierRows, codTipo, "ventaRubro"), { blankIfZero: true }),
            };
        });

        return values;
    }, [originalCargoTotals, originalTarifaRows, originalIvaRows, originalDueAgentRows, originalDueCarrierRows]);

    const correctionValues = useMemo(() => {
        const values = {
            shared: { bultos: "", peso: "" },
            prepaid: {},
            collect: {},
        };

        const bultosUnchanged = numbersEqual(originalCargoTotals.bultos, draftCargoTotals.bultos);
        const pesoUnchanged = numbersEqual(originalCargoTotals.peso, draftCargoTotals.peso);
        const bultosChanged = bultosUnchanged === false;
        const pesoChanged = pesoUnchanged === false;

        if (bultosChanged) {
            values.shared.bultos = toDisplayValue(draftCargoTotals.bultos);
        }

        if (pesoChanged) {
            values.shared.peso = toDisplayValue(draftCargoTotals.peso);
        }

        PAYMENT_CONFIG.forEach(({ key, codTipo }) => {
            const originalTarifaRow = getRowByPayment(originalTarifaRows, codTipo);
            const draftTarifaRow = getRowByPayment(draftTarifas, codTipo);
            const tarifaUnchanged = numbersEqual(originalTarifaRow?.rateCosto, draftTarifaRow?.rateCosto);

            values[key].tarifa = tarifaUnchanged ? "" : toDisplayValue(draftTarifaRow?.rateCosto);

            const originalDueAgentTotal = sumByPayment(originalDueAgentRows, codTipo, "ventaRubro");
            const draftDueAgentTotal = sumByPayment(draftDueAgentRows, codTipo, "ventaRubro");
            const dueAgentUnchanged = numbersEqual(originalDueAgentTotal, draftDueAgentTotal);
            values[key].dueAgent = dueAgentUnchanged ? "" : toDisplayValue(draftDueAgentTotal);

            const originalDueCarrierTotal = sumByPayment(originalDueCarrierRows, codTipo, "ventaRubro");
            const draftDueCarrierTotal = sumByPayment(draftDueCarrierRows, codTipo, "ventaRubro");
            const dueCarrierUnchanged = numbersEqual(originalDueCarrierTotal, draftDueCarrierTotal);
            values[key].dueCarrier = dueCarrierUnchanged ? "" : toDisplayValue(draftDueCarrierTotal);
        });

        const effectivePeso = pesoChanged ? draftCargoTotals.peso : originalCargoTotals.peso;

        PAYMENT_CONFIG.forEach(({ key, codTipo }) => {
            const originalFlete = toNumberOrNull(originalValues[key].flete);
            const hasTarifaCorrection = values[key].tarifa !== "";
            const effectiveTarifa = hasTarifaCorrection
                ? toNumberOrNull(values[key].tarifa)
                : toNumberOrNull(originalValues[key].tarifa);
            const shouldComputeFlete = bultosChanged || pesoChanged || hasTarifaCorrection;
            const computedFlete = effectiveTarifa === null || effectivePeso === null
                ? null
                : roundNumber(effectivePeso * effectiveTarifa);
            const fleteUnchanged = numbersEqual(originalFlete, computedFlete);
            const hasFleteCorrection = shouldComputeFlete && fleteUnchanged === false;

            values[key].flete = hasFleteCorrection
                ? toDisplayValue(computedFlete)
                : "";

            const ivaRow = getRowByPayment(originalIvaRows, codTipo);
            const ivaRate = toNumberOrNull(firstDefined(ivaRow?.rawRateCosto, 0.12));
            const originalIva = toNumberOrNull(originalValues[key].iva);
            const computedIva = hasFleteCorrection === false || computedFlete === null || ivaRate === null
                ? null
                : roundNumber(computedFlete * ivaRate);
            const ivaUnchanged = numbersEqual(originalIva, computedIva);
            const hasIvaCorrection = computedIva !== null && ivaUnchanged === false;

            values[key].iva = hasIvaCorrection
                ? toDisplayValue(computedIva)
                : "";
        });

        return values;
    }, [
        draftCargoTotals,
        draftDueAgentRows,
        draftDueCarrierRows,
        draftTarifas,
        originalCargoTotals,
        originalDueAgentRows,
        originalDueCarrierRows,
        originalIvaRows,
        originalTarifaRows,
        originalValues,
    ]);

    const hasChanges = useMemo(() => {
        const bultosChanged = !numbersEqual(originalCargoTotals.bultos, draftCargoTotals.bultos);
        const pesoChanged = !numbersEqual(originalCargoTotals.peso, draftCargoTotals.peso);

        if (bultosChanged || pesoChanged) return true;

        for (const { codTipo } of PAYMENT_CONFIG) {
            const origTarifa = getRowByPayment(originalTarifaRows, codTipo);
            const draftTarifa = getRowByPayment(draftTarifas, codTipo);
            if (!numbersEqual(origTarifa?.rateCosto, draftTarifa?.rateCosto)) return true;

            const origDueAgent = sumByPayment(originalDueAgentRows, codTipo, "ventaRubro");
            const draftDueAgent = sumByPayment(draftDueAgentRows, codTipo, "ventaRubro");
            if (!numbersEqual(origDueAgent, draftDueAgent)) return true;

            const origDueCarrier = sumByPayment(originalDueCarrierRows, codTipo, "ventaRubro");
            const draftDueCarrier = sumByPayment(draftDueCarrierRows, codTipo, "ventaRubro");
            if (!numbersEqual(origDueCarrier, draftDueCarrier)) return true;
        }

        return false;
    }, [
        draftCargoTotals,
        draftDueAgentRows,
        draftDueCarrierRows,
        draftTarifas,
        originalCargoTotals,
        originalDueAgentRows,
        originalDueCarrierRows,
        originalTarifaRows,
    ]);

    const handleGuardar = async () => {
        const tasks = [];

        // 8.1 Actualizar cargas modificadas
        const cargasModificadas = draftCargas.filter((draft, index) => {
            const original = normalizedCargas[index];
            if (!original) return true;
            return !numbersEqual(original.bultos, draft.bultos) ||
                !numbersEqual(original.peso, draft.peso) ||
                !numbersEqual(original.cw, draft.cw) ||
                original.descripcion !== draft.descripcion ||
                !numbersEqual(original.alto, draft.alto) ||
                !numbersEqual(original.ancho, draft.ancho) ||
                !numbersEqual(original.largo, draft.largo);
        });

        for (const draft of cargasModificadas) {
            const raw = rawCargasMap.get(draft.key);
            if (!raw) continue;

            const rawRubroId = raw.rubroId ?? raw.RUBRO_ID ?? null;
            const payload = {
                embarque_id: String(embarque_id),
                emb_carga_id: String(raw.embCargaId ?? raw.EMB_CARGA_ID ?? raw.id ?? ""),
                rubro_id: rawRubroId !== null && rawRubroId !== undefined ? String(rawRubroId) : null,
                bultos: String(draft.bultos ?? 0),
                cod_tipo_unidad_medidad: String(raw.tipoUnidadMedidaId ?? raw.TIPO_ID_UNIDAD_MEDIDA ?? ""),
                peso: String(draft.peso ?? 0),
                volumen: String(draft.pesoVolumetrico ?? 0),
                metros_cubicos: String(raw.metrosCubicos ?? raw.METROS_CUBICOS ?? 0),
                char_w: String(draft.cw ?? 0),
                valor: String(raw.valor ?? raw.VALOR ?? 0),
                estado_cod: String(raw.estadoId ?? raw.ESTADO_ID ?? ""),
                descripcion_carga: draft.descripcion ?? "",
                cod_pais_origen_carga: raw.paisOrigenId ?? raw.PAIS_ID_ORIGEN ?? "",
                partida_arancelaria: raw.partidaArancelaria ?? raw.PARTIDA_ARANCELARIA ?? null,
                regimen_aduanal: raw.regimenAduanal ?? raw.REGIMEN_ADUANAL ?? null,
                definitivo_general: raw.definitivoGeneral ?? raw.DEFINITIVO_GENERAL ?? "N",
            };

            if (raw.embLegsId ?? raw.EMB_LEGS_ID) {
                payload.emb_legs_id = String(raw.embLegsId ?? raw.EMB_LEGS_ID);
            }

            tasks.push(actualizarCarga(payload));
        }

        // Detectar si CW cambió para recalcular flete
        const cwCambio = draftCargas.some((draft, index) => {
            const original = normalizedCargas[index];
            return original && !numbersEqual(original.cw, draft.cw);
        });
        const nuevoCwTotal = cwCambio ? draftCargoTotals.peso : null;

        // 8.2a Actualizar flete (cod_rubro = 11) si se modificó tarifa o CW
        for (const draftRow of draftTarifas) {
            const originalRow = getRowByPayment(originalTarifaRows, draftRow.codTipoPago);
            if (!originalRow) continue;

            const tarifaCambio = !numbersEqual(originalRow.rateCosto, draftRow.rateCosto);
            if (!tarifaCambio && !cwCambio) continue;

            const raw = rawGastosMap.get(draftRow.key);
            if (!raw) continue;

            const nuevoRateCosto = toNumberOrNull(draftRow.rateCosto) ?? toNumberOrNull(raw.rate_costo ?? raw.RATE_COSTO) ?? 0;
            const nuevoRateVenta = toNumberOrNull(draftRow.rateVenta) ?? toNumberOrNull(raw.rate_venta ?? raw.RATE_VENTA) ?? 0;

            const payload = {
                embarque_id: Number(embarque_id),
                emb_gasto_id: Number(raw.emb_gasto_id ?? raw.EMB_GASTO_ID ?? raw.id ?? ""),
                cod_rubro: FLETE_RUBRO,
                gruporubro_nombre: raw.gruporubro_nombre ?? raw.GRUPORUBRO_NOMBRE ?? "",
                costo_rubro: raw.costo_rubro ?? raw.COSTO_RUBRO ?? 0,
                costo_grupo: raw.costo_grupo ?? raw.COSTO_GRUPO ?? 0,
                cod_servicio: raw.cod_servicio ?? raw.COD_SERVICIO ?? null,
                entidad_id: raw.entidad_id ?? raw.ENTIDAD_ID ?? null,
                venta_rubro: raw.venta_rubro ?? raw.VENTA_RUBRO ?? 0,
                venta_grupo: raw.venta_grupo ?? raw.VENTA_GRUPO ?? 0,
                cod_moneda_costo: raw.cod_moneda_costo ?? raw.COD_MONEDA_COSTO ?? null,
                cod_moneda_venta: raw.cod_moneda_venta ?? raw.COD_MONEDA_VENTA ?? null,
                cod_tipo_pago: Number(raw.cod_tipo_pago ?? raw.COD_TIPO_PAGO ?? draftRow.codTipoPago),
                cod_tipo_facturacion: raw.cod_tipo_facturacion ?? raw.COD_TIPO_FACTURACION ?? 1,
                cod_tipo_calculo: raw.cod_tipo_calculo ?? raw.COD_TIPO_CALCULO ?? 1,
                gasto_facturado: raw.gasto_facturado ?? raw.GASTO_FACTURADO ?? 0,
                cod_metodo: raw.cod_metodo ?? raw.COD_METODO ?? null,
                rate_costo: nuevoRateCosto,
                rate_venta: nuevoRateVenta,
                clasificacion: raw.clasificacion ?? raw.CLASIFICACION ?? null,
                json_calculo: raw.json_calculo ?? raw.JSON_CALCULO ?? null,
            };

            if (cwCambio && nuevoCwTotal !== null) {
                payload.costo_rubro = roundNumber(nuevoCwTotal * nuevoRateCosto) ?? 0;
                payload.venta_rubro = roundNumber(nuevoCwTotal * nuevoRateVenta) ?? 0;
            }

            tasks.push(actualizarGasto(payload));
        }

        // 8.2c Actualizar IVA (cod_rubro = 133) si se modificó
        for (const originalIvaRow of originalIvaRows) {
            const key = PAYMENT_CONFIG.find(p => p.codTipo === originalIvaRow.codTipoPago)?.key;
            if (!key) continue;

            const ivaCorreccion = correctionValues[key]?.iva;
            if (!ivaCorreccion || ivaCorreccion === "") continue;

            const raw = rawGastosMap.get(originalIvaRow.key);
            if (!raw) continue;

            const nuevoIva = toNumberOrNull(ivaCorreccion) ?? 0;

            const payload = {
                embarque_id: Number(embarque_id),
                emb_gasto_id: Number(raw.emb_gasto_id ?? raw.EMB_GASTO_ID ?? raw.id ?? ""),
                cod_rubro: IVA_RUBRO,
                gruporubro_nombre: raw.gruporubro_nombre ?? raw.GRUPORUBRO_NOMBRE ?? "",
                costo_rubro: nuevoIva,
                costo_grupo: raw.costo_grupo ?? raw.COSTO_GRUPO ?? 0,
                cod_servicio: raw.cod_servicio ?? raw.COD_SERVICIO ?? null,
                entidad_id: raw.entidad_id ?? raw.ENTIDAD_ID ?? null,
                venta_rubro: nuevoIva,
                venta_grupo: raw.venta_grupo ?? raw.VENTA_GRUPO ?? 0,
                cod_moneda_costo: raw.cod_moneda_costo ?? raw.COD_MONEDA_COSTO ?? null,
                cod_moneda_venta: raw.cod_moneda_venta ?? raw.COD_MONEDA_VENTA ?? null,
                cod_tipo_pago: Number(raw.cod_tipo_pago ?? raw.COD_TIPO_PAGO ?? originalIvaRow.codTipoPago),
                cod_tipo_facturacion: raw.cod_tipo_facturacion ?? raw.COD_TIPO_FACTURACION ?? 1,
                cod_tipo_calculo: raw.cod_tipo_calculo ?? raw.COD_TIPO_CALCULO ?? 1,
                gasto_facturado: raw.gasto_facturado ?? raw.GASTO_FACTURADO ?? 0,
                cod_metodo: raw.cod_metodo ?? raw.COD_METODO ?? null,
                rate_costo: raw.rate_costo ?? raw.RATE_COSTO ?? null,
                rate_venta: raw.rate_venta ?? raw.RATE_VENTA ?? null,
                clasificacion: raw.clasificacion ?? raw.CLASIFICACION ?? null,
                json_calculo: raw.json_calculo ?? raw.JSON_CALCULO ?? null,
            };

            tasks.push(actualizarGasto(payload));
        }

        // 8.2b Actualizar Due Agent y Due Carrier modificados
        const procesarGastosModificados = (draftRows, originalRows) => {
            for (const draftRow of draftRows) {
                const originalRow = originalRows.find(
                    (orig) => Number(orig.codTipoPago) === Number(draftRow.codTipoPago) && orig.key === draftRow.key,
                );

                const cambioRateCosto = originalRow && !numbersEqual(originalRow.rateCosto, draftRow.rateCosto);
                const cambioRateVenta = originalRow && !numbersEqual(originalRow.rateVenta, draftRow.rateVenta);
                const cambioCostoRubro = originalRow && !numbersEqual(originalRow.costoRubro, draftRow.costoRubro);
                const cambioVentaRubro = originalRow && !numbersEqual(originalRow.ventaRubro, draftRow.ventaRubro);

                if (!cambioRateCosto && !cambioRateVenta && !cambioCostoRubro && !cambioVentaRubro) continue;

                const raw = rawGastosMap.get(draftRow.key);
                if (!raw) continue;

                const payload = {
                    embarque_id: Number(embarque_id),
                    emb_gasto_id: Number(raw.emb_gasto_id ?? raw.EMB_GASTO_ID ?? raw.id ?? ""),
                    cod_rubro: Number(raw.cod_rubro ?? raw.COD_RUBRO ?? draftRow.codRubro),
                    gruporubro_nombre: raw.gruporubro_nombre ?? raw.GRUPORUBRO_NOMBRE ?? "",
                    costo_rubro: toNumberOrNull(cambioCostoRubro ? draftRow.costoRubro : (raw.costo_rubro ?? raw.COSTO_RUBRO)) ?? 0,
                    costo_grupo: raw.costo_grupo ?? raw.COSTO_GRUPO ?? 0,
                    cod_servicio: raw.cod_servicio ?? raw.COD_SERVICIO ?? null,
                    entidad_id: raw.entidad_id ?? raw.ENTIDAD_ID ?? null,
                    venta_rubro: toNumberOrNull(cambioVentaRubro ? draftRow.ventaRubro : (raw.venta_rubro ?? raw.VENTA_RUBRO)) ?? 0,
                    venta_grupo: raw.venta_grupo ?? raw.VENTA_GRUPO ?? 0,
                    cod_moneda_costo: raw.cod_moneda_costo ?? raw.COD_MONEDA_COSTO ?? null,
                    cod_moneda_venta: raw.cod_moneda_venta ?? raw.COD_MONEDA_VENTA ?? null,
                    cod_tipo_pago: Number(raw.cod_tipo_pago ?? raw.COD_TIPO_PAGO ?? draftRow.codTipoPago),
                    cod_tipo_facturacion: raw.cod_tipo_facturacion ?? raw.COD_TIPO_FACTURACION ?? 1,
                    cod_tipo_calculo: raw.cod_tipo_calculo ?? raw.COD_TIPO_CALCULO ?? 1,
                    gasto_facturado: raw.gasto_facturado ?? raw.GASTO_FACTURADO ?? 0,
                    cod_metodo: raw.cod_metodo ?? raw.COD_METODO ?? null,
                    rate_costo: toNumberOrNull(cambioRateCosto ? draftRow.rateCosto : (raw.rate_costo ?? raw.RATE_COSTO)) ?? 0,
                    rate_venta: toNumberOrNull(cambioRateVenta ? draftRow.rateVenta : (raw.rate_venta ?? raw.RATE_VENTA)) ?? 0,
                    clasificacion: raw.clasificacion ?? raw.CLASIFICACION ?? null,
                    json_calculo: raw.json_calculo ?? raw.JSON_CALCULO ?? null,
                };

                tasks.push(actualizarGasto(payload));
            }
        };

        procesarGastosModificados(draftDueAgentRows, originalDueAgentRows);
        procesarGastosModificados(draftDueCarrierRows, originalDueCarrierRows);

        if (tasks.length === 0) return;

        try {
            await Promise.all(tasks);
            queryClient.invalidateQueries({ queryKey: ["coordinaciones", 1, 16, embarque_id] });
            queryClient.invalidateQueries({ queryKey: ["ultima-version-coordinacion-gastos", embarque_id] });
            queryClient.invalidateQueries({ queryKey: ["listar-coordinacion-gastos", embarque_id] });
            handleDescargarPdf(false);
            setDraftCargas(cloneRows(normalizedCargas));
            setDraftTarifas(cloneRows(originalTarifaRows));
            setDraftDueAgentRows(cloneRows(originalDueAgentRows));
            setDraftDueCarrierRows(cloneRows(originalDueCarrierRows));
        } catch (error) {
            console.error("Error al guardar correcciones:", error);
        }
    };

    const handleRecargar = () => {
        queryClient.invalidateQueries({ queryKey: ["coordinaciones", 1, 16, embarque_id] });
        queryClient.invalidateQueries({ queryKey: ["ultima-version-coordinacion-gastos", embarque_id] });
        queryClient.invalidateQueries({ queryKey: ["listar-coordinacion-gastos", embarque_id] });
    };

    const handleDescargarPdf = (isDraft = true) => {
        const today = new Date().toLocaleDateString("es-GT");
        const fmt = (value) => (value !== "" && value !== undefined ? String(value) : "");
        const hasValue = (value) => value !== "" && value !== undefined;

        const sharedCorrection = correctionValues.shared;
        const op = originalValues.prepaid;
        const oc = originalValues.collect;
        const cp = correctionValues.prepaid || {};
        const cc = correctionValues.collect || {};

        const resolveFieldPair = (origPrepaid, origCollect, corrPrepaid, corrCollect) => {
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

            const result = {
                correctoPrepaid: "",
                correctoPrepaidBold: false,
                incorrectoPrepaid: "",
                correctoCollect: "",
                correctoCollectBold: false,
                incorrectoCollect: "",
            };

            const fields = [
                {
                    hasCorr: hasCorrPrepaid,
                    hasOrig: hasOrigPrepaid,
                    corrValue: corrPrepaid,
                    origValue: origPrepaid,
                    correctField: "correctoPrepaid",
                    boldField: "correctoPrepaidBold",
                    incorrectField: "incorrectoPrepaid",
                    isSwap: isSwapToPrepaid,
                },
                {
                    hasCorr: hasCorrCollect,
                    hasOrig: hasOrigCollect,
                    corrValue: corrCollect,
                    origValue: origCollect,
                    correctField: "correctoCollect",
                    boldField: "correctoCollectBold",
                    incorrectField: "incorrectoCollect",
                    isSwap: isSwapToCollect,
                },
            ];

            fields.forEach(({ hasCorr, hasOrig, corrValue, origValue, correctField, boldField, incorrectField, isSwap }) => {
                if (!hasCorr) return;

                result[correctField] = fmt(corrValue);
                result[boldField] = true;
                if (hasOrig && !isSwap) {
                    result[incorrectField] = fmt(origValue);
                }
            });

            if (isSwapToPrepaid) {
                result.incorrectoCollect = fmt(origCollect);
            }

            if (isSwapToCollect) {
                result.incorrectoPrepaid = fmt(origPrepaid);
            }

            return result;
        };

        const resolveField = (origValue, corrValue) => {
            const hasOrigValue = hasValue(origValue);
            const hasCorrValue = hasValue(corrValue);

            const result = {
                correcto: "",
                incorrecto: "",
                bold: false,
            };

            if (!hasCorrValue) {
                if (hasOrigValue) {
                    result.correcto = fmt(origValue);
                }
                return result;
            }

            result.correcto = fmt(corrValue);
            result.bold = true;
            if (hasOrigValue) {
                result.incorrecto = fmt(origValue);
            }

            return result;
        };

        const fields = [
            { id: "tarifa", pdfKey: "Tarifa" },
            { id: "flete", pdfKey: "Flete" },
            { id: "iva", pdfKey: "IVA" },
            { id: "dueAgent", pdfKey: "DueAgent" },
            { id: "dueCarrier", pdfKey: "DueCarrier" },
        ];

        const pdfData = {
            fecha: today,
            noReferencia: correlativoGuia || embarqueData?.embarqueId || "",
            destinatario: embarqueData?.consignatario || "",
            atencion: "",
            awb:
                embarqueData?.correlativoGuiaMaster ||
                embarqueData?.correlativo_guia_master ||
                embarqueData?.mawbNumber ||
                embarqueData?.guiaMaster ||
                embarqueData?.correlativoGuia ||
                embarqueData?.guia_master ||
                "",
            origen: embarqueData?.paisOrigen || embarqueData?.origen || "",
            destino: embarqueData?.paisDestino || embarqueData?.destino || "",
            fechaEmision: today,
            remitente: embarqueData?.shipper || embarqueData?.remitente || "",
            consignatario: embarqueData?.entidadConsignatarioNombre || embarqueData?.consignatario || "",
        };

        const bultos = resolveField(originalValues.bultos, sharedCorrection.bultos);
        pdfData.correctosNoBultos = bultos.correcto;
        pdfData.correctosNoBultosBold = bultos.bold;
        pdfData.incorrectosNoBultos = bultos.incorrecto;

        const peso = resolveField(originalValues.peso, sharedCorrection.peso);
        pdfData.correctosPesoKilos = peso.correcto;
        pdfData.correctosPesoKilosBold = peso.bold;
        pdfData.incorrectosPesoKilos = peso.incorrecto;

        for (const { id, pdfKey } of fields) {
            const pair = resolveFieldPair(op[id], oc[id], cp[id], cc[id]);
            pdfData[`correctos${pdfKey}Prepaid`] = pair.correctoPrepaid;
            pdfData[`correctos${pdfKey}PrepaidBold`] = pair.correctoPrepaidBold;
            pdfData[`incorrectos${pdfKey}Prepaid`] = pair.incorrectoPrepaid;
            pdfData[`correctos${pdfKey}Collect`] = pair.correctoCollect;
            pdfData[`correctos${pdfKey}CollectBold`] = pair.correctoCollectBold;
            pdfData[`incorrectos${pdfKey}Collect`] = pair.incorrectoCollect;
        }

        const pdfBlob = pdfCca(pdfData, isDraft);
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const previewTab = window.open("about:blank", "_blank");

        if (previewTab) {
            previewTab.location.replace(pdfUrl);
        } else {
            window.open(pdfUrl, "_blank");
        }

        setTimeout(() => {
            try {
                URL.revokeObjectURL(pdfUrl);
            } catch (error) {
                console.error(error);
            }
        }, 10000);
    };

    return (
        <>
            <Box sx={{ width: "70%", display: "flex", flexDirection: "column", gap: 2, mx: "auto" }}>
                <BannerInformativo
                    severidad="info"
                    titulo=""
                    mensaje={[
                        "1. De al boton editar para ingresar los valores a corregir",
                        "2. Puede ver la vista previa al dar en DRAFT",
                        "3. De al boton Guardar para ingresar los cambios y generar el pdf CCA",
                    ]}
                />

                <Box sx={{ display: "grid", gridTemplateColumns: "220px 2fr 2fr 56px", gap: 2, alignItems: "center", columnGap: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold">Descripción</Typography>
                    <Typography variant="subtitle2" fontWeight="bold" align="center">Original</Typography>
                    <Typography variant="subtitle2" fontWeight="bold" align="center">Corrección</Typography>
                    <Typography variant="subtitle2" fontWeight="bold" align="center">Acción</Typography>

                    <Typography>No. Bultos</Typography>
                    <Tooltip title="Ver detalle de cargas" placement="top">
                        <Box sx={{ cursor: "pointer" }} onClick={() => setCargasDetailOpen(true)}>
                            <DisplayValue value={originalValues.bultos} />
                        </Box>
                    </Tooltip>
                    <DisplayValue value={correctionValues.shared.bultos} />
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <Tooltip title="Editar" placement="top">
                            <IconButton size="small" onClick={() => setCargasCorrectionOpen(true)}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Typography>CW en Kilos</Typography>
                    <Tooltip title="Ver detalle de cargas" placement="top">
                        <Box sx={{ cursor: "pointer" }} onClick={() => setCargasDetailOpen(true)}>
                            <DisplayValue value={originalValues.peso} />
                        </Box>
                    </Tooltip>
                    <DisplayValue value={correctionValues.shared.peso} />
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <Tooltip title="Editar" placement="top">
                            <IconButton size="small" onClick={() => setCargasCorrectionOpen(true)}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: "220px repeat(4, 1fr) 56px", gap: 2, alignItems: "center", mt: 2, columnGap: 2 }}>
                    <Typography variant="h6" sx={{ fontSize: "1.2rem" }} />
                    <Typography variant="h6" sx={{ gridColumn: "span 2", fontSize: "1.2rem", textAlign: "center" }}>Original</Typography>
                    <Typography variant="h6" sx={{ gridColumn: "span 2", fontSize: "1.2rem", textAlign: "center" }}>Corrección</Typography>
                    <Box />

                    <Typography fontWeight="bold">Descripción</Typography>
                    <Typography align="center" fontWeight="bold">PREPAID</Typography>
                    <Typography align="center" fontWeight="bold">COLLECT</Typography>
                    <Typography align="center" fontWeight="bold">PREPAID</Typography>
                    <Typography align="center" fontWeight="bold">COLLECT</Typography>
                    <Typography align="center" fontWeight="bold">Acción</Typography>

                    {baseFields.map((field) => (
                        <React.Fragment key={field.id}>
                            <Typography>{field.label}</Typography>
                            <DisplayValue value={originalValues.prepaid[field.id]} />
                            <DisplayValue value={originalValues.collect[field.id]} />
                            <DisplayValue value={correctionValues.prepaid[field.id]} />
                            <DisplayValue value={correctionValues.collect[field.id]} />
                            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                {field.id === "tarifa" && draftTarifas.length > 0 ? (
                                    <Tooltip title="Editar" placement="top">
                                        <IconButton size="small" onClick={() => setTarifaCorrectionOpen(true)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                ) : null}
                                {field.id === "dueAgent" && draftDueAgentRows.length > 0 ? (
                                    <Tooltip title="Editar" placement="top">
                                        <IconButton size="small" onClick={() => setDueAgentCorrectionOpen(true)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                ) : null}
                                {field.id === "dueCarrier" && draftDueCarrierRows.length > 0 ? (
                                    <Tooltip title="Editar" placement="top">
                                        <IconButton size="small" onClick={() => setDueCarrierCorrectionOpen(true)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                ) : null}
                            </Box>
                        </React.Fragment>
                    ))}
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                    <Tooltip title="Recargar datos">
                        <IconButton onClick={handleRecargar}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <Tooltip title={hasChanges ? "" : "No se han modificado los rubros"}>
                            <span>
                                <Button
                                    variant="outlined"
                                    startIcon={<Icon className="c-pdf" sx={{ fontSize: "inherit", mr: 1, color: (theme) => (theme.palette.mode === "dark" ? "#fff" : undefined) }} />}
                                    onClick={handleDescargarPdf}
                                    disabled={!hasChanges}
                                >
                                    Draft
                                </Button>
                            </span>
                        </Tooltip>
                        <Tooltip title={hasChanges ? "" : "No se han modificado los rubros"}>
                            <span>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<SaveIcon />}
                                    onClick={handleGuardar}
                                    disabled={!hasChanges}
                                >
                                    Guardar y descargar PDF
                                </Button>
                            </span>
                        </Tooltip>
                    </Box>
                </Box>
            </Box>

            <CargasDetailDialog
                open={cargasDetailOpen}
                onClose={() => setCargasDetailOpen(false)}
                embarqueId={embarque_id}
            />

            <CargasCorrectionDialog
                open={cargasCorrectionOpen}
                rows={draftCargas}
                onClose={() => setCargasCorrectionOpen(false)}
                onAccept={(rows) => {
                    setDraftCargas(cloneRows(rows));
                    setCargasCorrectionOpen(false);
                }}
            />

            <TarifaCorrectionDialog
                open={tarifaCorrectionOpen}
                rows={draftTarifas}
                onClose={() => setTarifaCorrectionOpen(false)}
                onAccept={(rows) => {
                    setDraftTarifas(cloneRows(rows));
                    setTarifaCorrectionOpen(false);
                }}
            />

            <GastosCorrectionDialog
                open={dueAgentCorrectionOpen}
                title="Due Agent"
                rows={draftDueAgentRows}
                onClose={() => setDueAgentCorrectionOpen(false)}
                onAccept={(rows) => {
                    setDraftDueAgentRows(cloneRows(rows));
                    setDueAgentCorrectionOpen(false);
                }}
            />

            <GastosCorrectionDialog
                open={dueCarrierCorrectionOpen}
                title="Due Carrier"
                rows={draftDueCarrierRows}
                onClose={() => setDueCarrierCorrectionOpen(false)}
                onAccept={(rows) => {
                    setDraftDueCarrierRows(cloneRows(rows));
                    setDueCarrierCorrectionOpen(false);
                }}
            />
        </>
    );
};

CCASection.propTypes = {
    embarque_id: PropTypes.number,
    correlativoGuia: PropTypes.string,
    cargas: PropTypes.array,
    gastos: PropTypes.array,
};

export default CCASection;
