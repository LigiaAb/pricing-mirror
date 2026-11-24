// Mapeo de campos del JSON a nombres amigables para el usuario
// Este archivo permite personalizar fácilmente cómo se muestran los nombres de los campos

export const MAPEO_CAMPOS_EMBARQUE = {
    // Campos básicos del embarque
    "COD_FILE": "COD FILE",
    "EMPRESA_NOMBRE": "EMPRESA",
    "CENCOD_NOMBRE": "CENTRO DE COSTO",
    "COTIZACIONCABECERA_ID": "COTIZACIÓN NÚMERO",
    
    // Información de origen
    "NOMBRE_PAIS_ORIGEN": "PAÍS ORIGEN",
    "PUNTOENLACE_NOMBRE_ORIGEN": "LUGAR ORIGEN",

    "ENTIDAD_SHIPPER_NOMBRE": "SHIPPER",
    "ENTIDAD_CONSIG_NOMBRE": "CONSIGNATARIO",
    
    // Información de destino
    "NOMBRE_PAIS_DESTINO": "PAÍS DESTINO",
    "PUNTOENLACE_NOMBREE_DESTINO": "LUGAR DESTINO",
    
    // Información del cliente y servicio
    "ENTIDAD_NOMBRE": "CLIENTE",
    "TIPO_DESCRIPCION_EMBARQUE": "TIPO DE EMBARQUE",
    "SERVICIO_NOMBRE": "SERVICIO",
    "TIPO_DESCRIPCION": "TIPO DE CARGA",
    //"INCOTERM_DESCRIPCION": "Incoterm",
    
    // Estado y auditoría
    "ESTADO_DESCRIPCION": "ESTADO",
    "USUARIO_CORREO_CREA": "USUARIO",
    "FECHA_CREACION": "FECHA DE CREACIÓN",
    "OBSERVACIONES": "OBSERVACIONES",
    
    // Campos adicionales no usados del JSON
    "EMBARQUE_ID": "ID Embarque",
    "COD_EMPRESA": "Código Empresa",
    "COD_CENCOD": "Código Centro Costo",
    "COD_PAIS_ORIGEN": "Código País Origen",
    "COD_PAIS_DESTINO": "Código País Destino",
    "COD_ENTIDAD": "Código Cliente",
    "COD_SERVICIO": "Código Servicio",
    "COD_TIPO": "Código Tipo",
    "COD_ESTADO": "Código Estado",
    "COD_USUARIO_CREA": "Código Usuario Creador"
};

// Mapeo para campos de carga
export const MAPEO_CAMPOS_CARGA = {
    "EMB_CARGA_ID": "ID Carga",
    "EMBARQUE_ID": "ID Embarque",
    "COD_FILE": "Código File",
    "EMB_LEGS_ID": "ID Legs",
    "BULTOS": "BULTOS",
    "TIPO_ID_UNIDAD_MEDIDA": "Unidad de Medida",
    "TIPO_DESCRIPCION": "Descripción Unidad",
    "PESO": "Peso",
    "VOLUMEN": "Volumen",
    "METROS_CUBICOS": "Metros Cúbicos",
    "CW": "CW",
    "VALOR": "Valor",
    "REPESO": "Re-peso",
    "ESTADO_ID": "Estado",
    "ESTADO_DESCRIPCION": "Descripción Estado",
    "DESCRIPCION_CARGA": "Descripción Carga",
    "COD_PAIS_ORIGEN_CARGA": "País Origen Carga",
    "PARTIDA_ARANCELARIA": "Partida Arancelaria",
    "REGIMEN_ADUANAL": "Régimen Aduanal",
    "DEFINITIVO_GENERAL": "Definitivo/General",
    "FECHA_REGISTRO": "Fecha Registro"
};

// Función helper para obtener el nombre mapeado
export const obtenerNombreCampo = (campo, tipo = 'embarque') => {
    const mapeo = tipo === 'carga' ? MAPEO_CAMPOS_CARGA : MAPEO_CAMPOS_EMBARQUE;
    return mapeo[campo] || campo;
};

// Función para agregar nuevos mapeos dinámicamente
export const agregarMapeoCampo = (campo, nombreAmigable, tipo = 'embarque') => {
    if (tipo === 'carga') {
        MAPEO_CAMPOS_CARGA[campo] = nombreAmigable;
    } else {
        MAPEO_CAMPOS_EMBARQUE[campo] = nombreAmigable;
    }
}; 