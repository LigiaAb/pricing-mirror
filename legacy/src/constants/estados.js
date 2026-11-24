export const CODS_ESTADOS = {
  ACTIVO: 1,
  INACTIVO: 2,
  ANULADO: 4,
  PENDIENTE: 5,

  SOLICITADO: 20,

  INGRESADO: 51,
  ENVIADO: 52,
  RECHAZADO: 53,
  CONFIRMADO: 54,

  FINALIZADO: 63,

  AUTORIZADO: 81,
  RECHAZADO_GLOBAL: 82,
};

export const COLORES_ESTADOS = {
  [CODS_ESTADOS.ACTIVO]: "green.main",
  [CODS_ESTADOS.INACTIVO]: "red.main",
  [CODS_ESTADOS.ANULADO]: "red.main",
  [CODS_ESTADOS.PENDIENTE]: "text.main",
  [CODS_ESTADOS.SOLICITADO]: "text.main",

  [CODS_ESTADOS.INGRESADO]: "green.main",
  [CODS_ESTADOS.ENVIADO]: "success.main",
  [CODS_ESTADOS.RECHAZADO]: "red.main",
  [CODS_ESTADOS.CONFIRMADO]: "text.main",

  [CODS_ESTADOS.FINALIZADO]: "text.main",

  [CODS_ESTADOS.AUTORIZADO]: "text.main",
  [CODS_ESTADOS.RECHAZADO_GLOBAL]: "red.main",
};

export const ICONOS_ESTADOS = {
  [CODS_ESTADOS.ACTIVO]: "c-cheque",
  [CODS_ESTADOS.SOLICITADO]: "c-cheque",
  [CODS_ESTADOS.INACTIVO]: "c-x1",
  [CODS_ESTADOS.ANULADO]: "c-cancelar",
  [CODS_ESTADOS.PENDIENTE]: "c-mail",

  [CODS_ESTADOS.INGRESADO]: "c-cheque",
  [CODS_ESTADOS.ENVIADO]: "c-mail",
  [CODS_ESTADOS.RECHAZADO]: "c-cancelar",
  [CODS_ESTADOS.CONFIRMADO]: "c-circulo-cheque",

  [CODS_ESTADOS.FINALIZADO]: "c-cheque",

  [CODS_ESTADOS.AUTORIZADO]: "c-circulo-cheque",
  [CODS_ESTADOS.RECHAZADO_GLOBAL]: "c-cancelar",
};
