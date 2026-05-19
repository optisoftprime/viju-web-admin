import React from "react";
import { Text } from "./Text";

export interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  padding?: "sm" | "md" | "lg";
  border?: boolean;
  className?: string;
}

const paddingMap = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  padding = "md",
  border = true,
  className = "",
}) => {
  const paddingClass = paddingMap[padding];
  const borderClass = border ? "border border-muted" : "";

  return (
    <div
      className={`bg-milkwhite rounded-xl ${borderClass} ${paddingClass} ${className}`.trim()}
    >
      {title && (
        <div className="mb-2">
          <Text variant="h3" color="foreground" weight="semibold">
            {title}
          </Text>
        </div>
      )}
      {subtitle && (
        <div className="mb-4">
          <Text variant="small" color="muted">
            {subtitle}
          </Text>
        </div>
      )}
      {children}
    </div>
  );
};

Card.displayName = "Card";
