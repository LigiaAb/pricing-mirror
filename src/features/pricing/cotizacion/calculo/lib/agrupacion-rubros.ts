import { esRubroDueAgent, esRubroDueCarrier } from "./clasificacion-rubros";
import { RUBRO, TIPO_CALCULO, TIPO_TRANSPORTE } from "./constantes";

export type RubroAgrupable = {
  value?: string | number | null;

  cod_rubro?: string | number | null;
  cod_tipo_calculo?: string | number | null;

  es_flete?: boolean | null;

  clasificacion?: string | number | null;
  servicio_clasificacion?: string | number | null;

  servicio?: {
    clasificacion?: string | number | null;
    servicio_clasificacion?: string | number | null;
  } | null;
};

type GrupoRubroDefault = {
  nombre: string;
  orden: number;

  siempreAlFinal?: boolean;

  centrosCosto?: Array<string | number>;
  tiposTransporte?: Array<string | number>;

  rubros?: Array<string | number>;

  validar?: (item: RubroAgrupable) => boolean;
};

export const GRUPOS_RUBROS_DEFAULT: GrupoRubroDefault[] = [
  // AEREO
  {
    nombre: "Flete Aereo",
    orden: 1,

    centrosCosto: [16],
    tiposTransporte: [TIPO_TRANSPORTE.AEREO],

    validar: (item) => {
      return item?.es_flete === true || esRubroDueCarrier(item);
    },
  },

  {
    nombre: "Manejos Cropa",
    orden: 2,

    centrosCosto: [16],
    tiposTransporte: [TIPO_TRANSPORTE.AEREO],

    validar: (item) => {
      const esCobertura = Number(item?.cod_tipo_calculo) === TIPO_CALCULO.COBERTURA_MERCADERIA;

      return esRubroDueAgent(item) && !esCobertura;
    },
  },

  {
    nombre: "Cobertura",
    orden: 3,

    centrosCosto: [16],
    tiposTransporte: [TIPO_TRANSPORTE.AEREO],

    validar: (item) => {
      return Number(item?.cod_tipo_calculo) === TIPO_CALCULO.COBERTURA_MERCADERIA;
    },
  },

  // TERRESTRE
  {
    nombre: "FLETE",
    orden: 1,

    centrosCosto: [16],
    tiposTransporte: [TIPO_TRANSPORTE.TERRESTRE],

    validar: (item) => {
      return item?.es_flete === true; // || esRubroDueCarrier(item);
    },
  },
  {
    nombre: "FUEL",
    orden: 2,

    centrosCosto: [16],
    tiposTransporte: [TIPO_TRANSPORTE.TERRESTRE],

    validar: (item) => {
      return item?.cod_rubro === 17;
    },
  },
  {
    nombre: "CUTODIO",
    orden: 3,

    centrosCosto: [16],
    tiposTransporte: [TIPO_TRANSPORTE.TERRESTRE],

    validar: (item) => {
      return item?.cod_rubro === 80;
    },
  },
  {
    nombre: "CARTA PORTE",
    orden: 3,

    centrosCosto: [16],
    tiposTransporte: [TIPO_TRANSPORTE.TERRESTRE],

    validar: (item) => {
      return item?.cod_rubro === 79;
    },
  },
  {
    nombre: "GASTOS FRONTERA",
    orden: 3,

    centrosCosto: [16],
    tiposTransporte: [TIPO_TRANSPORTE.TERRESTRE],

    validar: (item) => {
      return item?.cod_rubro === 105;
    },
  },

  // MARITIMO
  {
    nombre: "Flete Maritimo",
    orden: 1,

    centrosCosto: [16],
    tiposTransporte: [TIPO_TRANSPORTE.MARITIMO],

    validar: (item) => {
      return item?.es_flete === true || esRubroDueCarrier(item);
    },
  },

  // IVA APLICA A TODOS LOS TIPOS TRANSPORTE

  {
    nombre: "IVA",
    orden: 4,

    siempreAlFinal: true,

    centrosCosto: [16],
    tiposTransporte: [TIPO_TRANSPORTE.AEREO, TIPO_TRANSPORTE.MARITIMO, TIPO_TRANSPORTE.TERRESTRE],

    rubros: [RUBRO.IVA],
  },
];

function cumpleCondicion(
  valores: Array<string | number> | undefined,
  valor: string | number | null | undefined,
) {
  if (!Array.isArray(valores) || valores.length === 0) {
    return true;
  }

  return valores.map(Number).includes(Number(valor));
}

function cumpleGrupo(grupo: GrupoRubroDefault, item: RubroAgrupable) {
  const codRubro = Number(item?.cod_rubro);

  if (Array.isArray(grupo.rubros) && grupo.rubros.map(Number).includes(codRubro)) {
    return true;
  }

  if (typeof grupo.validar === "function" && grupo.validar(item)) {
    return true;
  }

  return false;
}

export function obtenerGruposDefault({
  codCc,
  codTipoTransporte,
}: {
  codCc?: string | number | null;
  codTipoTransporte?: string | number | null;
}) {
  return GRUPOS_RUBROS_DEFAULT.filter((grupo) => {
    const aplicaCentroCosto = cumpleCondicion(grupo.centrosCosto, codCc);

    const aplicaTipoTransporte = cumpleCondicion(grupo.tiposTransporte, codTipoTransporte);

    return aplicaCentroCosto && aplicaTipoTransporte;
  });
}

export function construirAgrupacionAutomatica(
  items: RubroAgrupable[] = [],
  {
    codCc,
    codTipoTransporte,
  }: {
    codCc?: string | number | null;

    codTipoTransporte?: string | number | null;
  } = {},
) {
  const gruposIngresados: Record<
    string,
    {
      idDeGrupo: number;
      nombre: string;
    }
  > = {};

  const nombres: Record<string, string> = {};

  const grupos = obtenerGruposDefault({
    codCc: codCc ?? null,
    codTipoTransporte: codTipoTransporte ?? null,
  });

  const idsPorNombre = new Map<string, number>();

  let siguienteId = 1;

  const getIdGrupo = (nombreGrupo: string) => {
    const existente = idsPorNombre.get(nombreGrupo);

    if (existente != null) {
      return existente;
    }

    const id = siguienteId;

    idsPorNombre.set(nombreGrupo, id);

    nombres[String(id)] = nombreGrupo;

    siguienteId += 1;

    return id;
  };

  for (const item of items) {
    if (item?.value == null || item.value === "") {
      continue;
    }

    const grupo = grupos.find((grupoActual) => cumpleGrupo(grupoActual, item));

    if (!grupo) {
      continue;
    }

    const idDeGrupo = getIdGrupo(grupo.nombre);

    gruposIngresados[String(item.value)] = {
      idDeGrupo,
      nombre: grupo.nombre,
    };
  }

  return {
    gruposIngresados,
    nombres,
  };
}

export function obtenerOrdenGrupoDefault({
  nombre,
  idDeGrupo,
  codCc,
  codTipoTransporte,
}: {
  nombre?: string | null;

  idDeGrupo?: string | number | null;

  codCc?: string | number | null;

  codTipoTransporte?: string | number | null;
}) {
  const grupos = obtenerGruposDefault({
    codCc: codCc ?? null,
    codTipoTransporte: codTipoTransporte ?? null,
  });

  const nombreNormalizado = String(nombre ?? "")
    .trim()
    .toUpperCase();

  const grupoDefault = grupos.find(
    (grupo) => grupo.nombre.trim().toUpperCase() === nombreNormalizado,
  );

  /*
   * IVA u otro grupo marcado
   * explícitamente para ir al final.
   */
  if (grupoDefault?.siempreAlFinal) {
    return Number.MAX_SAFE_INTEGER;
  }

  if (grupoDefault) {
    return grupoDefault.orden;
  }

  /*
   * Grupo creado o modificado
   * manualmente por el usuario.
   */
  if (idDeGrupo != null && idDeGrupo !== "") {
    return Number(idDeGrupo);
  }

  return 999;
}
