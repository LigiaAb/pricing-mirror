import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import FormularioAlternativo from "../../../../../components/bpm/Formularios/FormularioAlternativo";
import {
    useFetchTipos,
    useInsertarEntidadContacto,
    useActualizarEntidadContacto,
    useFetchEntidadContacto,
} from "@/hooks/Bpm";

const NuevoContactoEntidad = ({
    entidadId,
    contactoId = null,
    initialValues = {},
    codTipo = null,
    codEmp = null,
    codCc = null,
    onSubmit = () => { },
    readOnly = false,
}) => {
    const queryClient = useQueryClient();
    const insertarContacto = useInsertarEntidadContacto();
    const actualizarContacto = useActualizarEntidadContacto();

    // obtener de Redux
    const { currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);
    const empresaActiva = currentEmpresa?.cod_empresa || null;
    const centroCostoActivo = currentCentroCosto?.cod_cc || null; // may be undefined


    const normalizedInitialValues = useMemo(() => {
        const vals = initialValues || {};
        return {
            entidadcontacto_nombre: vals.entidadcontacto_nombre || "",
            entidadcontacto_email: vals.entidadcontacto_email || "",
            entidadcontacto_telefono: vals.entidadcontacto_telefono || "",
            lista_cod_tipo: (() => {
                if (Array.isArray(vals.lista_cod_tipo)) {
                    return vals.lista_cod_tipo.map(String);
                }

                let raw = vals.data_entidad_contacto_tipo ?? [];
                if (typeof raw === "string") {
                    try {
                        raw = JSON.parse(raw);
                    } catch {
                        raw = [];
                    }
                }
                if (Array.isArray(raw)) {
                    return raw.map((t) => String(t.cod_tipo ?? t.COD_TIPO ?? t)).filter(Boolean);
                }
                return [];
            })(),
        };
    }, [initialValues]);

    const [formData, setFormData] = useState(() => ({
        ...normalizedInitialValues,
        id: contactoId,
    }));

    useEffect(() => {
        setFormData({
            ...normalizedInitialValues,
            id: contactoId,
        });
    }, [normalizedInitialValues, contactoId]);

    const isEditing = Boolean(contactoId);

    const { data: tiposData = [] } = useFetchTipos();
    const tiposOptions = useMemo(
        () =>
            tiposData
                .filter((t) => t.tipoTabla === "ENTIDAD_CONTACTOS")
                .map((t) => ({
                    value: t.codTipo || t.cod_tipo || t.COD_TIPO,
                    label:
                        t.nomTipo ||
                        t.nom_tipo ||
                        t.NOM_TIPO ||
                        t.tipo_descripcion ||
                        "",
                })),
        [tiposData],
    );

    // seleccionar un único tipo para autocompletar datos
    const tipoSeleccionado = formData.lista_cod_tipo[0] || null;
    const { data: contactosByTipo = [] } = useFetchEntidadContacto(
        { cod_tipo: tipoSeleccionado, entidad_id: entidadId },
        { enabled: Boolean(tipoSeleccionado && entidadId && !isEditing) }
    );

    // cuando cambia el resultado del fetch por tipo, rellenar los campos si hay un contacto existente
    useEffect(() => {
        if (contactosByTipo.length > 0) {
            const c = contactosByTipo[0];
            setFormData((prev) => {
                const next = {
                    ...prev,
                    entidadcontacto_nombre: c.entidadcontacto_nombre || prev.entidadcontacto_nombre,
                    entidadcontacto_email: c.entidadcontacto_email || prev.entidadcontacto_email,
                    entidadcontacto_telefono: c.entidadcontacto_telefono || prev.entidadcontacto_telefono,
                    id: c.entidadcontacto_id || prev.id,
                    lista_cod_tipo: prev.lista_cod_tipo,
                };

                if (
                    prev.entidadcontacto_nombre === next.entidadcontacto_nombre &&
                    prev.entidadcontacto_email === next.entidadcontacto_email &&
                    prev.entidadcontacto_telefono === next.entidadcontacto_telefono &&
                    prev.id === next.id
                ) {
                    return prev;
                }

                return next;
            });
        } else if (tipoSeleccionado && !isEditing) {
            setFormData((prev) => {
                if (
                    prev.entidadcontacto_nombre === "" &&
                    prev.entidadcontacto_email === "" &&
                    prev.entidadcontacto_telefono === "" &&
                    prev.id === null
                ) {
                    return prev;
                }
                return {
                    ...prev,
                    entidadcontacto_nombre: "",
                    entidadcontacto_email: "",
                    entidadcontacto_telefono: "",
                    id: null,
                };
            });
        }
    }, [contactosByTipo, tipoSeleccionado, isEditing]);

    const fields = useMemo(
        () => [
            {
                key: "lista_cod_tipo",
                label: "Tipo(s)",
                type: "checkboxes",
                options: tiposOptions,
                required: true,
                colSpan: "span 12",
                readOnly,
            },

            {
                key: "entidadcontacto_nombre",
                label: "Nombre",
                type: "text",
                required: true,
                colSpan: "span 12",
                readOnly,
            },
            {
                key: "entidadcontacto_email",
                label: "Email",
                type: "text",
                required: true,
                colSpan: "span 12",
                readOnly,
            },
            {
                key: "entidadcontacto_telefono",
                label: "Teléfono",
                type: "text",
                required: true,
                colSpan: "span 12",
                readOnly,
            },
        ],
        [tiposOptions, readOnly],
    );

    const validate = (vals) => {
        return (
            !!vals.entidadcontacto_nombre &&
            !!vals.entidadcontacto_email &&
            !!vals.entidadcontacto_telefono &&
            Array.isArray(vals.lista_cod_tipo) &&
            vals.lista_cod_tipo.length > 0
        );
    };

    const handleFieldChange = (id, val) => {
        setFormData((prev) => {
            if (prev[id] === val) return prev;
            return { ...prev, [id]: val };
        });
    };

    const handleSubmit = async (vals) => {
        if (!entidadId) {
            console.error("Missing entidadId when saving contacto");
            return;
        }

        const payload = {
            entidad_id: Number(entidadId),
            cod_estado: 1,
            entidadcontacto_nombre: vals.entidadcontacto_nombre,
            entidadcontacto_email: vals.entidadcontacto_email,
            entidadcontacto_telefono: vals.entidadcontacto_telefono,
            lista_cod_tipo: (vals.lista_cod_tipo),
            cod_emp: empresaActiva,
            cod_cc: centroCostoActivo,
        };

        try {
            let result;
            if (isEditing) {
                result = await actualizarContacto.mutateAsync({
                    ...payload,
                    entidadcontacto_id: Number(contactoId),
                });
            } else {
                result = await insertarContacto.mutateAsync(payload);
            }

            if (codTipo && entidadId) {
                queryClient.invalidateQueries({
                    queryKey: ["entidad-contacto", { cod_tipo: codTipo, entidad_id: entidadId }],
                });
            }

            if (onSubmit) onSubmit(result);
        } catch (error) {
            console.error("Error guardando contacto de entidad:", error);
        }
    };

    const titleText = isEditing ? "Editar Contacto" : "Nuevo Contacto";
    const submitLabel = isEditing ? "Guardar" : "Agregar";

    return (
        <FormularioAlternativo
            hideHeader
            title={titleText}
            fields={fields}
            initialValues={formData}
            onFieldChange={handleFieldChange}
            validate={validate}
            onSubmit={handleSubmit}
            labels={{ submit: submitLabel }}
            showSubmitButton={!readOnly}
        />
    );
};

NuevoContactoEntidad.propTypes = {
    entidadId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    contactoId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    initialValues: PropTypes.object,
    codTipo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    codEmp: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    codCc: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    onSubmit: PropTypes.func,
    readOnly: PropTypes.bool,
};

export default NuevoContactoEntidad;