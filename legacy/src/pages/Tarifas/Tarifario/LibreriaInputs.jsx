// import { useMemo } from "react";

// const Libreria = (tipo, id, item) => {
//   switch (tipo) {
//     case "kilo":
//       return { id, tipo: "number", readonly: false, step: 0.1, min: 0 };
//     case "volumen":
//       return [
//         { id, label: "tipo calculo volumen", tipo: "radio", options: ["volument total", "calcular volumen"] },
//         { id, label: "cantidad cajas", tipo: "numero" },
//       ];
//     case "volumen_unico":
//       return {};
//     case "volumen_multiple":
//       return {};
//     case "volumen_multiplo":
//       return {};
//     case "volumen_total":
//       return {};

//     default:
//       break;
//   }
// };

// const A = () => {
//   const criterios = [];
//   const valores = {};

//   const

//   const inputs = useMemo(() => {

//     return criterios.map((i) => {
//       return { ...Libreria(i.cod_criterio, i.id), val: valores[i.id] };
//     });
//   }, []);

//   return <>:D</>
// };
