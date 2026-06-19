import React from "react";
import { Text } from "./Text";

interface BoldBottomTextProps {
  top: string;
  bottom: React.ReactNode;
  className?: string;
}

export const BoldBottomText: React.FC<BoldBottomTextProps> = ({
  top,
  bottom,
  className = "",
}) => {
  return (
    <div className={className}>
      <Text variant="caption" weight="medium" color="muted">
        {top}
      </Text>
      <Text variant="small" weight="bold" color="foreground">
        {bottom}
      </Text>
    </div>
  );
};
