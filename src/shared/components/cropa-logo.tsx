import Image from "next/image";

export function CropaLogo({ className }: Readonly<{ className?: string }>) {
  return (
    <Image
      src="/images/CROPA_DSV_ICON.svg"
      alt="Cropa Logo"
      width={150}
      height={60}
      priority
      className={className}
    />
  );
}
