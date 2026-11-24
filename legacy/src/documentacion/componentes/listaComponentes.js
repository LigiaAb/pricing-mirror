import documentacionFormulario from "./documentacionFormulario";
import documentacionTabla from "./documentacionTabla";

const lista = [
  {
    id: "tabla",
    to: "tabla",
    label: "Tabla",
    contenido: documentacionTabla,
  },
  {
    id: "formulario",
    to: "formulario",
    label: "formulario",
    contenido: documentacionFormulario,
  },
  { id: "dialogo", to: "dialogo", label: "Dialogo", contenido: [] },
  { id: "menu", to: "menu", label: "Menu", contenido: [] },
  { id: "tabs", to: "tabs", label: "Tabs", contenido: [] },
];

export default lista;
