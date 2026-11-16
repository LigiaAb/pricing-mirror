"use client";

/**
 * Opciones de los selectores de entidad/contacto y acciones "Nuevo" del
 * formulario público de entidad, incluidos los modos forzados: sin entidades
 * disponibles se fuerza "nueva entidad"; una entidad sin contactos fuerza
 * "nuevo contacto".
 */

import { type Dispatch, type SetStateAction, useMemo } from "react";
import type { AccionCampo, OpcionContacto } from "./fields";
import {
  type EntidadPublicConfig,
  type EntidadPublicFormValues,
  type JsonRecord,
  resolveEntidadNombre,
} from "./model";

export interface UseEntidadPublicOpcionesParams {
  config: EntidadPublicConfig;
  values: EntidadPublicFormValues;
  setValues: Dispatch<SetStateAction<EntidadPublicFormValues>>;
  selectedEntidadId: string | number | null;
  entidades: JsonRecord[];
  entidadesRelLoading: boolean;
  findEntidadById: (id: unknown) => JsonRecord | null;
  rawEntidadActual: JsonRecord | null;
  modoNuevaEntidad: boolean;
  setModoNuevaEntidad: (v: boolean) => void;
  modoNuevoContacto: boolean;
  setModoNuevoContacto: Dispatch<SetStateAction<boolean>>;
  limpiarCamposEntidad: (resetBaseline: boolean) => void;
  setOpenCrearEntidad: (v: boolean) => void;
}

export function useEntidadPublicOpciones({
  config,
  values,
  setValues,
  selectedEntidadId,
  entidades,
  entidadesRelLoading,
  findEntidadById,
  rawEntidadActual,
  modoNuevaEntidad,
  setModoNuevaEntidad,
  modoNuevoContacto,
  setModoNuevoContacto,
  limpiarCamposEntidad,
  setOpenCrearEntidad,
}: UseEntidadPublicOpcionesParams) {
  const entityOptions = useMemo(() => {
    const opciones = entidades
      .filter((ent) => ent.entidad_id && resolveEntidadNombre(ent))
      .map((ent) => ({
        value: ent.entidad_id as string | number,
        label: resolveEntidadNombre(ent),
      }));
    // El id seleccionado siempre debe tener opción visible aunque su
    // clasificación no matchee los aliases. En modo "nueva entidad" no se
    // inyecta nada: el selector queda vacío a propósito.
    const idsParaInyectar = modoNuevaEntidad
      ? []
      : [values.entidad_id, selectedEntidadId].filter(
          (id) => id !== undefined && id !== null && id !== "",
        );
    for (const id of idsParaInyectar) {
      if (opciones.some((opt) => String(opt.value) === String(id))) continue;
      const ent = findEntidadById(id);
      const nombre = resolveEntidadNombre(ent);
      if (nombre) opciones.unshift({ value: ent?.entidad_id as string | number, label: nombre });
    }
    return opciones;
  }, [entidades, values.entidad_id, selectedEntidadId, findEntidadById, modoNuevaEntidad]);

  // Sin entidades que ofrecer no tiene sentido un dropdown vacío: se fuerza el
  // modo "nueva entidad" (y por lo tanto "nuevo contacto").
  const sinEntidadesDisponibles = !entidadesRelLoading && entityOptions.length === 0;
  const forzarNuevaEntidad = modoNuevaEntidad || sinEntidadesDisponibles;

  const contactoOptions = useMemo((): OpcionContacto[] => {
    const contacts = Array.isArray(rawEntidadActual?.data_contactos)
      ? (rawEntidadActual.data_contactos as JsonRecord[])
      : [];
    if (contacts.length > 0) {
      return contacts.map((c) => ({
        value: String(c.entidadcontacto_id),
        label: String(c.entidadcontacto_nombre ?? ""),
        nombre: String(c.entidadcontacto_nombre ?? ""),
        email: String(c.entidadcontacto_email ?? ""),
        telefono: String(c.entidadcontacto_telefono ?? ""),
      }));
    }
    if (!values.entidadcontacto_id) return [];
    return [
      {
        value: String(values.entidadcontacto_id),
        label: values.entidad_contacto_nombre,
        nombre: values.entidad_contacto_nombre,
        email: values.entidad_contacto_email,
        telefono: values.entidad_contacto_telefono,
      },
    ];
  }, [
    rawEntidadActual,
    values.entidadcontacto_id,
    values.entidad_contacto_nombre,
    values.entidad_contacto_email,
    values.entidad_contacto_telefono,
  ]);

  const sinContactosDisponibles = Boolean(values.entidad_id) && contactoOptions.length === 0;
  const forzarNuevoContacto = modoNuevoContacto || forzarNuevaEntidad || sinContactosDisponibles;

  const nuevoEntityAction = useMemo(
    (): AccionCampo => ({
      visible: config.hideNuevoEntidad ? modoNuevaEntidad : true,
      enabled: true,
      nombre: modoNuevaEntidad ? "Cancelar" : "Nuevo",
      onClick: () => {
        if (modoNuevaEntidad) {
          setModoNuevaEntidad(false);
          setModoNuevoContacto(false);
          limpiarCamposEntidad(false);
          return;
        }
        limpiarCamposEntidad(true);
        setOpenCrearEntidad(true);
      },
    }),
    [
      modoNuevaEntidad,
      config.hideNuevoEntidad,
      limpiarCamposEntidad,
      setModoNuevaEntidad,
      setModoNuevoContacto,
      setOpenCrearEntidad,
    ],
  );

  // Solo tiene sentido alternar Nuevo/Cancelar cuando existe un selector de
  // contactos al que volver: si la entidad no tiene ninguno guardado
  // (sinContactosDisponibles) o es una entidad nueva (forzarNuevaEntidad), el
  // modo "nuevo contacto" queda forzado sin alternativa — "Cancelar" no
  // cancelaría nada, así que el botón se oculta en vez de mostrarse
  // deshabilitado o sin efecto.
  const puedeAlternarContacto = !forzarNuevaEntidad && !sinContactosDisponibles;

  const nuevoContactoAction = useMemo(
    (): AccionCampo => ({
      visible: puedeAlternarContacto,
      enabled: puedeAlternarContacto,
      nombre: modoNuevoContacto ? "Cancelar" : "Nuevo",
      onClick: () => {
        if (!puedeAlternarContacto) return;
        setModoNuevoContacto((prev) => !prev);
        setValues((prev) => ({
          ...prev,
          entidadcontacto_id: "",
          entidad_contacto_nombre: "",
          entidad_contacto_email: "",
          entidad_contacto_telefono: "",
          _contacto_tipo_list: [],
        }));
      },
    }),
    [puedeAlternarContacto, modoNuevoContacto, setModoNuevoContacto, setValues],
  );

  return {
    entityOptions,
    contactoOptions,
    sinEntidadesDisponibles,
    forzarNuevaEntidad,
    forzarNuevoContacto,
    nuevoEntityAction,
    nuevoContactoAction,
  };
}
