import { useEffect, useMemo, useState, useRef } from "react";
import PropTypes from "prop-types";
import { Box, Button, Icon, CircularProgress } from "@mui/material";
import { areRequiredFieldsFilled, getModifiedFields, unionModificados } from "./validation";
import { NotificacionesForm, NOTIFICACIONES_FIELDS } from "@/pages/Embarques/components/secciones/notificaciones";
import FormularioAlternativo, { ModernFormHeader } from "@/components/bpm/Formularios/FormularioAlternativo";
import BannerInformativo from "@/pages/Embarques/components/banner";

const NotificacionesPublicas = ({ data = {}, isLoading = false, onValidityChange = null, onValuesChange = null, onSave = null, isSaving = false, consignatarioData = {}, apiMode = "public" }) => {
    const readOnly = apiMode === "private";

    const fields = useMemo(
        () => NOTIFICACIONES_FIELDS.map((field) =>
            field.type === "section" ? field : { ...field, readOnly },
        ),
        [readOnly],
    );
    const [values, setValues] = useState({
        nombre: data?.nombre || "",
        email: data?.email || "",
        telefono: data?.telefono || "",
    });

    const dataSig = useMemo(() => JSON.stringify({
        nombre: data?.nombre || "",
        email: data?.email || "",
        telefono: data?.telefono || "",
    }), [data]);
    const lastDataSig = useRef(null);
    useEffect(() => {
        if (lastDataSig.current === dataSig) return;
        lastDataSig.current = dataSig;
        setValues({
            nombre: data?.nombre || "",
            email: data?.email || "",
            telefono: data?.telefono || "",
        });
    }, [dataSig, data]);

    const isValid = useMemo(
        () => areRequiredFieldsFilled(fields, values),
        [fields, values],
    );

    const initValues = useMemo(
        () => ({ nombre: data?.nombre || "", email: data?.email || "", telefono: data?.telefono || "" }),
        [data],
    );

    const hasChanges = useMemo(() => {
        return JSON.stringify(values) !== JSON.stringify(initValues);
    }, [values, initValues]);

    const validityState = readOnly
        ? (isValid ? true : false)
        : isValid && !hasChanges
            ? true
            : isValid
                ? "pending"
                : false;

    const lastValiditySig = useRef(null);
    useEffect(() => {
        if (typeof onValidityChange !== "function") return;
        const sig = `${validityState}|${hasChanges}`;
        if (lastValiditySig.current === sig) return;
        lastValiditySig.current = sig;
        onValidityChange(validityState);
    }, [validityState, hasChanges, onValidityChange]);

    const lastReportedNotifSig = useRef(null);
    useEffect(() => {
        if (typeof onValuesChange !== "function") return;
        const modificados = unionModificados(data?._modificados, getModifiedFields(initValues, values));
        const sig = JSON.stringify({ v: values, m: modificados });
        if (lastReportedNotifSig.current === sig) return;
        lastReportedNotifSig.current = sig;
        onValuesChange({
            ...values,
            _modificados: modificados,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [values, initValues, data, onValuesChange]);

    const handleCopiarConsignatario = () => {
        const contacto = consignatarioData?.contacto || "";
        const email = consignatarioData?.email || "";
        const telefono = consignatarioData?.telefonos || "";
        setValues((prev) => ({
            ...prev,
            nombre: contacto || prev.nombre,
            email: email || prev.email,
            telefono: telefono || prev.telefono,
        }));
    };

    if (isLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (readOnly) {
        return (
            <>
                <ModernFormHeader
                    icon="c-campana"
                    title="Notificaciones"
                    subtitle="Datos de contacto ingresados por el cliente."
                />
                <FormularioAlternativo
                    fields={fields}
                    initialValues={values}
                    showSubmitButton={false}
                    hideHeader
                    variant="modern"
                />
            </>
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
            <NotificacionesForm
                initialValues={values}
                onValuesChange={setValues}
                onSave={onSave}
                isSaving={isSaving}
                topContent={
                    <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 1 }}>
                        <Button size="small" variant="outlined" onClick={handleCopiarConsignatario} startIcon={<Icon className="c-copiar" sx={{ color: (theme) => (theme.palette.mode === "dark" ? "#fff" : undefined) }} fontSize="small" />}>
                            Copiar de consignatario
                        </Button>
                    </Box>
                }
            />
        </>
    );
};

NotificacionesPublicas.propTypes = {
    data: PropTypes.object,
    isLoading: PropTypes.bool,
    onValidityChange: PropTypes.func,
    onValuesChange: PropTypes.func,
    onSave: PropTypes.func,
    isSaving: PropTypes.bool,
    consignatarioData: PropTypes.object,
    apiMode: PropTypes.oneOf(["public", "private"]),
};

export default NotificacionesPublicas;
