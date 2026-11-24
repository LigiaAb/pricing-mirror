import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
    Icon,
    Box,
    Card,
    CardContent,
    Typography,
} from "@mui/material";
import {
    useActualizarCoordinacionCarga,
    useCoordinacionCargas,
    useFetchPaises,
    useInsertarCoordinacionCarga,
    useEliminarCoordinacionCarga,
    useFetchTipos,
    invalidateCoordinacionCargas,
    useRecalcularEmbarqueConCargas,
    useCoordinacionData,
} from "@/hooks/Bpm";
import { useQueryClient } from "@tanstack/react-query";
import TablaCargasEditable from "@/components/bpm/tablas/tablaCargasEdit";
import CalculadoraCargas from "@/pages/Embarques/components/calculadoraCargas";
import BannerInformativo from "../banner";

const createEmptyRow = () => ({
    embCargaId: null,
    rubroId: null,
    rubroNombre: "",
    paisOrigenId: "",
    descripcion: "",
    valor: "",
    tipoEmbalaje: "",
    partidaArancelaria: "",
    regimenAduanal: "",
    definitivoGeneral: "N",
    cantidad: "",
    volumenTotal: "",
    pesoTotal: "",
    largo: "",
    alto: "",
    ancho: "",
    unidadMedida: "",
    unidadPeso: "",
    cw: "",
});

const normalizeUnidad = (unidad, fallback = "") => {
    if (unidad === null || unidad === undefined) return fallback;
    if (typeof unidad === "number" || typeof unidad === "string") return unidad;
    return (
        unidad.value ??
        unidad.cod_tipo_unidad_medidad ??
        unidad.cod_tipo_unidad_medida ??
        fallback
    );
};

const computeVolumenFromDims = ({ largo, alto, ancho, cantidad }) => {
    const toNumber = (v) => {
        const n = Number.parseFloat(v);
        return Number.isFinite(n) ? n : Number.NaN;
    };

    const l = toNumber(largo);
    const a = toNumber(alto);
    const an = toNumber(ancho);
    const c = toNumber(cantidad);

    if ([l, a, an, c].some((v) => Number.isNaN(v) || v <= 0)) return 0;

    // kg volumétrico = (L*W*H / 6000)
    const volumetricoUnitario = (l * a * an) / 6000;
    return Number((volumetricoUnitario).toFixed(3));
};

const toComparableNumber = (value) => {
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) return 0;
    return Number(parsed.toFixed(3));
};

const getCargaMetricSnapshot = (carga = {}) => {
    const peso = toComparableNumber(carga.pesoTotal ?? carga.peso ?? carga.PESO ?? 0);
    const volumenIngresado = Number.parseFloat(
        carga.volumenTotal ?? carga.volumen ?? carga.metrosCubicos ?? carga.METROS_CUBICOS ?? 0,
    );
    const volumen = volumenIngresado > 0
        ? toComparableNumber(volumenIngresado)
        : toComparableNumber(computeVolumenFromDims({
            largo: carga.largo ?? carga.LARGO ??  0,
            alto: carga.alto ?? carga.ALTO ??  0,
            ancho: carga.ancho ?? carga.ANCHO ??  0,
            cantidad: carga.cantidad ?? carga.bultos ?? carga.BULTOS ?? 0,
        }));

    const rawCw = carga.cw ?? carga.CW ?? "";
    const cw = String(rawCw).trim() === "" ? peso : toComparableNumber(rawCw);

    return { peso, volumen, cw };
};

const didCargaMetricsChange = (nextCarga, prevCarga) => {
    const nextMetrics = getCargaMetricSnapshot(nextCarga);
    const prevMetrics = getCargaMetricSnapshot(prevCarga);

    return nextMetrics.cw !== prevMetrics.cw ||
        nextMetrics.peso !== prevMetrics.peso ||
        nextMetrics.volumen !== prevMetrics.volumen;
};

const getCamposFaltantes = (fila) => {
    const campos = [];
    if (!fila.paisOrigenId || String(fila.paisOrigenId).trim() === "") campos.push("País Origen");
    if (!String(fila.descripcion || "").trim()) campos.push("Descripción");
    if (!fila.valor || Number(fila.valor) <= 0) campos.push("Valor declarado");
    if (!fila.partidaArancelaria || String(fila.partidaArancelaria).trim() === "") campos.push("Partida Arancelaria");
    if (!fila.regimenAduanal || String(fila.regimenAduanal).trim() === "") campos.push("Régimen Aduanal");
    const cantidad = Number(fila.cantidad);
    if (!Number.isInteger(cantidad) || cantidad <= 0) campos.push("# Bultos");
    if (!fila.pesoTotal || Number(fila.pesoTotal) <= 0) campos.push("Peso (kg)");
    return campos;
};

const formatPartidaArancelaria = (val) => {
  const digits = String(val ?? "").replace(/\D/g, "").slice(0, 20);
  const pairs = [];
  for (let i = 0; i < digits.length; i += 2) pairs.push(digits.slice(i, i + 2));
  return pairs.join(".");
};

const CargasSection = ({ embarqueId = null, onValidityChange, onLoadingChange }) => {
    const { data: embarqueData = null } = useCoordinacionData(embarqueId);

    const { data: paises = [], isLoading: isLoadingPaises } = useFetchPaises();
    const tiposMedida = useFetchTipos({ tipo_tabla: "COORDINACION_CARGA" });
    const { data: tiposEmbalaje = [], isLoading: isLoadingTiposEmbalaje } = useFetchTipos({ tipo_tabla: "embalaje" });
    const { data: regimenAduanalOptions = [], isLoading: isLoadingRegimenAduanal } = useFetchTipos({ tipo_tabla: "REGIMEN_ADUANAL" });

    const unidadesPeso = useMemo(() => {
        const items = tiposMedida.data || [];
        const pesoCandidates = items.filter((t) => {
            const nomen = String(t.nomenclatura || "").toUpperCase();
            const label = String(t.nomTipo || t.label || t.nom_tipo || "").toUpperCase();
            if (nomen === "PESO") return true;
            if (label.includes("PESO")) return true;
            if (label.includes("KG") || label.includes("KILOGRAM") || label.includes("LB") || label.includes("LBS") || label.includes("TON")) return true;
            return false;
        });
        return pesoCandidates.length > 0 ? pesoCandidates : items;
    }, [tiposMedida.data]);

    // usar el prop directo primero; fallback a embarqueData para compatibilidad
    const { data: cargas = [], refetch: refetchCargas } = useCoordinacionCargas(embarqueId);
    const queryClient = useQueryClient();

    const refreshCargas = async () => {
        if (!embarqueId) {
            return;
        }

        await invalidateCoordinacionCargas(queryClient, String(embarqueId));
        await refetchCargas();
    };

    const { mutateAsync: insertarCoordinacionCarga } = useInsertarCoordinacionCarga();
    const { mutateAsync: actualizarCoordinacionCarga } = useActualizarCoordinacionCarga();
    const { mutateAsync: eliminarCoordinacionCarga } = useEliminarCoordinacionCarga({ embarque_id: embarqueId });
    const embarqueCodCc =
        embarqueData?.cencos_id ??
        embarqueData?.CENCOS_ID ??
        embarqueData?.cod_cc ??
        embarqueData?.COD_CC ??
        null;
    const { recalcularConCargas } = useRecalcularEmbarqueConCargas({ embarqueId, cod_cc: embarqueCodCc });

    const [filas, setFilas] = useState([]);

    const [calculatorOpen, setCalculatorOpen] = useState(false);
    const [calculatorContext, setCalculatorContext] = useState({
        rowIndex: null,
        initialValues: {},
        newRowSetter: null,
    });

    const handleOpenCalculator = (rowOrIndex) => {
        let index = null;
        let initialValues = {};
        let newRowSetter = null;

        if (typeof rowOrIndex === "number") {
            index = rowOrIndex;
        } else if (typeof rowOrIndex === "object") {
            initialValues = {
                cantidad: rowOrIndex.cantidad,
                volumenTotal: rowOrIndex.volumenTotal,
                pesoTotal: rowOrIndex.pesoTotal,
                largo: rowOrIndex.largo,
                alto: rowOrIndex.alto,
                ancho: rowOrIndex.ancho,
            };

            if (rowOrIndex.__isNewRow && typeof rowOrIndex.__setNewRow === "function") {
                newRowSetter = rowOrIndex.__setNewRow;
            }

            if (rowOrIndex._index !== undefined && rowOrIndex._index !== null) {
                index = rowOrIndex._index;
            } else {
                index = filas.findIndex(
                    (f) =>
                        f._gridId === rowOrIndex._gridId ||
                        f.embCargaId === rowOrIndex.embCargaId,
                );
            }
        }

        if (typeof index === "number" && index >= 0) {
            initialValues = {
                cantidad: filas[index]?.cantidad,
                volumenTotal: filas[index]?.volumenTotal,
                pesoTotal: filas[index]?.pesoTotal,
                largo: filas[index]?.largo,
                alto: filas[index]?.alto,
                ancho: filas[index]?.ancho,
            };
        }

        setCalculatorContext({
            rowIndex: typeof index === "number" && index >= 0 ? index : null,
            initialValues,
            newRowSetter,
        });
        setCalculatorOpen(true);
    };

    const round2 = (n) => {
        if (n === null || n === undefined || n === "") return n;
        const num = Number(n);
        return Number.isNaN(num) ? n : Number.parseFloat(num.toFixed(2));
    };

    const handleApplyCalculator = ({ pesoTotal, volumenTotal, cantidad, largo, alto, ancho }) => {
        const cantidadRedondeada = cantidad === undefined ? cantidad : round2(cantidad);
        const volumenRedondeado = round2(volumenTotal);
        const pesoRedondeado = round2(pesoTotal);

        const dims = {};
        if (largo !== undefined) dims.largo = round2(largo);
        if (alto !== undefined) dims.alto = round2(alto);
        if (ancho !== undefined) dims.ancho = round2(ancho);

        if (typeof calculatorContext.newRowSetter === "function") {
            calculatorContext.newRowSetter((prev) => ({
                ...prev,
                cantidad: cantidadRedondeada ?? prev.cantidad,
                volumenTotal: volumenRedondeado,
                pesoTotal: pesoRedondeado,
                ...dims,
            }));
        } else if (calculatorContext.rowIndex !== null) {
            updateFila(calculatorContext.rowIndex, "pesoTotal", pesoRedondeado);
            updateFila(calculatorContext.rowIndex, "volumenTotal", volumenRedondeado);
            if (cantidad !== undefined) {
                updateFila(calculatorContext.rowIndex, "cantidad", cantidadRedondeada);
            }
            if (dims.largo !== undefined) updateFila(calculatorContext.rowIndex, "largo", dims.largo);
            if (dims.alto !== undefined) updateFila(calculatorContext.rowIndex, "alto", dims.alto);
            if (dims.ancho !== undefined) updateFila(calculatorContext.rowIndex, "ancho", dims.ancho);
        }

        setCalculatorOpen(false);
        setCalculatorContext({ rowIndex: null, initialValues: {}, newRowSetter: null });
    };

    useEffect(() => {
        if (Array.isArray(cargas) && cargas.length > 0) {
            setFilas(
                cargas.map((c, idx) => ({
                    embCargaId: c.embCargaId ?? c.EMB_CARGA_ID ?? c.id ?? c.ID ?? null,
                    rubroId: c.rubroId ?? c.RUBRO_ID ?? null,
                    paisOrigenId: c.paisOrigenId ?? c.PAIS_ID_ORIGEN ?? c.COD_PAIS_ORIGEN_CARGA ?? c.PAIS_ID_ORIGEN_CARGA ?? "",
                    descripcion: c.descripcionCarga || c.DESCRIPCION_CARGA || "",
                    valor: c.valor ?? c.VALOR ?? "",
                    tipoEmbalaje: c.codTipoEmbalaje ?? c.tipoEmbalaje ?? c.TIPO_EMBALAJE ?? "",
                    partidaArancelaria: formatPartidaArancelaria(c.partidaArancelaria ?? c.PARTIDA_ARANCELARIA ?? ""),
                    regimenAduanal: c.regimenAduanal ?? c.REGIMEN_ADUANAL ?? "",
                    definitivoGeneral: String(c.definitivoGeneral ?? c.DEFINITIVO_GENERAL ?? "").toUpperCase() === "S" ? "S" : "N",
                    cantidad: c.bultos ?? c.BULTOS ?? "",
                    pesoTotal: c.peso ?? c.PESO ?? "",
                    largo: c.largo ?? c.LARGO ?? "",
                    alto: c.alto ?? c.ALTO ?? "",
                    ancho: c.ancho ?? c.ANCHO ?? "",
                    volumenTotal: (() => {
                        const existingVol = Number(c.volumen ?? c.metrosCubicos ?? c.METROS_CUBICOS ?? 0);
                        const computedVol = computeVolumenFromDims({
                            largo: c.largo ?? c.LARGO ?? 0,
                            alto: c.alto ?? c.ALTO ?? 0,
                            ancho: c.ancho ?? c.ANCHO ?? 0,
                            cantidad: c.bultos ?? c.BULTOS ?? 0,
                        });
                        if (existingVol > 0) return Number.isFinite(existingVol) ? Number(existingVol) : computedVol;
                        return computedVol;
                    })(),
                    unidadMedida: String(c.tipoUnidadMedidaId ?? c.TIPO_ID_UNIDAD_MEDIDA ?? ""),
                    unidadPeso: String(c.tipoUnidadMedidaId ?? c.TIPO_ID_UNIDAD_MEDIDA ?? ""),
                    cw: c.cw ?? c.CW ?? "",

                    _gridId: c.embCargaId || `temp_id_${idx}`,
                })),
            );
        }
    }, [cargas]);

    // validity rules for CTS: require at least one carga with description + valor filled
    useEffect(() => {
        if (!Array.isArray(filas) || filas.length === 0) {
            onValidityChange?.(false);
            return;
        }

        const anyValid = filas.some((f) => {
            const desc = String(f.descripcion || "").trim();
            const val = f.valor !== undefined && f.valor !== null ? String(f.valor).trim() : "";
            return desc !== "" && val !== "";
        });

        onValidityChange?.(anyValid);
    }, [filas, onValidityChange]);

    useEffect(() => {
        // Stay loading until embarqueData has arrived AND catalogs are fetched.
        onLoadingChange?.(!embarqueData || isLoadingPaises || isLoadingTiposEmbalaje || isLoadingRegimenAduanal);
    }, [embarqueData, isLoadingPaises, isLoadingTiposEmbalaje, isLoadingRegimenAduanal, onLoadingChange]);

    // Effect to auto-fill unit if missing
    useEffect(() => {
        if (unidadesPeso.length > 0) {
            const defaultUnit = String(unidadesPeso[0].value ?? "");
            setFilas(prev => prev.map(f => {
                if (!f.unidadPeso && !f.unidadMedida) return { ...f, unidadPeso: defaultUnit };
                return f;
            }));
        }
    }, [unidadesPeso]);

    const normalizeVal = (val) => {
        if (val && typeof val === "object" && !Array.isArray(val)) {
            if ("value" in val) return val.value;
            // fallback: if it has label or others, return original
        }
        return val;
    };

    // validación de una sola fila; devuelve true si cumple las reglas y puede enviarse
    const validarFila = (fila) => {
        const filaTocada = Boolean(
            fila.paisOrigenId ||
            String(fila.descripcion || "").trim() ||
            fila.valor ||
            fila.cantidad ||
            fila.volumenTotal ||
            fila.pesoTotal,
        );
        if (!filaTocada) return false; // no se considera válida si está vacía

        const unidadPesoDef = String(unidadesPeso?.[0]?.value ?? "");
        const unidadPesoActual = String(fila.unidadPeso || fila.unidadMedida || unidadPesoDef || "").trim();
        const unidadPesoOk = unidadPesoActual !== "";
        const valorOk = fila.valor !== "" && Number(fila.valor) > 0;
        const cantidad = Number(fila.cantidad);
        const cantidadOk = Number.isInteger(cantidad) && cantidad > 0;
        const volumenIngresado = Number(fila.volumenTotal);
        const volumenCalculado = computeVolumenFromDims(fila);
        const volumenOk = (fila.volumenTotal !== "" && volumenIngresado > 0) || volumenCalculado > 0;
        const pesoOk = fila.pesoTotal !== "" && Number(fila.pesoTotal) > 0;
        return unidadPesoOk && valorOk && cantidadOk && volumenOk && pesoOk;
    };

    const updateFila = (idx, field, value) => {
        const valToStore = value && typeof value === "object" && !Array.isArray(value) ? value : normalizeVal(value);
        setFilas((prev) =>
            prev.map((fila, i) => {
                if (i !== idx) return fila;

                const updatedFila = { ...fila, [field]: valToStore };

                if (["largo", "alto", "ancho", "cantidad"].includes(field)) {
                    const volumenCalculado = computeVolumenFromDims(updatedFila);
                    updatedFila.volumenTotal = volumenCalculado > 0 ? round2(volumenCalculado) : "";
                }

                return updatedFila;
            }),
        );
    };

    // función auxiliar para construir el payload que usan tanto el guardado masivo
    // como el guardado de una fila individual.
    const buildPayload = (fila) => {
        const cantidad = Number.parseInt(fila.cantidad, 10) || 0;
        const pesoTotal = Number(fila.pesoTotal ?? 0);
        const volumenTotalIngresado = Number(fila.volumenTotal ?? 0);
        const volumenTotalCalculado = computeVolumenFromDims(fila);
        const volumenTotal = volumenTotalIngresado > 0 ? volumenTotalIngresado : volumenTotalCalculado;
        const largo = Number.parseFloat(fila.largo ?? 0) || 0;
        const alto = Number.parseFloat(fila.alto ?? 0) || 0;
        const ancho = Number.parseFloat(fila.ancho ?? 0) || 0;
        const volumenMetrosCubicos = (largo > 0 && alto > 0 && ancho > 0) ? Number.parseFloat(((largo * alto * ancho) / 1000000).toFixed(6)) : 0;
        const unidadPesoIdRaw = normalizeUnidad(fila.unidadPeso, "");
        const unidadPesoId = unidadPesoIdRaw === null || unidadPesoIdRaw === undefined ? "" : String(unidadPesoIdRaw);
        const unidadMedidaIdRaw = normalizeUnidad(fila.unidadMedida, "");
        const unidadMedidaId = unidadMedidaIdRaw === null || unidadMedidaIdRaw === undefined ? "" : Number(unidadMedidaIdRaw) || 0;
        const codTipoUnidadMedida = unidadPesoId ? Number.parseInt(unidadPesoId, 10) || 0 : (Number(unidadMedidaId) || 0);

        // si la fila viene de la tabla nueva podría incluir el booleano `definitivoGeneralBool`
        let definitivoGeneralBoolValue = "N";
        if (fila.definitivoGeneralBool !== undefined) {
            definitivoGeneralBoolValue = fila.definitivoGeneralBool ? "S" : "N";
        }
        const definitivoRaw = fila.definitivoGeneral ?? definitivoGeneralBoolValue;

        const cwValue = fila.cw !== undefined && fila.cw !== null && String(fila.cw).trim() !== ""
            ? Number(fila.cw)
            : pesoTotal;

        const tipoEmbalajeRaw = fila.tipoEmbalaje ?? "";
        const tipoEmbalajeLabel = (() => {
            if (tipoEmbalajeRaw === null || tipoEmbalajeRaw === undefined || tipoEmbalajeRaw === "") return "";
            const found = (tiposEmbalaje || []).find(
                (t) => String(t.value ?? t.codTipo ?? t.cod_tipo ?? "") === String(tipoEmbalajeRaw),
            );
            return found ? (found.label ?? found.nomTipo ?? found.nom_tipo ?? String(tipoEmbalajeRaw)) : String(tipoEmbalajeRaw);
        })();

        // Documentación de campos de Coordinación de Carga:
        // - En la entidad backend se usa `tipo_embalaje` para el texto descriptivo del embalaje.
        // - En la UI se mantiene como `tipoEmbalaje` para enlazar con la tabla editable y las opciones de embalaje.
        return {
            embarque_id: Number.parseInt(embarqueId, 10) || 0,
            rubro_id: fila.rubroId || null,
            bultos: cantidad,
            cod_tipo_unidad_medidad: codTipoUnidadMedida,
            tipo_id_unidad_medida: codTipoUnidadMedida,
            peso: pesoTotal,
            cw: cwValue,
            char_w: cwValue,
            volumen: volumenTotal,
            metros_cubicos: volumenMetrosCubicos,
            largo: largo,
            alto: alto,
            ancho: ancho,
            valor: Number(fila.valor) || 0,
            estado_cod: 1,
            descripcion_carga: fila.descripcion || "",
            cod_pais_origen_carga: normalizeVal(fila.paisOrigenId) || "",
            partida_arancelaria: String(fila.partidaArancelaria ?? "").replace(/\./g, ""),
            regimen_aduanal: fila.regimenAduanal ?? "",
            cod_tipo_embalaje: (tipoEmbalajeRaw !== "" && tipoEmbalajeRaw !== null) ? (Number(tipoEmbalajeRaw) || null) : null,
            tipo_embalaje: tipoEmbalajeLabel,
            definitivo_general: String(definitivoRaw).toLowerCase() === "s" ? "s" : "n",
        };
    };

    // guardar una fila individualmente (se utiliza al pulsar + en la fila nueva).
    const saveFila = async (fila, index) => {
        // antes de intentar persistir verificamos que la fila tenga datos válidos
        if (!validarFila(fila)) {
            // fila inválida, no guardamos
            throw new Error("Fila inválida");
        }

        try {
            const payload = buildPayload(fila);
            const filaOriginal = fila.embCargaId
                ? cargas.find((item) => String(item.embCargaId ?? item.EMB_CARGA_ID ?? item.id ?? item.ID) === String(fila.embCargaId))
                : null;
            const requiereRecalculo = !fila.embCargaId || !filaOriginal || didCargaMetricsChange(fila, filaOriginal);
            const filasActualizadas = Array.isArray(filas)
                ? filas.map((currentFila, currentIndex) => (currentIndex === index ? { ...currentFila, ...fila } : currentFila))
                : [];

            if (fila.embCargaId) {
                await actualizarCoordinacionCarga({
                    ...payload,
                    emb_carga_id: Number.parseInt(fila.embCargaId, 10) || 0,
                });
            } else {
                const res = await insertarCoordinacionCarga(payload);
                // si el backend devuelve identificador, actualizamos la fila local
                if (res && (res.emb_carga_id || res.EMB_CARGA_ID)) {
                    const newId = res.emb_carga_id || res.EMB_CARGA_ID;
                    setFilas((prev) =>
                        prev.map((f, i) => (i === index ? { ...f, embCargaId: newId } : f)),
                    );
                }
            }

            // después de un guardado exitoso solicitamos recarga de datos
            if (typeof refreshCargas === "function") {
                refreshCargas().catch(() => {
                    // no queremos bloquear el flujo si falla el refetch
                });
            }

            if (requiereRecalculo) {
                recalcularConCargas(filasActualizadas).catch((err) => {
                    console.error("Error al recalcular embarque tras guardar carga:", err);
                });
            }

            // fila guardada correctamente
        } catch (err) {
            console.error("Error guardando fila individual:", err);
            // error al guardar fila
            throw err;
        }
    };

    const addFila = async (nueva = null) => {
        if (!nueva || typeof nueva !== "object") return;

        const unidadPesoDef = String(unidadesPeso?.[0]?.value ?? "");
        const fila = { ...createEmptyRow(), unidadPeso: unidadPesoDef };

        Object.keys(nueva).forEach((k) => {
            if (k === "definitivoGeneralBool") {
                fila.definitivoGeneral = nueva[k] ? "S" : "N";
            } else {
                fila[k] = normalizeVal(nueva[k]);
            }
        });
        delete fila.definitivoGeneralBool;

        if (!validarFila(fila)) {
            throw new Error("Fila inválida");
        }

        try {
            const payload = buildPayload(fila);
            await insertarCoordinacionCarga(payload);
            if (typeof refreshCargas === "function") {
                await refreshCargas();
            }

            // recalcular embarque incluyendo la nueva fila en los totales
            const filasConNueva = [...filas, fila];
            recalcularConCargas(filasConNueva).catch((err) => {
                console.error("Error al recalcular embarque tras insertar carga:", err);
            });
        } catch (err) {
            console.error("Error al insertar carga:", err);
            throw err;
        }
    };

    const removeFila = (idx) => {
        setFilas((prev) => {
            const next = prev.filter((_, i) => i !== idx);
            return next;
        });
    };

    // when user presses delete on a row, optionally call the API first
    const handleRowDelete = (row, idx) => {
        // return a promise so the table component can wait before removing
        if (row?.embCargaId) {
            return eliminarCoordinacionCarga({ emb_carga_id: Number(row.embCargaId) })
                .then(async () => {
                    if (typeof refreshCargas === "function") {
                        await refreshCargas().catch(() => { });
                    }
                    // recalcular embarque con los totales sin la fila eliminada
                    const filasRestantes = filas.filter((_, i) => i !== idx);
                    recalcularConCargas(filasRestantes).catch((err) => {
                        console.error("Error al recalcular embarque tras eliminar carga:", err);
                    });
                })
                .catch((err) => {
                    console.error("Error eliminando carga:", err);
                    // resolve anyway so UI flow continues
                });
        }
        // nothing to call on backend, resolve immediately
        return Promise.resolve();
    };

    const filasIncompletas = useMemo(() =>
        filas
            .map((f, i) => ({ fila: f, index: i }))
            .filter(({ fila }) => fila.embCargaId && getCamposFaltantes(fila).length > 0),
        [filas],
    );

    const incompleteRowIds = useMemo(
        () => new Set(filasIncompletas.map(({ fila }) => fila._gridId)),
        [filasIncompletas],
    );

    const totalCantidad = filas.reduce((s, it) => s + (Number.parseInt(it.cantidad, 10) || 0), 0);
    const totalVolumen = filas.reduce((s, it) => s + (Number.parseFloat(it.volumenTotal) || 0), 0);
    const totalPeso = filas.reduce((s, it) => s + (Number.parseFloat(it.pesoTotal) || 0), 0);
    const totalCW = filas.reduce((s, it) => s + (Number.parseFloat(it.cw) || 0), 0);

    return (
        <Box>
            <BannerInformativo
                ocultar={filasIncompletas.length === 0}
                severidad="warning"
                titulo="Información obligatoria incompleta"
                mensaje={(
                    <>
                        Da click en{" "}
                        <Icon
                            className="c-ver"
                            sx={{
                                fontSize: 12,
                                color: (theme) => (theme.palette.mode === "dark" ? "#fff" : undefined),
                            }}
                        />{" "}
                        y completa los datos obligatorios.
                    </>
                )}
            />

            <Card variant="outlined" sx={{ mt: 2 }}>
                <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                        Totales
                    </Typography>

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 2 }}>
                        <Box sx={{ display: "flex", gap: 3, alignItems: "center", flexWrap: "wrap" }}>
                            <Typography variant="body2">
                                Cantidad: <strong>{totalCantidad}</strong>
                            </Typography>
                            <Typography variant="body2">
                                Peso volumétrico total (kg): <strong>{Number(totalVolumen).toFixed(2)}</strong>
                            </Typography>
                            <Typography variant="body2">
                                Peso: <strong>{Number(totalPeso).toFixed(2)}</strong>
                            </Typography>
                            <Typography variant="body2">
                                CW: <strong>{Number(totalCW).toFixed(2)}</strong>
                            </Typography>
                        </Box>
                    </Box>

                    <TablaCargasEditable
                        filas={filas}
                        isLoadingPaises={isLoadingPaises}
                        paises={paises}
                        regimenAduanalOptions={regimenAduanalOptions}
                        updateFila={updateFila}
                        removeFila={removeFila}
                        addFila={addFila}
                        onRowCreate={addFila}
                        hideUnidadVolumetrica={true}
                        onRowSave={(row, index) => saveFila(row, index)}
                        onRowDelete={handleRowDelete}
                        onOpenCalculator={handleOpenCalculator}
                        onRefresh={refreshCargas}
                        invalidateQueryKeys={["coordinacion-cargas", String(embarqueId)]}
                        tiposEmbalaje={tiposEmbalaje}
                        isLoadingTiposEmbalaje={isLoadingTiposEmbalaje}
                        incompleteRowIds={incompleteRowIds}
                        showId={false}
                        getCamposFaltantes={getCamposFaltantes}
                        columnasVisibles={["_estado", "descripcion", "volumenTotal", "cw"]}
                    />
                </CardContent>
            </Card>

            <CalculadoraCargas
                open={calculatorOpen}
                onClose={() => {
                    setCalculatorOpen(false);
                    setCalculatorContext({ rowIndex: null, initialValues: {}, newRowSetter: null });
                }}
                onApply={handleApplyCalculator}
                initialValues={calculatorContext.initialValues}
            />
        </Box>
    );
};

CargasSection.propTypes = {
    embarqueId: PropTypes.number,
    onValidityChange: PropTypes.func,
    onLoadingChange: PropTypes.func,
};

export default CargasSection;
