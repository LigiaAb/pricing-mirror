export const tiposTransporte = [
  { value: 1, label: "Terrestre" },
  { value: 2, label: "Aéreo" },
  { value: 3, label: "Marítimo" },
];

export const paises = [
  { value: 1, label: "Guatemala" },
  { value: 2, label: "Honduras" },
  { value: 3, label: "Japan" },
];

export const tiposProductos = [
  { value: 1, label: "Electronico" },
  { value: 2, label: "Farmaceutico" },
  { value: 3, label: "Herramientas" },
];
 
const tarifasDummy = [
  { id_tarifa: 1, origen: "Guatemala", destino: "Honduras", tipo_transporte: "Terrestre", tipo_embarque: "LCL", tipo_producto: "Electronico", rubro: "fuel", fecha_inicial: "2025-02-04", fecha_final: "2026-02-04", comodity: "", rango_inicial: 100, rango_final: 200, tipo: "Kilos", valor: 1.2, minimo: 10, porcentaje: false, moneda: "USD", proveedor: "DSV" },
  { id_tarifa: 2, origen: "Guatemala", destino: "Mexico", tipo_transporte: "Aereo", tipo_embarque: "Consolidado", tipo_producto: "Farmaceutico", rubro: "fuel", fecha_inicial: "", fecha_final: "", comodity: "", rango_inicial: 0, rango_final: 100, tipo: "Kilos", valor: 1.2, minimo: 10, porcentaje: false, moneda: "USD", proveedor: "DSV" },
  { id_tarifa: 3, origen: "Guatemala", destino: "Nicaragua", tipo_transporte: "Maritimo", tipo_embarque: "FCL", tipo_producto: "Perecederos", rubro: "fuel", fecha_inicial: "2023-12-01", fecha_final: "2025-12-01", comodity: "", rango_inicial: 200, rango_final: 300, tipo: "Kilos", valor: 1.2, minimo: 10, porcentaje: false, moneda: "USD", proveedor: "DSV" },
  { id_tarifa: 4, origen: "Honduras", destino: "El Salvador", tipo_transporte: "Aereo", tipo_embarque: "LCL", tipo_producto: "Herramientas", rubro: "fuel", fecha_inicial: "2024-05-01", fecha_final: "2025-05-01", comodity: "", rango_inicial: 50, rango_final: 150, tipo: "Kilos", valor: 1.5, minimo: 12, porcentaje: false, moneda: "USD", proveedor: "DSV" },
  { id_tarifa: 5, origen: "Japon", destino: "Guatemala", tipo_transporte: "Maritimo", tipo_embarque: "FCL", tipo_producto: "Electronico", rubro: "fuel", fecha_inicial: "2024-06-15", fecha_final: "2025-06-15", comodity: "", rango_inicial: 500, rango_final: 1000, tipo: "Kilos", valor: 3.0, minimo: 50, porcentaje: false, moneda: "USD", proveedor: "DSV" },
  { id_tarifa: 6, origen: "Guatemala", destino: "Honduras", tipo_transporte: "Terrestre", tipo_embarque: "LCL", tipo_producto: "Farmaceutico", rubro: "fuel", fecha_inicial: "2024-07-01", fecha_final: "2025-07-01", comodity: "", rango_inicial: 20, rango_final: 80, tipo: "Kilos", valor: 2.2, minimo: 8, porcentaje: false, moneda: "USD", proveedor: "DSV" },
  { id_tarifa: 7, origen: "El Salvador", destino: "Japon", tipo_transporte: "Aereo", tipo_embarque: "Consolidado", tipo_producto: "Electronico", rubro: "fuel", fecha_inicial: "2024-08-10", fecha_final: "2025-08-10", comodity: "", rango_inicial: 300, rango_final: 500, tipo: "Kilos", valor: 5.0, minimo: 15, porcentaje: false, moneda: "USD", proveedor: "DSV" },
  { id_tarifa: 8, origen: "Honduras", destino: "Guatemala", tipo_transporte: "Maritimo", tipo_embarque: "FCL", tipo_producto: "Herramientas", rubro: "fuel", fecha_inicial: "2024-09-01", fecha_final: "2025-09-01", comodity: "", rango_inicial: 100, rango_final: 300, tipo: "Kilos", valor: 2.5, minimo: 20, porcentaje: false, moneda: "USD", proveedor: "DSV" },
  { id_tarifa: 9, origen: "Guatemala", destino: "El Salvador", tipo_transporte: "Terrestre", tipo_embarque: "LCL", tipo_producto: "Farmaceutico", rubro: "fuel", fecha_inicial: "2024-10-05", fecha_final: "2025-10-05", comodity: "", rango_inicial: 10, rango_final: 100, tipo: "Kilos", valor: 1.8, minimo: 10, porcentaje: false, moneda: "USD", proveedor: "DSV" },
  { id_tarifa: 10, origen: "Japon", destino: "El Salvador", tipo_transporte: "Aereo", tipo_embarque: "Consolidado", tipo_producto: "Electronico", rubro: "fuel", fecha_inicial: "2024-11-01", fecha_final: "2025-11-01", comodity: "", rango_inicial: 400, rango_final: 900, tipo: "Kilos", valor: 4.5, minimo: 30, porcentaje: false, moneda: "USD", proveedor: "DSV" },
];


export default tarifasDummy;
