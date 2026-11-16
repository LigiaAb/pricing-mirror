/* ==========================================================================
 * CAMPOS DE LA INFORMACIÓN DEL EMBARQUE
 *
 * Mismos campos que ya tiene el módulo actual de embarques (clave, nombre,
 * obligatorio, tipo de dato y opciones fijas); solo se toman los campos, no
 * el diseño: v2 los dibuja con sus propios componentes (`campos.tsx`).
 *
 * Origen de cada sección (módulo actual, solo referencia):
 *   Shipper / Consignatario → public/secciones/entidad-public-form/fields.ts y model.ts
 *   Facturación             → public/secciones/facturacion-publica.tsx
 *   Producto                → secciones/carga-form-dialog.tsx y cargas-publicas-columns.tsx
 *   Detalles                → public/secciones/detalles-publica-model.ts
 *   Rutas                   → secciones/ruta-dialog.tsx
 *   Fechas                  → public/secciones/fechas-publicas.tsx y secciones/fechas.tsx
 *
 * `key` = nombre del dato en el módulo actual: al conectar la API se usa tal cual.
 * ========================================================================== */

import type { CampoGestion } from "./interacciones";

export type CampoEmbarque = CampoGestion & {
  /** Clave del dato en el módulo actual. */
  key: string;
  /** Solo consulta también al editar (en el módulo actual viene del maestro). */
  soloLectura?: boolean;
};

export type GrupoCampos = {
  titulo: string;
  campos: readonly CampoEmbarque[];
};

export type SeccionInformacion = {
  value: string;
  titulo: string;
  descripcion: string;
  grupos: readonly GrupoCampos[];
  /** La sección es una lista (una fila por registro): los campos son los de cada fila. */
  lista?: string;
};

/* --------------------------------------------------------------------------
 * Entidades (Shipper, Consignatario): `buildEntidadPublicFields`.
 * Obligatorios: `ENTIDAD_PUBLIC_REQUIRED_FIELDS`.
 * ------------------------------------------------------------------------ */

function camposEntidad(titulo: string): GrupoCampos[] {
  return [
    {
      titulo,
      campos: [{ key: "entidad_id", label: `Seleccionar ${titulo}`, tipo: "catalogo", requerido: true }],
    },
    {
      titulo: "Información",
      campos: [
        { key: "entidad_nombre", label: "Nombre", requerido: true },
        { key: "entidad_pais", label: "País", tipo: "catalogo", requerido: true },
        { key: "direccion_recoleccion_ciudad", label: "Ciudad", tipo: "catalogo" },
        { key: "entidad_industria", label: "Industria", tipo: "catalogo", requerido: true },
      ],
    },
    {
      titulo: "Dirección",
      campos: [
        { key: "direccion_recoleccion", label: "Dirección de Recolección", tipo: "area", requerido: true },
        {
          key: "direccion_recoleccion_pais",
          label: "País",
          tipo: "catalogo",
          requerido: true,
          soloLectura: true,
        },
        { key: "direccion_recoleccion_depto", label: "Departamento", tipo: "catalogo" },
        { key: "direccion_recoleccion_muni", label: "Municipio", tipo: "catalogo" },
      ],
    },
    {
      titulo: "Contacto",
      campos: [
        { key: "entidadcontacto_id", label: "Seleccionar Contacto", tipo: "catalogo" },
        { key: "_contacto_tipo_list", label: "Tipo(s) de Contacto", tipo: "casillas" },
        { key: "entidad_contacto_nombre", label: "Nombre Contacto", requerido: true },
        { key: "entidad_contacto_email", label: "Email", requerido: true },
        { key: "entidad_contacto_telefono", label: "Teléfono", requerido: true },
      ],
    },
    {
      titulo: "Identificación",
      campos: [{ key: "entidad_nit", label: "NIT", requerido: true }],
    },
  ];
}

/* --------------------------------------------------------------------------
 * Secciones (mismo orden que `DETALLE_EMBARQUE_STEPS`, sin Gastos,
 * Documentos ni CCA: Documentos tiene su propia tab).
 * ------------------------------------------------------------------------ */

export const SECCIONES_INFORMACION: readonly SeccionInformacion[] = [
  {
    value: "shipper",
    titulo: "Shipper",
    descripcion: "Datos de quien despacha y entrega la mercadería.",
    grupos: camposEntidad("Shipper"),
  },
  {
    value: "consignatario",
    titulo: "Consignatario",
    descripcion: "Datos de quien recibe la mercadería en destino.",
    grupos: camposEntidad("Consignatario"),
  },
  {
    value: "producto",
    titulo: "Producto",
    descripcion: "Productos que componen el embarque.",
    lista: "Cargas del embarque (columnas: Descripción, Valor, # Bultos, Peso (kg), CW (kg)).",
    grupos: [
      {
        titulo: "Carga",
        campos: [
          { key: "cantidad", label: "Cantidad (bultos)", tipo: "numero", requerido: true },
          { key: "pesoTotal", label: "Peso total (kg)", tipo: "numero", requerido: true },
          { key: "unidadMedida", label: "Unidad de medida", tipo: "catalogo", requerido: true },
          { key: "largo", label: "Largo", tipo: "numero" },
          { key: "alto", label: "Alto", tipo: "numero" },
          { key: "ancho", label: "Ancho", tipo: "numero" },
          { key: "descripcion", label: "Descripción", tipo: "area", requerido: true },
          { key: "valor", label: "Valor declarado", tipo: "numero", requerido: true },
          { key: "paisOrigenId", label: "País Origen", tipo: "catalogo", requerido: true },
          { key: "partidaArancelaria", label: "Partida arancelaria", requerido: true },
        ],
      },
    ],
  },
  {
    value: "facturacion",
    titulo: "Facturación",
    descripcion: "Datos de facturación del cliente.",
    // En el módulo actual es siempre de consulta: refleja el maestro del cliente.
    grupos: [
      {
        titulo: "Información",
        campos: [{ key: "cliente", label: "Nombre", requerido: true, soloLectura: true }],
      },
      {
        titulo: "Dirección Fiscal",
        campos: [{ key: "direccionFiscal", label: "Dirección Fiscal", tipo: "area", soloLectura: true }],
      },
      {
        titulo: "Contacto",
        campos: [
          { key: "clienteContacto", label: "Nombre Contacto", soloLectura: true },
          { key: "clienteContactoEmail", label: "Email", soloLectura: true },
          { key: "clienteContactoTelefono", label: "Teléfono", soloLectura: true },
        ],
      },
      {
        titulo: "Identificación",
        campos: [{ key: "numero", label: "NIT", requerido: true, soloLectura: true }],
      },
    ],
  },
  {
    value: "detalles",
    titulo: "Detalles",
    descripcion: "Condiciones y detalles de la carga.",
    grupos: [
      {
        titulo: "Detalles",
        campos: [
          { key: "tipoPago", label: "Tipo de pago", tipo: "catalogo", requerido: true },
          { key: "tipoCarga", label: "Tipo de carga", tipo: "catalogo", requerido: true },
          { key: "incoterm", label: "Incoterm", tipo: "catalogo" },
          { key: "servicio", label: "Tipo de servicio", tipo: "catalogo", requerido: true },
          { key: "clasificacionCarga", label: "Clasificación de carga", tipo: "catalogo" },
          // PELIGROSIDAD_OPTIONS (V / C); en el módulo actual va sin etiqueta.
          {
            key: "peligrosidad",
            label: "Peligrosidad",
            tipo: "casillas",
            opciones: ["Carga Valiosa", "Cobertura de Seguro"],
          },
          // CROPA_DOCS (lib/constantes.ts)
          {
            key: "documentosCropa",
            label: "Documentos CROPA",
            tipo: "casillas",
            requerido: true,
            opciones: ["Deprex", "DUA Complementaria", "DUA Definitiva", "DUA Simplificada", "Otros"],
          },
          { key: "instruccionesManejo", label: "Instrucciones de manejo", tipo: "area" },
        ],
      },
    ],
  },
  {
    value: "rutas",
    titulo: "Rutas",
    descripcion: "Tramos del embarque.",
    lista: "Tramos del embarque (uno por vuelo).",
    grupos: [
      {
        titulo: "Tramo",
        campos: [
          { key: "codEntidadProv", label: "Aerolínea", tipo: "catalogo" },
          { key: "codPaisOrigen", label: "País Origen", tipo: "catalogo", requerido: true },
          { key: "puertoIdOrigen", label: "Aeropuerto Origen", tipo: "catalogo", requerido: true },
          { key: "codPaisDestino", label: "País Destino", tipo: "catalogo", requerido: true },
          { key: "puertoIdDestino", label: "Aeropuerto Destino", tipo: "catalogo", requerido: true },
          { key: "flightNumber", label: "Nro. Vuelo" },
        ],
      },
    ],
  },
  {
    value: "fechas",
    titulo: "Fechas",
    descripcion: "Fecha de recolección y fechas de movimiento del embarque.",
    grupos: [
      {
        titulo: "Recolección",
        campos: [{ key: "fecha_recoleccion", label: "Fecha de Recolección", tipo: "fecha", requerido: true }],
      },
      {
        titulo: "Fechas de movimiento",
        campos: [
          { key: "id_tipo_fecha", label: "Tipo de Fecha", tipo: "catalogo", requerido: true },
          { key: "fecha", label: "Fecha", tipo: "fecha", requerido: true },
          { key: "observacion", label: "Observación", tipo: "area" },
        ],
      },
    ],
  },
];
