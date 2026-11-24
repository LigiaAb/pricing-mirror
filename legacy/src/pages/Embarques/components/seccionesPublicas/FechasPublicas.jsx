import { useEffect, useMemo, useState, useRef } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { FechasForm } from "@/pages/Embarques/components/secciones/fechas";
import BannerInformativo from "@/pages/Embarques/components/banner";
import { getModifiedFields } from "./validation";

const fechaFields = [
    { key: "fecha_recoleccion", label: "Fecha de Recolección", type: "date", colSpan: "span 6", required: true },
];

const normalizeToDate = (value) => {
    if (!value) return "";
    const str = String(value).trim();
    if (!str) return "";
    if (str.includes("T")) return str.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    return "";
};

const FechasPublicas = ({
    data = {},
    isLoading = false,
    onValidityChange = null,
    onValuesChange = null,
    onSave = null,
    isSaving = false,
}) => {
    const initialDate = normalizeToDate(data?.fechaRecoleccion || data?.fecha_recoleccion || "");
    const [values, setValues] = useState({ fecha_recoleccion: initialDate });

    const dataSig = useMemo(() => JSON.stringify({ d: initialDate }), [initialDate]);
    const lastDataSig = useRef(null);
    useEffect(() => {
        if (lastDataSig.current === dataSig) return;
        lastDataSig.current = dataSig;
        setValues({ fecha_recoleccion: initialDate });
    }, [dataSig, initialDate]);

    const isValid = Boolean(values.fecha_recoleccion);

    const initValues = useMemo(
        () => ({ fecha_recoleccion: initialDate }),
        [initialDate],
    );

    const hasChanges = useMemo(() => {
        return values.fecha_recoleccion !== initValues.fecha_recoleccion;
    }, [values, initValues]);

    const lastValiditySig = useRef(null);
    useEffect(() => {
        if (typeof onValidityChange !== "function") return;
        const next = isValid && !hasChanges ? true : isValid ? "pending" : false;
        const sig = `${next}|${hasChanges}`;
        if (lastValiditySig.current === sig) return;
        lastValiditySig.current = sig;
        onValidityChange(next);
    }, [isValid, hasChanges, onValidityChange]);

    const lastReportedFechasSig = useRef(null);
    useEffect(() => {
        if (typeof onValuesChange !== "function") return;
        // Reportar solo el propio campo (fecha_recoleccion) como modificado, no la
        // lista completa de `data._modificados` del shipper: este componente no
        // conoce ni conserva los valores de los otros campos del shipper, así que
        // heredar su `_modificados` hacía que `handleGuardarSeccion` reconstruyera
        // carta_shipper con esos campos "modificados" pero sin valor, borrándolos.
        const modificados = getModifiedFields(initValues, values);
        const sig = JSON.stringify({ v: values, m: modificados });
        if (lastReportedFechasSig.current === sig) return;
        lastReportedFechasSig.current = sig;
        onValuesChange({
            ...values,
            _modificados: modificados,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values, initValues, data, onValuesChange]);

    if (isLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    return (
        <>
            <BannerInformativo
                titulo="Aún no se ha guardado"
                mensaje="Complete los datos obligatorios para guardar."
                severidad="info"
                ocultar={isValid && !hasChanges}
            />
            <FechasForm
                fields={fechaFields}
                initialValues={values}
                onValuesChange={setValues}
                onSave={onSave}
                isSaving={isSaving}
            />
        </>
    );
};

export default FechasPublicas;
