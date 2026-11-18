"use client";

import { Info, type LucideIcon, Plus } from "lucide-react";
import type * as React from "react";
import type { ReactNode } from "react";
import { type Control, type UseFormSetValue, useWatch } from "react-hook-form";
import { SubseccionHeader } from "@/shared/components/seccion-header";
import { Button } from "@/shared/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Separator } from "@/shared/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { FieldControl } from "./field-registry";
import type { FormFieldConfig, FormSection, FormValues } from "./types";

type AnyValues = Record<string, unknown>;

const COL_SPAN: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
  11: "col-span-11",
  12: "col-span-12",
};

function aplicarResetOnChange(fieldCfg: FormFieldConfig, setValue: UseFormSetValue<AnyValues>) {
  for (const nombre of fieldCfg.resetOnChange ?? []) {
    setValue(nombre, undefined, { shouldValidate: false, shouldDirty: true });
  }
}

function renderFieldControl(
  field: {
    value: unknown;
    onChange: (val: unknown) => void;
    onBlur: () => void;
    ref: React.Ref<HTMLElement>;
  },
  fieldState: { error?: { message?: string } },
  fieldCfg: FormFieldConfig,
  setValue: UseFormSetValue<AnyValues>,
) {
  const commonProps = {
    cfg: fieldCfg,
    value: field.value,
    onBlur: field.onBlur,
    ref: field.ref,
    onChange: (val: unknown) => {
      field.onChange(val);
      fieldCfg.onChange?.(val as string);
      aplicarResetOnChange(fieldCfg, setValue);
    },
    hasError: !!fieldState.error,
  };

  if (fieldCfg.actions && fieldCfg.actions.length > 0) {
    return (
      <div className="flex gap-2">
        <FormControl>
          <FieldControl {...commonProps} />
        </FormControl>
        {fieldCfg.actions.map((action) => (
          <Button
            key={action.label}
            type="button"
            size="sm"
            variant="outline"
            onClick={action.onClick}
            className="cursor-pointer"
          >
            <Plus className="size-3.5" />
            {action.label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <FormControl>
      <FieldControl {...commonProps} />
    </FormControl>
  );
}

export function FormSectionBlock({
  section,
  control,
  setValue,
  afterField,
}: Readonly<{
  section: FormSection;
  control: Control<AnyValues>;
  setValue: UseFormSetValue<AnyValues>;
  afterField?: Record<string, ReactNode> | undefined;
}>) {
  const SectionIcon = section.icon;
  const defaultColSpan = section.defaultColSpan ?? 12;
  // Solo se suscribe a todos los valores si algún campo depende de ellos; si no,
  // cada tecla re-renderizaría la sección entera sin necesidad.
  const dependeDeValores = section.fields.some(
    (f) => f.visibleWhen !== undefined || typeof f.hidden === "function",
  );
  const values = useWatch({ control, disabled: !dependeDeValores }) as FormValues;

  return (
    <div className={cn("space-y-4", section.className)}>
      {(section.title || section.description) && (
        <div className="space-y-2">
          {section.title &&
            (section.accent ? (
              <SubseccionHeader
                titulo={section.title}
                {...(SectionIcon ? { icono: SectionIcon as LucideIcon } : {})}
              />
            ) : (
              <div className="flex items-center gap-2">
                {SectionIcon && (
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <SectionIcon className="size-4" />
                  </span>
                )}
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                  {section.title}
                </h3>
              </div>
            ))}
          {section.description && (
            <p className="text-xs text-muted-foreground">{section.description}</p>
          )}
          {!section.accent && <Separator />}
        </div>
      )}

      <div className="grid grid-cols-12 gap-x-4 gap-y-5">
        {section.fields.map((fieldCfg) => {
          if (fieldCfg.visibleWhen && !fieldCfg.visibleWhen(values)) return null;

          // Visual separator pseudo-field
          if (fieldCfg.type === "separator") {
            return (
              <div key={fieldCfg.name} className="col-span-12 space-y-1 pt-2">
                {fieldCfg.label && (
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    {fieldCfg.label}
                  </p>
                )}
                <Separator />
              </div>
            );
          }

          const colSpan = fieldCfg.colSpan ?? defaultColSpan;
          const FieldIcon = fieldCfg.icon;
          const isToggle = fieldCfg.type === "checkbox" || fieldCfg.type === "switch";
          const isHidden =
            typeof fieldCfg.hidden === "function" ? fieldCfg.hidden(values) : !!fieldCfg.hidden;

          return (
            <div
              key={fieldCfg.name}
              className={cn(
                COL_SPAN[colSpan] ?? "col-span-12",
                fieldCfg.className,
                isHidden && "hidden",
              )}
            >
              <FormField
                control={control}
                name={fieldCfg.name}
                render={({ field, fieldState }) => {
                  // Checkbox / Switch: horizontal card layout
                  if (isToggle) {
                    return (
                      <FormItem className="flex flex-row items-center gap-4 space-y-0 rounded-lg border bg-card px-4 py-3 shadow-sm transition-colors hover:bg-muted/30">
                        <FormControl>
                          <FieldControl
                            cfg={fieldCfg}
                            value={field.value}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            onChange={(val) => {
                              field.onChange(val);
                              fieldCfg.onChange?.(val as string);
                              aplicarResetOnChange(fieldCfg, setValue);
                            }}
                            hasError={!!fieldState.error}
                          />
                        </FormControl>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          {fieldCfg.label && (
                            <FormLabel className="cursor-pointer text-sm font-medium">
                              {fieldCfg.label}
                              {fieldCfg.required && (
                                <span className="ml-1 text-destructive">*</span>
                              )}
                            </FormLabel>
                          )}
                          {fieldCfg.description && (
                            <FormDescription className="text-xs">
                              {fieldCfg.description}
                            </FormDescription>
                          )}
                        </div>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    );
                  }

                  // Multi-checkbox / radio / everything else: vertical layout
                  return (
                    <FormItem className="space-y-1.5">
                      {fieldCfg.label && (
                        <FormLabel className="flex items-center gap-1.5 text-xs font-medium">
                          {FieldIcon && !fieldCfg.prefix && !fieldCfg.suffix && (
                            <FieldIcon className="size-3.5 text-muted-foreground" />
                          )}
                          {fieldCfg.label}
                          {fieldCfg.required && <span className="text-destructive">*</span>}
                          {fieldCfg.hint && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="size-3 cursor-help text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-xs">
                                {fieldCfg.hint}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </FormLabel>
                      )}
                      {renderFieldControl(field, fieldState, fieldCfg, setValue)}
                      {fieldCfg.description && (
                        <FormDescription className="text-xs">
                          {fieldCfg.description}
                        </FormDescription>
                      )}
                      <FormMessage className="text-xs" />
                    </FormItem>
                  );
                }}
              />

              {afterField?.[fieldCfg.name] && (
                <div className="col-span-12">{afterField[fieldCfg.name]}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
