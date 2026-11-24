
export const proceso_oportunidad = [
  {
    "index": 0,
    "proceso_id": 1,
    "proceso_descripcion": "OPORTUNIDAD",
    "proceso_detalle_estado_actual": 29,
    "proceso_detalle_estado_siguiente": "{30}",
    "proceso_detalle_estado_or": null,
    "estado_id": 1,
    "cod_estado": 29,
    "estado_desc": "EN PROCESO",
    "cod_tipo": 41,
    "nom_tipo": "OPORTUNIDAD ",
    "siguiente": [
      {
        "cod_estado": 30,
        "estado_desc": "ENVIAR PARA APROBACIÓN",
        "cod_tipo": 41,
        "nom_tipo": "OPORTUNIDAD"
      }
    ]
  },
  {
    "index": 1,
    "proceso_id": 1,
    "proceso_descripcion": "OPORTUNIDAD",
    "proceso_detalle_estado_actual": 30,
    "proceso_detalle_estado_siguiente": "{31}",
    "proceso_detalle_estado_or": null,
    "estado_id": 1,
    "cod_estado": 30,
    "estado_desc": "ESPERANDO RESPUESTA",
    "cod_tipo": 41,
    "nom_tipo": "OPORTUNIDAD ",
    "siguiente": [
      {
        "cod_estado": 31,
        "estado_desc": "FINALIZAR",
        "cod_tipo": 41,
        "nom_tipo": "OPORTUNIDAD"
      }
    ]
  },
  {
    "index": 2,
    "proceso_id": 1,
    "proceso_descripcion": "OPORTUNIDAD",
    "proceso_detalle_estado_actual": 31,
    "proceso_detalle_estado_siguiente": null,
    "proceso_detalle_estado_or": null,
    "estado_id": 1,
    "cod_estado": 31,
    "estado_desc": "FINALIZADO",
    "cod_tipo": 41,
    "nom_tipo": "OPORTUNIDAD ",
    "siguiente": []
  }
]