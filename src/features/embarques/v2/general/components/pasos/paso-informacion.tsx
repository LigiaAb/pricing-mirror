"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { CampoPorTipo } from "../../../shared/components/campos";
import { EncabezadoPaso, Pendiente, SoloConsulta } from "../../../shared/components/utils";
import { SECCIONES_INFORMACION, type SeccionInformacion } from "../../../shared/lib/campos-embarque";

/**
 * Información del embarque: los mismos campos que el módulo actual
 * (`shared/lib/campos-embarque.ts`: Shipper, Consignatario, Producto,
 * Facturación, Detalles, Rutas, Fechas) con el diseño de v2.
 * La ven todos los perfiles; solo Operaciones la edita (`editable`).
 */
export function PasoInformacion({ editable }: { editable: boolean }) {
  const [seccion, setSeccion] = React.useState(SECCIONES_INFORMACION[0]?.value ?? "");

  return (
    <div className="space-y-4">
      <EncabezadoPaso
        titulo="Información del embarque"
        descripcion="Partes, producto, facturación, detalles, rutas y fechas."
        acciones={editable ? null : <SoloConsulta />}
      />

      <Tabs value={seccion} onValueChange={setSeccion}>
        <TabsList className="flex h-auto flex-wrap justify-start">
          {SECCIONES_INFORMACION.map(({ value, titulo }) => (
            <TabsTrigger key={value} value={value}>
              {titulo}
            </TabsTrigger>
          ))}
        </TabsList>

        {SECCIONES_INFORMACION.map((s) => (
          <TabsContent key={s.value} value={s.value} className="pt-2">
            <SeccionCampos seccion={s} editable={editable} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function SeccionCampos({ seccion, editable }: { seccion: SeccionInformacion; editable: boolean }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{seccion.descripcion}</p>

      {seccion.lista ? <Pendiente texto={seccion.lista} className="min-h-20" /> : null}

      {seccion.grupos.map((grupo) => (
        <fieldset
          key={grupo.titulo}
          className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <legend className="px-1 text-sm font-semibold">{grupo.titulo}</legend>
          {grupo.campos.map((campo) => (
            <CampoPorTipo
              key={campo.key}
              id={`emb-${seccion.value}-${campo.key}`}
              campo={campo}
              soloLectura={!editable || campo.soloLectura === true}
            />
          ))}
        </fieldset>
      ))}
    </div>
  );
}
