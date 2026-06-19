import React from "react";
import { Text } from "./Text";

interface TextExtremeEndProps {
  left: string;
  right: React.ReactNode;
  className?: string;
  leftVariant?: "h1" | "h2" | "h3" | "body" | "small" | "caption" | "thinnote";
  leftColor?: "foreground" | "muted" | "primary" | "secondary" | "white";
  leftWeight?: "thin" | "normal" | "medium" | "semibold" | "bold" | "extrabold";
  rightVariant?: "h1" | "h2" | "h3" | "body" | "small" | "caption" | "thinnote";
  rightColor?: "foreground" | "muted" | "primary" | "secondary" | "white";
  rightWeight?:
    | "thin"
    | "normal"
    | "medium"
    | "semibold"
    | "bold"
    | "extrabold";
}

export const TextExtremeEnd: React.FC<TextExtremeEndProps> = ({
  left,
  right,
  className = "",
  leftColor,
  leftVariant = "caption",
  leftWeight,
  rightColor,
  rightVariant = "small",
  rightWeight,
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <Text
        variant={leftVariant}
        weight={leftWeight || "medium"}
        color={leftColor || "muted"}
      >
        {left}
      </Text>
      <Text
        variant={rightVariant}
        weight={rightWeight || "medium"}
        color={rightColor || "muted"}
      >
        {right}
      </Text>
    </div>
  );
};
