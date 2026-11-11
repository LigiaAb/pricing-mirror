import type { Metodo } from "@/features/pricing/shared";
import type { Servicio } from "./servicios";

export type SelectOptionBase = {
  value: string | number;
  label: string;
  [key: string]: unknown;
};

export type FilaServicioMetodo = Omit<Partial<Servicio>, "cod_servicio" | "cod_estado"> &
  Omit<Partial<Metodo>, "cod_servicio" | "cod_estado"> & {
    cod_servicio?: string | number | null;
    cod_estado?: string | number | null;

    cod_empresa?: number | null;
    cod_cc?: number | null;

    metodoCalculo?: {
      cod_metodo?: string | number;
      label?: string;
    } | null;

    id?: string | number;
    fechaInicio?: Date | null;
    fechaFin?: Date | null;
    ultima_fecha_modificacion?: Date | null;
    cod_tipo_metodo?: string | number | null;
    tipoTransporte?: {
      nomTipo?: string;
      nom_tipo?: string;
    } | null;

    metodo?: {
      cod_metodo?: string | number;
      label?: string;
    } | null;

    porVencer?: boolean;
    vencido?: boolean;

    ultimoUsuario?: string | undefined | null;
  };
export type { OpcionEntidad as OptionEntidad } from "@/features/pricing/shared";
