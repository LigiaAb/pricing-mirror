import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  htmlFor?: string;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, htmlFor, ...props }, ref) => (
    // biome-ignore lint/a11y/noLabelWithoutControl: reusable Label component — association provided by consumer
    <label ref={ref} htmlFor={htmlFor} className={cn(labelVariants(), className)} {...props} />
  ),
);
Label.displayName = "Label";

export { Label };
