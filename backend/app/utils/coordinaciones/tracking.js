// ? resuelve la descripcion de estado del tracking (descripcion_estado) de
const asignar_descripciones_estado_tracking = async (cliente, filas) => {
  // ? todas las filas parten con descripcion vacia, igual que el tracking
  // ? individual cuando no se resuelve la cadena del proceso
  filas.forEach((fila) => {
    fila.DESCRIPCION_ESTADO_TRACKING_ACTUAL = "";
  });

  // ? tipos de embarque presentes en la pagina, son la llave para
  // ? localizar el proceso de tracking de cada coordinacion
  const tipos_embarque = [
    ...new Set(
      filas
        .map((fila) => fila.TIPO_ID_EMBARQUE)
        .filter((tipo) => tipo !== undefined && tipo !== null),
    ),
  ];

  if (tipos_embarque.length === 0) {
    return;
  }

  // ? relacion de tracking por tipo de embarque, se conserva solo la
  // ? primera coincidencia igual que el .first() del tracking individual
  const relaciones_tracking = await cliente("TIPO_RELACION")
    .whereIn("TIPO_PADRE_ID", tipos_embarque)
    .where("ES_TRACKING", "1")
    .select("TIPO_PADRE_ID", "TIPO_ID");

  const relacion_por_tipo = new Map();

  relaciones_tracking.forEach((relacion) => {
    if (!relacion_por_tipo.has(relacion.TIPO_PADRE_ID)) {
      relacion_por_tipo.set(relacion.TIPO_PADRE_ID, relacion);
    }
  });

  if (relacion_por_tipo.size === 0) {
    return;
  }

  // ? proceso bpm de cada relacion, primera coincidencia por TIPO_ID
  const procesos_bpm = await cliente("BPM_PROCESO")
    .whereIn("TIPO_ID", [
      ...new Set([...relacion_por_tipo.values()].map((r) => r.TIPO_ID)),
    ])
    .select("BPMPROCESO_ID", "TIPO_ID");

  const proceso_por_tipo = new Map();

  procesos_bpm.forEach((proceso) => {
    if (!proceso_por_tipo.has(proceso.TIPO_ID)) {
      proceso_por_tipo.set(proceso.TIPO_ID, proceso);
    }
  });

  if (proceso_por_tipo.size === 0) {
    return;
  }

  // ? nodos de los procesos localizados, dan el proceso de cada nodo y
  // ? la descripcion del nodo actual del tracking
  const nodos_bpm = await cliente("BPM_NODO")
    .whereIn("BPMPROCESO_ID", [
      ...new Set([...proceso_por_tipo.values()].map((p) => p.BPMPROCESO_ID)),
    ])
    .select("BPMNODO_ID", "BPMPROCESO_ID", "BPMNODO_DESCRIPCION");

  if (nodos_bpm.length === 0) {
    return;
  }

  const proceso_por_nodo = new Map();
  const descripcion_por_nodo = new Map();

  nodos_bpm.forEach((nodo) => {
    proceso_por_nodo.set(nodo.BPMNODO_ID, nodo.BPMPROCESO_ID);
    descripcion_por_nodo.set(nodo.BPMNODO_ID, nodo.BPMNODO_DESCRIPCION);
  });

  // ? transiciones de los nodos con el mismo orden BPMTRANSICION_ID ASC del
  // ? tracking individual, agrupadas por proceso para conservar la
  // ? posicion 1-based que indexa ESTADO_ID_TRACKING en cada proceso
  const transiciones_bpm = await cliente("BPM_TRANSICION")
    .whereIn("BPMNODO_ID", [...proceso_por_nodo.keys()])
    .orderBy("BPMTRANSICION_ID", "ASC")
    .select("BPMTRANSICION_ID", "BPMNODO_ID");

  if (transiciones_bpm.length === 0) {
    return;
  }

  const transiciones_por_proceso = new Map();

  transiciones_bpm.forEach((transicion) => {
    const proceso_id = proceso_por_nodo.get(transicion.BPMNODO_ID);

    if (!transiciones_por_proceso.has(proceso_id)) {
      transiciones_por_proceso.set(proceso_id, []);
    }

    transiciones_por_proceso.get(proceso_id).push(transicion.BPMNODO_ID);
  });

  filas.forEach((fila) => {
    const relacion = relacion_por_tipo.get(fila.TIPO_ID_EMBARQUE);
    const proceso = relacion
      ? proceso_por_tipo.get(relacion.TIPO_ID)
      : undefined;
    const transiciones = proceso
      ? transiciones_por_proceso.get(proceso.BPMPROCESO_ID)
      : undefined;

    // ? no se resolvio la cadena del proceso para esta fila, queda vacia
    if (!transiciones || transiciones.length === 0) {
      return;
    }

    // ? la posicion del estado es 1-based sobre las transiciones del
    // ? proceso, igual que el recorrido del tracking individual
    const estado_tracking = Number(fila.ESTADO_ID_TRACKING);
    const nodo_actual = transiciones[estado_tracking - 1];

    // ? misma prioridad del tracking individual: finalizada cuando el
    // ? estado paso la ultima transicion, rechazada cuando no hay nodo
    // ? para la posicion actual, de lo contrario la descripcion del nodo
    if (estado_tracking > transiciones.length) {
      fila.DESCRIPCION_ESTADO_TRACKING_ACTUAL = "SOLICITUD FINALIZADA";
    } else if (!nodo_actual) {
      fila.DESCRIPCION_ESTADO_TRACKING_ACTUAL = "SOLICITUD RECHAZADA";
    } else {
      fila.DESCRIPCION_ESTADO_TRACKING_ACTUAL =
        descripcion_por_nodo.get(nodo_actual) ?? "";
    }
  });
};

module.exports = { asignar_descripciones_estado_tracking };
