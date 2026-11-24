export let actividades = [
    {
        "actividad_id": 1,
        "nombre_depto": "RECURSOS HUMANOS",
        "asesor": "Jane Doe",
        "tipo_actividad": 1,
        "desc_actividad": "CALENDARIZAR CTS",
        "pais": {
            "cod_pais": 1002,
            "nombre_pais": "EL SALVADOR"
        },
        "asunto": "Lorem ipsum dolor sit amet",
        "cliente": {
            "codigo_entidad": "CL10",
            "entidad_id": 10,
            "entidad_nombre": "Empresa Alpha",
            "cod_tipo": 3
        },
        "contactos": [
            {
                "entidad_id": 18,
                "contacto_nombre": "John Smith",
                "cod_tipo": 10,
                "tipo_descripcion": "INFORMATIVO"
            },
            {
                "entidad_id": 25,
                "contacto_nombre": "María García",
                "cod_tipo": 9,
                "tipo_descripcion": "TÉCNICO"
            },
            {
                "entidad_id": 28,
                "contacto_nombre": "Luis Pérez",
                "cod_tipo": 13,
                "tipo_descripcion": "COMERCIAL"
            },
            {
                "entidad_id": 48,
                "contacto_nombre": "Andrea Torres",
                "cod_tipo": 13,
                "tipo_descripcion": "LEGAL"
            },
        ],
        "estado": "EN PROCESO",
        "resultados": [
            {
                "cod_resultado": 1,
                "tipo_desc": "LLAMADA",
                "no_file": 0,
                "pais": "",
                "estacion": "",
                "fecha_seguimiento": "2024-12-03T06:00:00.000Z",
                "asunto": "COORDINAR REUNION",
                "resultado_desc": "SE COORDINO LA REUNION PRESENCIAL CON EL CLIENTE"
            },
            {
                "cod_resultado": 2,
                "tipo_desc": "VISITA",
                "no_file": 0,
                "pais": "",
                "estacion": "",
                "fecha_seguimiento": "2024-12-03T06:00:00.000Z",
                "asunto": "VISITA A SEDE CENTRAL",
                "resultado_desc": "SE VISITO LA SEDE CENTRAL DEL CLIENTE."
            },
        ],
        "fecha": "2024-11-06T11:00:00Z"
    },
    {
        "actividad_id": 2,
        "nombre_depto": "MARKETING",
        "asesor": "Carlos López",
        "tipo_actividad": 2,
        "desc_actividad": "FINALIZAR SIN RESULTADOS",
        "pais": {
            "cod_pais": 2003,
            "nombre_pais": "GUATEMALA"
        },
        "asunto": "Planificación de campaña",
        "cliente": {
            "codigo_entidad": "CL20",
            "entidad_id": 20,
            "entidad_nombre": "Empresa Beta",
            "cod_tipo": 5
        },
        "contactos": [{
            "entidad_id": 25,
            "contacto_nombre": "María García",
            "cod_tipo": 9,
            "tipo_descripcion": "TÉCNICO"
        }],
        "estado": "FINALIZADO",
        "resultados": [],
        "fecha": "2024-11-15T11:00:00Z"
    },
    {
        "actividad_id": 3,
        "nombre_depto": "VENTAS",
        "asesor": "Ana Torres",
        "tipo_actividad": 1,
        "desc_actividad": "VISITA",
        "pais": {
            "cod_pais": 3004,
            "nombre_pais": "COSTA RICA"
        },
        "asunto": "Presentación de producto",
        "cliente": {
            "codigo_entidad": "CL30",
            "entidad_id": 30,
            "entidad_nombre": "Empresa Gamma",
            "cod_tipo": 3
        },
        "contactos": [{
            "entidad_id": 28,
            "contacto_nombre": "Luis Pérez",
            "cod_tipo": 13,
            "tipo_descripcion": "COMERCIAL"
        }],
        "estado": "EN SEGUIMIENTO",
        "resultados": [{
            "cod_resultado": 213,
            "tipo_desc": "VISITA",
            "no_file": 0,
            "pais": "",
            "estacion": "",
            "fecha_seguimiento": "2024-12-03T06:00:00.000Z",
            "asunto": "VISITA DE SEGUIMIENTO",
            "resultado_desc": "SE VISITO LA SEDE CENTRAL DEL CLIENTE."
        },],
        "fecha": "2024-11-19T11:00:00Z"
    },
    {
        "actividad_id": 4,
        "nombre_depto": "FINANZAS",
        "asesor": "Roberto Díaz",
        "tipo_actividad": 3,
        "desc_actividad": "CORREO",
        "pais": {
            "cod_pais": 4005,
            "nombre_pais": "HONDURAS"
        },
        "asunto": "Consulta sobre presupuesto",
        "cliente": {
            "codigo_entidad": "CL40",
            "entidad_id": 40,
            "entidad_nombre": "Empresa Delta",
            "cod_tipo": 5
        },
        "contactos": [{
            "entidad_id": 33,
            "contacto_nombre": "Lucía Méndez",
            "cod_tipo": 9,
            "tipo_descripcion": "ADMINISTRATIVO"
        }],
        "estado": "ANULADO",
        "resultados": [],
        "fecha": "2024-11-19T11:00:00Z"
    },
    {
        "actividad_id": 5,
        "nombre_depto": "IT",
        "asesor": "Laura Gómez",
        "tipo_actividad": 2,
        "desc_actividad": "LLAMADA",
        "pais": {
            "cod_pais": 5006,
            "nombre_pais": "PANAMÁ"
        },
        "asunto": "Soporte técnico",
        "cliente": {
            "codigo_entidad": "CL50",
            "entidad_id": 50,
            "entidad_nombre": "Empresa Epsilon",
            "cod_tipo": 3
        },
        "contactos": [{
            "entidad_id": 41,
            "contacto_nombre": "José Ramírez",
            "cod_tipo": 10,
            "tipo_descripcion": "TÉCNICO"
        }],
        "estado": "EN PROCESO",
        "resultados": [],
        "fecha": "2024-11-29T11:00:00Z"
    },
    {
        "actividad_id": 6,
        "nombre_depto": "LEGAL",
        "asesor": "María Fernández",
        "tipo_actividad": 1,
        "desc_actividad": "FILE REALIZADO",
        "pais": {
            "cod_pais": 6007,
            "nombre_pais": "NICARAGUA"
        },
        "asunto": "Asesoría contractual",
        "cliente": {
            "codigo_entidad": "CL60",
            "entidad_id": 60,
            "entidad_nombre": "Empresa Zeta",
            "cod_tipo": 5
        },
        "contactos": [{
            "entidad_id": 48,
            "contacto_nombre": "Andrea Torres",
            "cod_tipo": 13,
            "tipo_descripcion": "LEGAL"
        }],
        "estado": "FINALIZADO",
        "resultados": [],
        "fecha": "2024-11-12T11:00:00Z"
    },
    {
        "actividad_id": 7,
        "nombre_depto": "OPERACIONES",
        "asesor": "Luis Morales",
        "tipo_actividad": 3,
        "desc_actividad": "VISITA",
        "pais": {
            "cod_pais": 7008,
            "nombre_pais": "BELICE"
        },
        "asunto": "Inspección de instalaciones",
        "cliente": {
            "codigo_entidad": "CL70",
            "entidad_id": 70,
            "entidad_nombre": "Empresa Omega",
            "cod_tipo": 3
        },
        "contactos": [{
            "entidad_id": 55,
            "contacto_nombre": "Sara Cruz",
            "cod_tipo": 10,
            "tipo_descripcion": "OPERATIVO"
        }],
        "estado": "EN SEGUIMIENTO",
        "resultados": [],
        "fecha": "2024-11-21T11:00:00Z"
    },
    {
        "actividad_id": 8,
        "nombre_depto": "RECURSOS HUMANOS",
        "asesor": "Patricia Vega",
        "tipo_actividad": 2,
        "desc_actividad": "CORREO",
        "pais": {
            "cod_pais": 8009,
            "nombre_pais": "MÉXICO"
        },
        "asunto": "Evaluación de desempeño",
        "cliente": {
            "codigo_entidad": "CL80",
            "entidad_id": 80,
            "entidad_nombre": "Empresa Theta",
            "cod_tipo": 5
        },
        "contactos": [{
            "entidad_id": 62,
            "contacto_nombre": "Carlos Sandoval",
            "cod_tipo": 9,
            "tipo_descripcion": "HUMANOS"
        }],
        "estado": "EN PROCESO",
        "resultados": [],
        "fecha": "2024-12-04T11:00:00Z"
    },
    {
        "actividad_id": 9,
        "nombre_depto": "MARKETING",
        "asesor": "Diana Ríos",
        "tipo_actividad": 1,
        "desc_actividad": "LLAMADA",
        "pais": {
            "cod_pais": 9010,
            "nombre_pais": "PERÚ"
        },
        "asunto": "Lanzamiento de producto",
        "cliente": {
            "codigo_entidad": "CL90",
            "entidad_id": 90,
            "entidad_nombre": "Empresa Lambda",
            "cod_tipo": 3
        },
        "contactos": [{
            "entidad_id": 69,
            "contacto_nombre": "Natalia Campos",
            "cod_tipo": 13,
            "tipo_descripcion": "INFORMATIVO"
        }],
        "estado": "FINALIZADO",
        "resultados": [],
        "fecha": "2024-11-04T11:00:00Z"
    },
    {
        "actividad_id": 10,
        "nombre_depto": "IT",
        "asesor": "Miguel Sánchez",
        "tipo_actividad": 3,
        "desc_actividad": "LLAMADA",
        "pais": {
            "cod_pais": 1011,
            "nombre_pais": "COLOMBIA"
        },
        "asunto": "Actualización de software",
        "cliente": {
            "codigo_entidad": "CL100",
            "entidad_id": 100,
            "entidad_nombre": "Empresa Mu",
            "cod_tipo": 5
        },
        "contactos": [{
            "entidad_id": 69,
            "contacto_nombre": "Natalia Campos",
            "cod_tipo": 13,
            "tipo_descripcion": "INFORMATIVO"
        }],
        "estado": "FINALIZADO",
        "resultados": [],
        "fecha": "2024-12-02T11:00:00Z"
    },
]

