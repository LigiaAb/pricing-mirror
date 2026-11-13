# Pricing compartido: guía rápida

Código que usan **Tarifas y Cotizaciones**. Ninguno de esos módulos importa al otro; ambos dependen solo de aquí.
Importar siempre por el barrel: `import { ... } from "@/features/pricing/shared";`

```
shared/
├─ api/
│  ├─ metodos.ts         ← catálogo de métodos de tarifa (createCatalogo)
│  ├─ proveedores.ts     ← proveedores (paginado completo)
│  ├─ clientes.ts        ← clientes
│  └─ tarifa-rangos.ts   ← SOLO lectura de rangos; esquema de lib/metodos/rango.ts (mutaciones en tarifas/api/tarifa-rangos.ts)
├─ hooks/
│  └─ use-catalogos-pricing.ts ← carga y normaliza los catálogos generales ({ value, label } + camel/snake)
├─ lib/
│  ├─ campos-metodo.ts   ← motor de definición única de campos de métodos de tarifa (definirMetodo, monto, moneda, ...)
│  ├─ metodos/rango.ts   ← METODO_RANGO: campos del método rango (de aquí sale tarifaRangoSchema)
│  ├─ formatos.ts        ← conAmbosFormatos
│  └─ vigencia-metodo.ts ← getEstadoMetodo (vencida / próxima a vencer)
└─ components/
   ├─ ficha-resumen.tsx  ← FichaResumen (lee sus propios catálogos; funciona dentro o fuera de cualquier provider)
   └─ resumen-item.tsx
```

**Regla:** aquí solo entra lo que usan ambos módulos y que no depende de ninguno de ellos. Si algo lo usa uno
solo, va en ese módulo. `shared` nunca importa de `tarifas/` ni de `cotizacion/`.

React Query comparte la caché: `useCatalogosTarifas`, `useCatalogosCotizacion` y `FichaResumen` piden las mismas
consultas con los mismos parámetros, así que no se repiten llamadas al backend.
