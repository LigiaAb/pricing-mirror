"use client";

import { NIT_COD_IDENTIFICACION, TIPO_ENTIDAD } from "@/features/embarques/lib/constantes";
import {
  EntidadPublicFormSection,
  type EntidadPublicFormSectionProps,
} from "./entidad-public-form/entidad-public-form-section";
import type { EntidadPublicConfig } from "./entidad-public-form/model";

const CONSIGNATARIO_CONFIG: EntidadPublicConfig = {
  title: "Consignatario",
  sectionLabel: "Información",
  aliases: new Set(["CONSIGNATARIO", "CONSIGNEE", "DESTINATARIO"]),
  tipo: TIPO_ENTIDAD.consignatario,
  nitCodIdentificacion: NIT_COD_IDENTIFICACION.consignatario,
  addressDataKey: "direccion",
  phoneDataKey: "telefonos",
  dialogs: { entidad: "Crear Entidad (Consignatario)" },
};

type Props = Omit<EntidadPublicFormSectionProps, "config">;

export default function ConsignatarioPublicas(props: Props) {
  return <EntidadPublicFormSection config={CONSIGNATARIO_CONFIG} {...props} />;
}
