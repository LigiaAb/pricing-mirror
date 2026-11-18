import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-card text-foreground",
        destructive:
          "border-destructive/50 bg-destructive/10 text-black dark:text-white dark:border-destructive [&>svg]:text-black dark:[&>svg]:text-white",
        success:
          "border-success/50 bg-success/10 text-black dark:text-white dark:border-success [&>svg]:text-black dark:[&>svg]:text-white",
        warning:
          "border-warning/50 bg-warning/10 text-black dark:text-white dark:border-warning [&>svg]:text-black dark:[&>svg]:text-white",
        info: "border-info/50 bg-info/15 text-black dark:text-white dark:border-info [&>svg]:text-black dark:[&>svg]:text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & { children: React.ReactNode }
>(({ className, children, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
    {...props}
  >
    {children}
  </h5>
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
  ),
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertDescription, AlertTitle };
