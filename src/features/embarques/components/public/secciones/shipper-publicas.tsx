"use client";

import { NIT_COD_IDENTIFICACION, TIPO_ENTIDAD } from "@/features/embarques/lib/constantes";
import {
  EntidadPublicFormSection,
  type EntidadPublicFormSectionProps,
} from "./entidad-public-form/entidad-public-form-section";
import type { EntidadPublicConfig } from "./entidad-public-form/model";

const SHIPPER_READ_ONLY_FIELDS = new Set([
  "entidad_nombre",
  "entidad_pais",
  "direccion_recoleccion_ciudad",
  "entidad_industria",
  "direccion_recoleccion",
  "direccion_recoleccion_pais",
  "direccion_recoleccion_depto",
  "direccion_recoleccion_muni",
  "_contacto_tipo_list",
  "entidad_contacto_nombre",
  "entidad_contacto_email",
  "entidad_contacto_telefono",
  "entidad_nit",
]);

const SHIPPER_CONFIG: EntidadPublicConfig = {
  title: "Shipper",
  sectionLabel: "Información",
  aliases: new Set(["SHIPPER", "CONSIGNOR", "REMITENTE", "EXPORTADOR", "CLIENTE"]),
  tipo: TIPO_ENTIDAD.shipper,
  nitCodIdentificacion: NIT_COD_IDENTIFICACION.shipper,
  addressDataKey: "direccionRecoleccion",
  phoneDataKey: "telefono",
  // G13: el legacy SÍ exige NIT para Shipper (hideIdentificacion: false,
  // explícito en shipperPublicas.jsx) igual que para Consignatario.
  hideIdentificacion: false,
  // El shipper no ofrece "Nuevo" salvo para cancelar el modo nueva entidad.
  hideNuevoEntidad: true,
  // La información de la entidad, su dirección y su NIT provienen del
  // registro relacionado; el cliente solo puede consultar estos datos.
  readOnlyFields: SHIPPER_READ_ONLY_FIELDS,
  // La fuente autoritativa del shipper es la relación 155, no el maestro del
  // cliente (que el endpoint público devolvería aunque se pidiera otro id).
  datosRelacionadosCodTipo: TIPO_ENTIDAD.shipper,
  useEntidadFallback: false,
  dialogs: { entidad: "Crear Entidad (Shipper)" },
};

type Props = Omit<EntidadPublicFormSectionProps, "config">;

export default function ShipperPublicas(props: Props) {
  return <EntidadPublicFormSection config={SHIPPER_CONFIG} {...props} />;
}
