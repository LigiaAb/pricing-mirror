// gruposRubrosDefault.js

const COD_ENTIDAD_DUE_AGENT = 13624;

const COD_RUBRO_COBERTURA = 108;
const COD_TIPO_CALCULO_COBERTURA = 356;
const COD_RUBRO_IVA = 133;

const getEntidadIdRubro = (item) => {
  return item?.entidad_id ?? item?.cod_entidad ?? item?.servicio?.entidad_id ?? item?.servicio?.cod_entidad ?? item?.metodo?.entidad_id ?? null;
};

export const esRubroDueAgent = (item) => {
  return String(getEntidadIdRubro(item)) === String(COD_ENTIDAD_DUE_AGENT);
};

const esRubroDueCarrier = (item) => {
  const entidadId = getEntidadIdRubro(item);

  if (entidadId == null || entidadId === "") return false;

  return String(entidadId) !== String(COD_ENTIDAD_DUE_AGENT);
};

export const GRUPOS_RUBROS_DEFAULT = [
  {
    nombre: "Flete Aereo",
    orden: 1,

    centrosCosto: [16],
    tiposTransporte: [49],

    validar: (item) => {
      const esDueCarrier = esRubroDueCarrier(item);

      return item?.es_flete === true || esDueCarrier;
    },
  },

  {
    nombre: "Manejos Cropa",
    orden: 2,

    centrosCosto: [16],
    tiposTransporte: [49],

    validar: (item) => {
      const entidadId = getEntidadIdRubro(item);

      const esDueAgent = Number(entidadId) === COD_ENTIDAD_DUE_AGENT;

      const esCobertura = Number(item?.cod_tipo_calculo) === COD_TIPO_CALCULO_COBERTURA;

      return esDueAgent && !esCobertura;

      //   const esCobertura = Number(item?.cod_rubro) === COD_RUBRO_COBERTURA;

      //   const esIva = Number(item?.cod_rubro) === COD_RUBRO_IVA;

      //   return esDueAgent && !esCobertura && !esIva;
    },
  },

  {
    nombre: "Cobertura",
    orden: 3,

    centrosCosto: [16],
    tiposTransporte: [49],

    validar: (item) => {
      const esCobertura = Number(item?.cod_tipo_calculo) === COD_TIPO_CALCULO_COBERTURA;

      return esCobertura;
    },

    // rubros: [COD_RUBRO_COBERTURA],
  },

  {
    nombre: "IVA",
    orden: 4,
    siempreAlFinal: true,

    centrosCosto: [16],
    tiposTransporte: [49],

    rubros: [COD_RUBRO_IVA],
  },

  // Ejemplo futuro por rubros específicos
  //   {
  //     nombre: "Grupo XXXX",
  //     orden: 5,

  //     centrosCosto: [16],
  //     tiposTransporte: [2],

  //     rubros: [1, 2, 3, 4],
  //   },
];

const cumpleCondicion = (valores, valor) => {
  if (!Array.isArray(valores) || !valores.length) {
    return true;
  }

  return valores.map(Number).includes(Number(valor));
};

const cumpleGrupo = (grupo, item) => {
  const codRubro = Number(item?.cod_rubro);

  if (Array.isArray(grupo.rubros) && grupo.rubros.map(Number).includes(codRubro)) {
    return true;
  }

  if (typeof grupo.validar === "function" && grupo.validar(item)) {
    return true;
  }

  return false;
};

export const obtenerGruposDefault = ({ codCc, codTipoTransporte }) => {
  return GRUPOS_RUBROS_DEFAULT.filter((grupo) => {
    const aplicaCentroCosto = cumpleCondicion(grupo.centrosCosto, codCc);

    const aplicaTipoTransporte = cumpleCondicion(grupo.tiposTransporte, codTipoTransporte);

    return aplicaCentroCosto && aplicaTipoTransporte;
  });
};

export const construirAgrupacionAutomatica = (items = [], { codCc, codTipoTransporte } = {}) => {
  const gruposIngresados = {};
  const nombres = {};

  const grupos = obtenerGruposDefault({
    codCc,
    codTipoTransporte,
  });

  const idsPorNombre = new Map();
  let siguienteId = 1;

  const getIdGrupo = (nombreGrupo) => {
    if (!idsPorNombre.has(nombreGrupo)) {
      idsPorNombre.set(nombreGrupo, siguienteId);

      nombres[String(siguienteId)] = nombreGrupo;

      siguienteId += 1;
    }

    return idsPorNombre.get(nombreGrupo);
  };

  for (const item of items) {
    if (!item?.value) continue;

    const grupo = grupos.find((grupo) => cumpleGrupo(grupo, item));

    if (!grupo) continue;

    const idDeGrupo = getIdGrupo(grupo.nombre);

    gruposIngresados[item.value] = {
      idDeGrupo,
      nombre: grupo.nombre,
    };
  }

  return {
    gruposIngresados,
    nombres,
  };
};

export const obtenerOrdenGrupoDefault = ({ nombre, idDeGrupo, codCc, codTipoTransporte }) => {
  const grupos = obtenerGruposDefault({
    codCc,
    codTipoTransporte,
  });

  const nombreNormalizado = String(nombre ?? "")
    .trim()
    .toUpperCase();

  const grupoDefault = grupos.find((grupo) => String(grupo.nombre).trim().toUpperCase() === nombreNormalizado);

  // Grupo especial que SIEMPRE debe ir al final
  if (grupoDefault?.siempreAlFinal) {
    return Number.MAX_SAFE_INTEGER;
  }

  // Grupo default
  if (grupoDefault) {
    return grupoDefault.orden;
  }

  // Grupo creado/modificado por el usuario
  if (idDeGrupo != null && idDeGrupo !== "") {
    return Number(idDeGrupo);
  }

  return 999;
};
