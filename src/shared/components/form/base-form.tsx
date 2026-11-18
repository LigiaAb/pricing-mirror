"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { type DefaultValues, type Resolver, useForm } from "react-hook-form";
import { ErrorDeNegocio } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import { Form } from "@/shared/components/ui/form";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import { FormSectionBlock } from "./form-section-block";
import type { FormBuilderProps, FormSection, FormValues } from "./types";

type AnyValues = Record<string, unknown>;

export function FormBuilder<
  TValues extends FormValues = FormValues,
  TInput extends FormValues = TValues,
>({
  schema,
  defaultValues = {},
  sections,
  fields,
  onSubmit,
  onCancel,
  isLoading = false,
  submitDisabled = false,
  labels,
  title,
  description,
  stickyFooter = false,
  hideFooter = false,
  className,
  children,
  afterField,
  mode = "onTouched",
  editableFields,
}: Readonly<FormBuilderProps<TValues, TInput>>) {
  const resolvedSections = (sections ?? (fields ? [{ fields }] : [])) as FormSection[];
  const editableFieldNames = editableFields ? new Set(editableFields) : undefined;
  const formSections = editableFieldNames
    ? resolvedSections.map((section) => ({
        ...section,
        fields: section.fields.map((field) => ({
          ...field,
          disabled: field.disabled || !editableFieldNames.has(field.name),
        })),
      }))
    : resolvedSections;

  const form = useForm<AnyValues>({
    ...(schema
      ? {
          resolver: zodResolver(schema as Parameters<typeof zodResolver>[0]) as Resolver<AnyValues>,
        }
      : {}),
    defaultValues: defaultValues as DefaultValues<AnyValues>,
    mode,
  });

  const [submitting, setSubmitting] = React.useState(false);
  const isPending = isLoading || submitting;

  async function handleSubmit(values: AnyValues) {
    setSubmitting(true);
    try {
      await onSubmit(values as TValues);
    } catch (error) {
      // Rechazo de negocio: el MutationCache ya avisó al usuario con un toast.
      if (!(error instanceof ErrorDeNegocio)) throw error;
    } finally {
      setSubmitting(false);
    }
  }

  const footer = !hideFooter && (
    <div
      className={cn(
        "flex items-center justify-end gap-2 pt-2",
        stickyFooter && "sticky bottom-0 -mx-6 -mb-6 border-t bg-card/95 px-6 py-4 backdrop-blur",
      )}
    >
      {onCancel && (
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
          {labels?.cancel ?? "Cancelar"}
        </Button>
      )}
      <Button type="submit" size="sm" disabled={isPending || submitDisabled}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {labels?.loading ?? "Guardando..."}
          </>
        ) : (
          (labels?.submit ?? "Guardar")
        )}
      </Button>
    </div>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className={cn("space-y-6", stickyFooter && "pb-6", className)}
          noValidate
        >
          {(title || description) && (
            <div className="space-y-1">
              {title && (
                <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
              )}
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
          )}

          {formSections.map((section, i) => (
            <FormSectionBlock
              key={section.id ?? i}
              section={section}
              control={form.control}
              setValue={form.setValue}
              afterField={afterField}
            />
          ))}

          {children}

          {footer}
        </form>
      </Form>
    </TooltipProvider>
  );
}
