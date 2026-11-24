const documentacion = [
  { tipo: "titulo", texto: "Descripcion", variant: "h4" },
  {
    tipo: "texto",
    texto:
      "El componente tabla es el componente encargado de mostrar una lista de datos de manera siple, permitiendo al usuario realizar acciones dirigidas a los registros de manera individual.",
  },
  { tipo: "titulo", texto: "Eventos", variant: "h4" },
  {
    tipo: "detalle",
    datos: [
      {
        label: { tipo: "texto", texto: "Seleccionar Fila", color: "secondary" },
        dato: {
          tipo: "detalle",
          datos: [
            {
              label: { tipo: "texto", texto: "Descripcion" },
              dato: {
                tipo: "texto",
                texto:
                  "Es el evento que se ejecuta al seleccionar una o varias filas de la tabla al dar clic en el cuadro de seleccion o al dar clic en algun lugar de la información de la fila.",
              },
            },
            {
              label: { tipo: "texto", texto: "Formato" },
              dato: {
                tipo: "texto",
                texto: "Es el evento que se ejecuta al seleccionar una fila",
              },
            },
            {
              label: { tipo: "texto", texto: "Formato" },
              dato: {
                tipo: "texto",
                texto: "Es el evento que se ejecuta al seleccionar una fila",
              },
            },
          ],
          texto: "test",
        },
      },
    ],
    texto: "test",
  },
  {
    tipo: "tabla",
    encabezado: ["test", "test"],
    datos: [
      [
        {
          tipo: "texto",
          color: "secondary",
          texto: "test",
        },
        "test",
      ],
    ],
  },
  {
    tipo: "detalle",
    datos: [{ label: { tipo: "texto", texto: "Nombre" }, dato: { tipo: "texto", texto: "Tabla" } }],
  },
];

export default documentacion;
