
export const tablas = [
    {
        titulo: "Ingresos",
        id: "ingdec",
        headers: [
            // { name: "CLICOD", label: "Cliente", campo: "clicod", },
            { name: "INGDEC", label: "Declaración", campo: "ingdec", },
            { name: "INGFEC", label: "Fecha de Ingreso", campo: "ingfec", },
            { name: "PROV", label: "Proveedor", campo: "prov", },
            { name: "INGCOR", label: "Correlativo Interno", campo: "ingcor", },
            { name: "TIPDES", label: "Almacén", campo: "tipdes", },
            { name: "INGBUL", label: "Bultos", campo: "ingbul", },
            { name: "INGLIN", label: "Linea Interna", campo: "inglin", },
            { name: "INGUNIT", label: "Unidades", campo: "ingunit", },
        ]
    },
    {
        titulo: "Salidas",
        id: "saldec",
        headers: [
            { name: "SALDEC", label: "Declaración de salida", campo: "saldec", },
            { name: "SALDFEC", label: "Fecha de salida", campo: "saldfec", },
            { name: "SALCONS", label: "Consignatorio", campo: "salcons", },
            { name: "TIPDES", label: "Almacén", campo: "tipdes", },
            { name: "ARTCOD", label: "Código articulo", campo: "artcod", },
            { name: "SALFAC", label: "Declaración de ingreso", campo: "salfac", },
            { name: "SALBUL", label: "Bultos", campo: "salbul", },
            { name: "SALCANT", label: "Unidades", campo: "salcant", },
            // { name: "INGLIN", label: "Linea Interna", campo: "inglin", },
            // { name: "INGDEC", label: "Declaración", campo: "ingdec", },
            // { name: "CLICOD", label: "Cliente", campo: "clicod", },
        ]
    },
    {
        titulo: "Ajustes",
        id: "codaj",
        headers: [
            { name: "CODAJ", label: "Codigo de Ajuste", campo: "codaj", },
            { name: "AJFEC", label: "Fecha", campo: "ajfec", },
            { name: "AJDEC", label: "Declaración", campo: "ajdec", },
            { name: "TIPDES", label: "Almacén", campo: "tipdes", },
        ]
    },
    {
        titulo: "Faltantes",
        id: "codfal",
        headers: [
            { name: "CODFAL", label: "Codigo faltante", campo: "codfal", },
            { name: "FALDEC", label: "Declaración", campo: "faldec", },
            { name: "FALFEC", label: "Fecha", campo: "falfec", },
            { name: "SALCANT", label: "Unidades", campo: "salcant", },
            { name: "TIPDES", label: "Almacén", campo: "tipdes", },
        ]
    },
    {
        titulo: "Devoluciones",
        id: "codmer",
        headers: [
            { name: "CODMER", label: "Codigo Merma", campo: "codmer", },
            { name: "DEVDEC", label: "Declaración", campo: "devdec", },
            { name: "FALFEC", label: "Fecha", campo: "falfec", },
            { name: "SALCANT", label: "Unidades", campo: "salcant", },
            { name: "TIPDES", label: "Almacén", campo: "tipdes", },
        ]
    },
    {
        titulo: "Comisos",
        id: "codmer",
        headers: [
            { name: "CODMER", label: "Codigo Comiso", campo: "codmer", },
            { name: "DEVDEC", label: "Declaración", campo: "devdec", },
            { name: "FALFEC", label: "Fecha", campo: "falfec", },
            { name: "SALCANT", label: "Unidades", campo: "salcant", },
            { name: "TIPDES", label: "Almacén", campo: "tipdes", },
        ]
    },
    {
        titulo: "Reservados",
        id: "inglin",
        headers: [
            { name: "SALCONS", label: "Consignatorio", campo: "salcons", },
            { name: "INGLIN", label: "No. Interno", campo: "inglin", },
            { name: "FALFEC", label: "Fecha solicitado", campo: "falfec", },
            { name: "DEVDEC", label: "Declaración", campo: "devdec", },
            { name: "SALCANT", label: "Unidades", campo: "salcant", },
            { name: "TIPDES", label: "Almacén", campo: "tipdes", },
        ]
    },
    {
        titulo: "Salidas Anuladas",
        id: "saldec",
        headers: [
            { name: "SALDEC", label: "Declaración", campo: "saldec", },
            { name: "SALFAC", label: "Factura", campo: "salfac", },
            { name: "SALDFEC", label: "Fecha de salida", campo: "saldfec", },
            { name: "INGLIN", label: "Linea Interna", campo: "inglin", },
            { name: "SALCANT", label: "Unidades", campo: "salcant", },
            { name: "TIPDES", label: "Almacén", campo: "tipdes", },
        ]
    },
    {
        titulo: "Ingresos Anulados",
        id: "ingdec",
        headers: [
            { name: "INGDEC", label: "Declaración", campo: "ingdec", },
            { name: "INGPROV", label: "Proveedor", campo: "ingprov", },
            { name: "INGLIN", label: "Linea Interna", campo: "inglin", },
            { name: "INGFEC", label: "Fecha", campo: "ingfec", },
            { name: "INGBUL", label: "Bultos", campo: "ingbul", },
            { name: "INGUNIT", label: "Unidades", campo: "ingunit", },
            { name: "TIPDES", label: "Almacen", campo: "tipdes", },
            // { name: "INGCOR", label: "Correlativo", campo: "ingcor", },
            // { name: "CLICOD", label: "Cliente", campo: "clicod", },
        ]
    },
]