# Pricing compartido: guía rápida

Código que usan **Tarifas y Cotizaciones**. Ninguno de esos módulos importa al otro; ambos dependen solo de aquí.
Importar siempre por el barrel: `import { ... } from "@/features/pricing/shared";`

```
shared/
├─ api/
│  ├─ metodos.ts         ← catálogo de métodos de tarifa (createCatalogo)
│  ├─ proveedores.ts     ← proveedores (paginado completo)
│  ├─ clientes.ts        ← clientes
│  └─ tarifa-rangos.ts   ← SOLO lectura de rangos (las mutaciones están en tarifas/api/tarifa-rangos.ts)
├─ components/
│  ├─ ficha-resumen.tsx  ← FichaResumen (lee sus propios catálogos; funciona dentro o fuera de cualquier provider)
│  └─ resumen-item.tsx
├─ hooks/
│  └─ use-catalogos-pricing.ts ← carga y normaliza los catálogos generales ({ value, label } + camel/snake)
├─ lib/
│  ├─ formatos.ts        ← conAmbosFormatos
│  └─ vigencia-metodo.ts ← getEstadoMetodo (vencida / próxima a vencer)
└─ calculadora-embarque/ ← CALCULADORA DE EMBARQUES (corporativa, ver abajo)
   ├─ components/
   │  └─ calculadora-medidas.tsx  ← CalculadoraMedidas (diálogo)
   ├─ hooks/
   │  └─ use-unidades-embarque.ts ← unidades de medida/peso (misma consulta que useCatalogosPricing)
   └─ lib/
      ├─ constantes.ts   ← TIPO_TRANSPORTE (49/50/51), TIPOS_TRANSPORTE, UNIDAD_DEFAULT (165/162)
      ├─ calculos.ts     ← volumen, peso, volumétrico por transporte, CW, totales (funciones puras)
      ├─ etiquetas.ts    ← textos por tipo de transporte (base + solo lo que cambia)
      └─ unidades.ts     ← filtro y normalización de unidades de medida/peso
```

La calculadora tiene carpeta propia pero respeta el mismo orden por tipo que el resto del módulo
(`components/`, `hooks/`, `lib/`). Se importa igual por el barrel de `shared`.

**Regla:** aquí solo entra lo que usan ambos módulos y que no depende de ninguno de ellos. Si algo lo usa uno
solo, va en ese módulo. `shared` nunca importa de `tarifas/` ni de `cotizacion/`.

## Calculadora de embarques

`CalculadoraMedidas` funciona en cualquier pantalla, dentro o fuera de cualquier provider: lee sus unidades con
`useUnidadesEmbarque()` (no se pasan catálogos por props) y devuelve el resultado en `onAplicar`.

```tsx
<CalculadoraMedidas
  trigger={<Button>Abrir calculadora</Button>}   // o controlarla con open / onOpenChange
  codTipoTransporte={codTipoTransporte}          // cambia el volumétrico y los textos
  dimensiones={filasGuardadas}                   // opcional
  pesoInicial={peso} volumenInicial={volumen}    // opcional: totales escritos a mano
  onAplicar={({ dimensiones, totales }) => ...}  // cada módulo decide dónde guardar
/>
```

| Es de la calculadora (aquí) | Es de cada módulo (fuera de aquí) |
|---|---|
| Conversiones de longitud y peso, volumétrico por transporte (aéreo /6000, marítimo CBM×1000, terrestre m³×333) | Leer filas guardadas en BD (`cotdetdim_*`) → `cotizacion/calculo/lib/dimensiones-cotizacion.ts` |
| CW = mayor entre peso y volumétrico; redondeo a 0 decimales | Dónde se guarda el resultado (`valor_cw`, `valor_por_peso`, `total_*`) → `use-criterios-cotizacion` |
| Prioridad filas > total escrito a mano (`combinarTotales`) | Payload de guardado y fila "falsa" de totales directos → `guardar-version.ts` |
| Unidades por defecto 165/162 y textos por transporte | El botón que la abre (texto, ícono, dónde está) |

Textos propios de un transporte: agregar solo la propiedad que cambia en `ETIQUETAS_POR_TRANSPORTE` (`calculadora-embarque/lib/etiquetas.ts`).

React Query comparte la caché: `useCatalogosTarifas`, `useCatalogosCotizacion` y `FichaResumen` piden las mismas
consultas con los mismos parámetros, así que no se repiten llamadas al backend.
