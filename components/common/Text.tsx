import React from "react";

export interface TextProps {
  variant: "h1" | "h2" | "h3" | "body" | "small" | "caption" | "thinnote";
  color?:
    | "foreground"
    | "muted"
    | "orange"
    | "success"
    | "statusgreen"
    | "statuslightblue"
    | "primary"
    | "secondary"
    | "white";
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
  thinnote: "text-[10px]",
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
  white: "text-white",
  orange: "text-orange",
  success: "text-success",
  statuslightblue: "text-statuslightblue",
  statusgreen: "text-statusgreen",
};

const defaultWeights: Record<TextProps["variant"], TextProps["weight"]> = {
  h1: "bold",
  h2: "semibold",
  h3: "semibold",
  body: "normal",
  small: "normal",
  caption: "normal",
  thinnote: "normal",
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
