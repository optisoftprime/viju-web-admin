import React from "react";
import { Text } from "./Text";

interface BoldTopTextProps {
  top: string;
  bottom: React.ReactNode;
  className?: string;
}

export const BoldTopText: React.FC<BoldTopTextProps> = ({
  top,
  bottom,
  className = "",
}) => {
  return (
    <div className={className}>
      <Text variant="small" weight="bold" color="foreground">
        {top}
      </Text>
      <Text variant="caption" weight="medium" color="muted">
        {bottom}
      </Text>
    </div>
  );
};
