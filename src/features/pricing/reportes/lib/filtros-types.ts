export type ReporteCrmId = "hit-rate" | "realizacion-de-precio" | "seleccione";

export type CamposReporte = {
  empresaCentroCosto?: boolean;
  usuario?: boolean;
  cliente?: boolean;
  fechas?: "opcionales" | "requeridas";
  tipoTransporte?: boolean;
  tipoPago?: boolean;
};

export type ConfiguracionReporte = {
  value: ReporteCrmId;
  label: string;
  descripcion: string;
  vista: ReporteCrmId;
  campos: CamposReporte;
  tabla?: boolean;
  graficas?: boolean;
};

export type SelectOption = {
  value: string | number;
  label: string;
} & Record<string, unknown>;

export type Filtros = {
  reporte: SelectOption | null;
  fecha_inicio: string;
  fecha_fin: string;
  cod_empresa: { nombre: string; codigo: number } | undefined; // opcional
  cod_cc: { nombre: string; codigo: number } | undefined; // opcional
  cod_tipo_transporte: SelectOption | null;
  cod_usuario?: SelectOption | null | undefined;
  cod_cliente?: SelectOption | null | undefined;
  cod_tipo_pago?: SelectOption | null | undefined;
};

export type filtrosNoLocales = Omit<
  Filtros & {
    cod_tipo_pago?: number | undefined;
  },
  "cod_tipo_transporte"
>;
