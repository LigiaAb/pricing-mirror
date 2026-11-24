const documentacion = [
  { tipo: "titulo", texto: "Descripcion" },
  {
    tipo: "texto",
    texto: "Formulario pre hecho que permite, por medio de las propiedades, generar un formulario con un formato preestablecido, agregando un input según el tipo solicitado.",
  },
  { tipo: "hr", texto: "Propiedades" },
  {
    tipo: "texto",
    texto: "Las propiedades del formulario son los siguientes:",
  },
  {
    tipo: "detalle",
    datos: [
      {
        label: { tipo: "titulo", texto: "onInput", color: "secondary", variant: "h5" },
        dato: {
          tipo: "detalle",
          datos: [
            {
              label: { tipo: "titulo", texto: "Descripcion", color: "black", variant: "button" },
              dato: { tipo: "texto", texto: "Funcion que devuelve el valor del input en el que se ingresa un valor." },
            },
          ],
        },
      },
    ],
  },
  { tipo: "hr", texto: "Eventos" },
  {
    tipo: "texto",
    texto: "Los eventos se ejecutan al interactuar en algun lugar del componente.",
  },
  {
    tipo: "detalle",
    datos: [
      {
        label: { tipo: "titulo", texto: "onInput", color: "secondary", variant: "h5" },
        dato: {
          tipo: "tabla",
          encabezado: [
            { tipo: "titulo", texto: "", color: "black", variant: "button" },
            { tipo: "titulo", texto: "Formato", color: "black", variant: "button" },
            { tipo: "titulo", texto: "propiedades de evento", color: "black", variant: "button" },
          ],
          datos: [
            [
              {
                tipo: "detalle",
                datos: [
                  {
                    label: { tipo: "titulo", texto: "Descripcion", color: "black", variant: "button" },
                    dato: { tipo: "texto", texto: "Funcion que devuelve el valor del input en el que se ingresa un valor." },
                  },
                  {
                    label: { tipo: "titulo", texto: "Ubicación / Nombre", color: "black", variant: "button" },
                    dato: { tipo: "texto", texto: "La funcion puede ubicarse directamente como propiedad del componente." },
                  },
                ],
              },
              { tipo: "codigo", texto: "( { id, val } ) => void", variant: "pre", component: "code" },
              {
                tipo: "detalle",
                datos: [
                  { label: { texto: "id", variant: "code" }, dato: { tipo: "texto", texto: "Indica el id del input al que se hace refetencia." } },
                  { label: { texto: "val", variant: "code" }, dato: { tipo: "texto", texto: "Indica el valor nuevo del input." } },
                ],
              },
            ],
          ],
          //   tipo: "detalle",
          //   datos: [
          //     {
          //       label: { tipo: "titulo", texto: "Ubicación / Nombre", color: "black", variant: "button" },
          //       dato: { tipo: "texto", texto: "La funcion puede ubicarse directamente como propiedad del componente." },
          //     },
          //     {
          //       label: { tipo: "titulo", texto: "Descripcion", color: "black", variant: "button" },
          //       dato: {
          //         tipo: "texto",
          //         texto: "Funcion que devuelve el valor del input en el que se ingresa un valor.",
          //       },
          //     },
          //     {
          //       label: { tipo: "titulo", texto: "Formato", color: "black", variant: "button" },
          //       dato: { tipo: "codigo", texto: "( { id, val } ) => void", variant: "pre", component: "code" },
          //     },
          //     {
          //       label: { tipo: "titulo", texto: "propiedades de evento", color: "black", variant: "button" },
          //       dato: {
          //         tipo: "detalle",
          //         datos: [
          //           {
          //             label: { texto: "id", variant: "code" },
          //             dato: { tipo: "texto", texto: "Indica el id del input al que se hace refetencia." },
          //           },
          //           {
          //             label: { texto: "val", variant: "code" },
          //             dato: { tipo: "texto", texto: "Indica el valor nuevo del input." },
          //           },
          //         ],
          //       },
          //     },
          //     {
          //       label: { tipo: "titulo", texto: "Descripcion", color: "black", variant: "button" },
          //       dato: {
          //         tipo: "texto",
          //         texto: "Funcion a ejecutarce al usar el evento <code style=\"margin:0;padding:0;font-size:inherit;\">'send'</code> del formulario.",
          //       },
          //     },
          //   ],
        },
      },
      { label: { tipo: "titulo", texto: "" }, dato: { tipo: "hr" } },
      {
        label: { tipo: "titulo", texto: "Agregar", color: "secondary", variant: "h5" },
        dato: {
          tipo: "detalle",
          datos: [
            {
              label: { tipo: "titulo", texto: "Ubicación / Nombre", color: "black", variant: "button" },
              dato: {
                tipo: "texto",
                texto: "Se encuentra dentro de la propiedad <code>botones -> Agregar -> funcion [onClick]</code>",
              },
            },
            {
              label: { tipo: "titulo", texto: "Descripcion", color: "black", variant: "button" },
              dato: { tipo: "texto", texto: "Funcion ejecutada al presionar el boton Agregar." },
            },
            {
              label: { tipo: "titulo", texto: "Formato", color: "black", variant: "button" },
              dato: { tipo: "codigo", texto: "( ) => void", variant: "pre", component: "code" },
            },
          ],
        },
      },
      { label: { tipo: "titulo", texto: "" }, dato: { tipo: "hr" } },
      {
        label: { tipo: "titulo", texto: "Cancelar", color: "secondary", variant: "h5" },
        dato: {
          tipo: "detalle",
          datos: [
            {
              label: { tipo: "titulo", texto: "Ubicación / Nombre", color: "black", variant: "button" },
              dato: {
                tipo: "texto",
                texto: "Se encuentra dentro de la propiedad <code>botones -> Cancelar -> funcion [onClick]</code>",
              },
            },
            {
              label: { tipo: "titulo", texto: "Descripcion", color: "black", variant: "button" },
              dato: { tipo: "texto", texto: "Funcion ejecutada al presionar el boton Cancelar." },
            },
            {
              label: { tipo: "titulo", texto: "Formato", color: "black", variant: "button" },
              dato: { tipo: "codigo", texto: "( ) => void", variant: "pre", component: "code" },
            },
          ],
        },
      },
      { label: { tipo: "titulo", texto: "" }, dato: { tipo: "hr" } },
      {
        label: { tipo: "titulo", texto: "Guardar", color: "secondary", variant: "h5" },
        dato: {
          tipo: "detalle",
          datos: [
            {
              label: { tipo: "titulo", texto: "Ubicación / Nombre", color: "black", variant: "button" },
              dato: {
                tipo: "texto",
                texto: "Se encuentra dentro de la propiedad <code>botones -> Guardar -> funcion [onClick]</code>",
              },
            },
            {
              label: { tipo: "titulo", texto: "Descripcion", color: "black", variant: "button" },
              dato: { tipo: "texto", texto: "Funcion ejecutada al presionar el boton Guardar." },
            },
            {
              label: { tipo: "titulo", texto: "Formato", color: "black", variant: "button" },
              dato: { tipo: "codigo", texto: "( ) => void", variant: "pre", component: "code" },
            },
          ],
        },
      },
      { label: { tipo: "titulo", texto: "" }, dato: { tipo: "hr" } },
      {
        label: { tipo: "titulo", texto: "Filtrar", color: "secondary", variant: "h5" },
        dato: {
          tipo: "detalle",
          datos: [
            {
              label: { tipo: "titulo", texto: "Ubicación / Nombre", color: "black", variant: "button" },
              dato: {
                tipo: "texto",
                texto: "Se encuentra dentro de la propiedad <code>botones -> Filtrar -> funcion [onClick]</code>",
              },
            },
            {
              label: { tipo: "titulo", texto: "Descripcion", color: "black", variant: "button" },
              dato: { tipo: "texto", texto: "Funcion ejecutada al presionar el boton Filtrar." },
            },
            {
              label: { tipo: "titulo", texto: "Formato", color: "black", variant: "button" },
              dato: { tipo: "codigo", texto: "( ) => void", variant: "pre", component: "code" },
            },
          ],
        },
      },
      { label: { tipo: "titulo", texto: "" }, dato: { tipo: "hr" } },
      {
        label: { tipo: "titulo", texto: "Accion Extra", color: "secondary", variant: "h5" },
        dato: {
          tipo: "detalle",
          datos: [
            {
              label: { tipo: "titulo", texto: "Ubicación / Nombre", color: "black", variant: "button" },
              dato: {
                tipo: "texto",
                texto: "Se encuentra dentro de la propiedad <code>botones -> Id del nuevo Boton -> funcion [onClick]</code>",
              },
            },
            {
              label: { tipo: "titulo", texto: "Descripcion", color: "black", variant: "button" },
              dato: { tipo: "texto", texto: "Funcion ejecutada al presionar el boton extra." },
            },
            {
              label: { tipo: "titulo", texto: "Formato", color: "black", variant: "button" },
              dato: { tipo: "codigo", texto: "( ) => void", variant: "pre", component: "code" },
            },
          ],
        },
      },
    ],
  },
  { tipo: "hr" },
];
export default documentacion;
