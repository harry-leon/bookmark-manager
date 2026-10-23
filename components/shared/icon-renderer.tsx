import React from "react";
import * as Icons from "lucide-react";
import { LucideProps } from "lucide-react";

interface IconRendererProps extends Omit<LucideProps, "name"> {
  name?: string | null;
}

export function IconRenderer({ name, ...props }: IconRendererProps) {
  if (!name) {
    return <Icons.Folder {...props} />;
  }

  // Lookup in Lucide icon set (supports function components and forwardRef object components)
  const IconComponent = (Icons as unknown as Record<string, any>)[name];
  if (
    IconComponent &&
    (typeof IconComponent === "function" ||
      (typeof IconComponent === "object" && IconComponent !== null))
  ) {
    const Component = IconComponent as React.ComponentType<LucideProps>;
    return <Component {...props} />;
  }

  // Try title-case variant
  const titleCase = name.charAt(0).toUpperCase() + name.slice(1);
  const AlternateComponent = (Icons as unknown as Record<string, any>)[titleCase];
  if (
    AlternateComponent &&
    (typeof AlternateComponent === "function" ||
      (typeof AlternateComponent === "object" && AlternateComponent !== null))
  ) {
    const Component = AlternateComponent as React.ComponentType<LucideProps>;
    return <Component {...props} />;
  }

  return <Icons.Folder {...props} />;
}
