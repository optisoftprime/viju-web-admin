import React from "react";

export interface TextProps {
  variant: "h1" | "h2" | "h3" | "body" | "small" | "caption";
  color?: "foreground" | "muted" | "primary" | "secondary";
  weight?: "thin" | "normal" | "medium" | "semibold" | "bold" | "extrabold";
  children: React.ReactNode;
  className?: string;
}

const sizeMap = {
  h1: "text-3xl",
  h2: "text-2xl",
  h3: "text-xl",
  body: "text-base",
  small: "text-sm",
  caption: "text-xs",
};

const weightMap = {
  thin: "font-thin",
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  extrabold: "font-extrabold",
};

const colorMap = {
  foreground: "text-foreground",
  muted: "text-muted",
  primary: "text-primary",
  secondary: "text-secondary",
};

const defaultWeights: Record<TextProps["variant"], TextProps["weight"]> = {
  h1: "bold",
  h2: "semibold",
  h3: "semibold",
  body: "normal",
  small: "normal",
  caption: "normal",
};

export const Text: React.FC<TextProps> = ({
  variant,
  color = "foreground",
  weight,
  children,
  className = "",
}) => {
  const finalWeight = (weight || defaultWeights[variant])!;
  const sizeClass = sizeMap[variant];
  const weightClass = weightMap[finalWeight];
  const colorClass = colorMap[color];

  const Element = variant.startsWith("h") ? (variant as any) : "p";

  return React.createElement(
    Element,
    {
      className:
        `${sizeClass} ${weightClass} ${colorClass} ${className}`.trim(),
    },
    children,
  );
};

Text.displayName = "Text";
