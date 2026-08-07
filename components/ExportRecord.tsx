"use client";

import exportIcon from "@/assets/icons/export.svg";
import arrowDown from "@/assets/icons/arrow-down.svg";
import Image from "next/image";
import { Text } from "./common";

interface ExportRecordProps {
  onClick?: () => void;
  isLoading?: boolean;
}

const ExportRecord = ({ onClick, isLoading = false }: ExportRecordProps) => {
  return (
    <div
      className={`flex gap-2 items-center justify-center h-full px-5 py-2 rounded-xl border border-muted/30 bg-white ${
        isLoading ? "opacity-60 pointer-events-none" : "cursor-pointer"
      }`}
      onClick={isLoading ? undefined : onClick}
    >
      <Image
        src={exportIcon}
        alt="Export"
        width={20}
        height={20}
        className="w-3 h-3"
      />
      <Text variant="small" weight="semibold" color="foreground">
        {isLoading ? "Exporting..." : "Export"}
      </Text>
      <Image
        src={arrowDown}
        alt="Arrow Down"
        width={20}
        height={20}
        className="w-5 h-5"
      />
    </div>
  );
};

export default ExportRecord;
