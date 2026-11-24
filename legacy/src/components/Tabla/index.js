// export * from "./TablaComponent";
// export * from "./TablaEditable/editableDataGridComponentStyle";

export const accionesBase = { ver: false, editar: false, eliminar: false, copiar: false, pegar: false, guardar: false, agregar: false, autorizar: false };

export const datosBotonesIcono = {
  add: { icono: "c-suma", tooltip: "Agregar", color: "primary" },
  limpiar: { icono: "c-cancelar", tooltip: "Limpiar", color: "error" },
  view: { icono: "c-ver", tooltip: "Ver", color: "secondary" },
  go: { icono: "c-link", tooltip: "Ir a URL", color: "primary" },
  copy: { icono: "c-copiar", tooltip: "Copiar", color: "blueGrey" },
  paste: { icono: "c-pegar", tooltip: "Pegar", color: "black" },
  auth: { icono: "c-cheque", tooltip: "Autorizar", color: "primary" },
  edit: { icono: "c-lapiz", tooltip: "Editar", color: "secondary" },
  excel: { icono: "c-excel", tooltip: "Descargar Excel", color: "excel" },
  pdf: { icono: "c-pdf", tooltip: "Descargar PDF", color: "pdf" },
  pdf1: { icono: "c-pdf", tooltip: "Descargar PDF", color: "green" },
  download: { icono: "c-descargar", tooltip: "Descargar", color: "primary" },
  delete: { icono: "c-eliminar", tooltip: "Eliminar", color: "error" },
  cancel: { icono: "c-x1", tooltip: "Cancelar", color: "error" },
  save: { icono: "c-guardar", tooltip: "Guardar", color: "primary" },
  mail: { icono: "c-mail", tooltip: "Enviar", color: "accent" },
  print: { icono: "c-impresora", tooltip: "Imprimir", color: "black" },
  kanban: { icono: "c-kanban", tooltip: "kanban", color: "success" },
};

export const accionesDeTablaBase = {
  add: () => {},
  view: () => {},
  go: () => {},
  copy: () => {},
  paste: () => {},
  auth: () => {},
  edit: () => {},
  excel: () => {},
  pdf: () => {},
  pdf1: () => {},
  download: () => {},
  delete: () => {},
};
