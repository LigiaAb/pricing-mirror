
export const proceso_campana = [
  {
    "index": 0,
    "proceso_id": 1,
    "proceso_descripcion": "CAMPANA",
    "proceso_detalle_estado_actual": 37,
    "proceso_detalle_estado_siguiente": "{30}",
    "proceso_detalle_estado_or": null,
    "estado_id": 1,
    "cod_estado": 37,
    "estado_desc": "EN PROCESO",
    "cod_tipo": 66,
    "nom_tipo": "CAMPANA ",
    "siguiente": [
      {
        "cod_estado": 38,
        "estado_desc": "ENVIAR PARA APROBACIÓN",
        "cod_tipo": 66,
        "nom_tipo": "CAMPANA"
      }
    ]
  },
  {
    "index": 1,
    "proceso_id": 1,
    "proceso_descripcion": "CAMPANA",
    "proceso_detalle_estado_actual": 38,
    "proceso_detalle_estado_siguiente": "{31}",
    "proceso_detalle_estado_or": null,
    "estado_id": 1,
    "cod_estado": 38,
    "estado_desc": "ESPERANDO RESPUESTA",
    "cod_tipo": 66,
    "nom_tipo": "CAMPANA ",
    "siguiente": [
      {
        "cod_estado": 39,
        "estado_desc": "FINALIZAR",
        "cod_tipo": 66,
        "nom_tipo": "CAMPANA"
      }
    ]
  },
  {
    "index": 2,
    "proceso_id": 1,
    "proceso_descripcion": "CAMPANA",
    "proceso_detalle_estado_actual": 39,
    "proceso_detalle_estado_siguiente": null,
    "proceso_detalle_estado_or": null,
    "estado_id": 1,
    "cod_estado": 39,
    "estado_desc": "FINALIZADO",
    "cod_tipo": 66,
    "nom_tipo": "CAMPANA ",
    "siguiente": []
  }
]