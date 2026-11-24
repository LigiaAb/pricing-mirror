
export const tablas_movimientos = [
    {
        titulo: "Ingresos",
        id: "ingdec",
        headers: [
            { name: "INGDEC", label: "Declaración", campo: "ingdec", },
            { name: "INGFEC", label: "Fecha de Ingreso", campo: "ingfec", },
            { name: "PROV", label: "Proveedor", campo: "prov", },
            { name: "INGCOR", label: "Correlativo Interno", campo: "ingcor", },
            { name: "TIPDES", label: "Almacén", campo: "tipdes", },
        ],
        sub_headers: [
            { name: "ARTCOD", label: "Codigo Articulo", campo: "artcod", },
            { name: "ARTDES", label: "Descripción", campo: "artdes", },
            { name: "INGLOT", label: "Lote", campo: "inglot", },
            { name: "INGFLOT", label: "Fecha de vencimiento", campo: "ingflot", },
            { name: "BULTOS", label: "Bultos", campo: "bultos", },
            { name: "UNIDADES", label: "Unidades", campo: "unidades", },
        ]
    },
    {
        titulo: "Salidas",
        id: "saldec",
        headers: [
            { name: "SALDEC", label: "Declaración de salida", campo: "saldec", },
            { name: "SALDFEC", label: "Fecha de salida", campo: "saldfec", },
            { name: "SALCONS", label: "Consignatorio", campo: "salcons", },
            { name: "SALCOR", label: "Correlativo Interno de salida", campo: "salcor", },
            { name: "TIPDES", label: "Almacén", campo: "tipdes", }
        ],
        sub_headers: [
            { name: "SALFAC", label: "Factura", campo: "salfac", },
            { name: "INGDEC", label: "Descripción del ingreso", campo: "ingdec", },
            { name: "ARTCOD", label: "Codigo de articulo", campo: "artcod", },
            { name: "ARTDES", label: "Descripción del Artículo", campo: "artdes", },
        ]
    },
    {
        titulo: "Ajustes",
        id: "codaj",
        headers: [
            { name: "AJDEC", label: "Declaración", campo: "ajdec", },
            { name: "AJFEC", label: "Fecha", campo: "ajfec", },
            { name: "CODAJ", label: "Articulo Codigo", campo: "codaj", },
            { name: "AJART", label: "Articulo", campo: "ajart", },
            { name: "INGUNIT", label: "Unidades", campo: "ingunit", },
            { name: "TIPDES", label: "Almacén", campo: "tipdes", },
        ],
        sub_headers: []
    },
    {
        titulo: "Mermas",
        id: "codfal",
        headers: [
            { name: "FALFEC", label: "Fecha", campo: "falfec", },
            { name: "CODFAL", label: "Codigo merma", campo: "codfal", },
            { name: "FALDEC", label: "Declaración", campo: "faldec", },
            { name: "TIPDES", label: "Almacén", campo: "tipdes", },
        ],
        sub_headers: []
    },
]