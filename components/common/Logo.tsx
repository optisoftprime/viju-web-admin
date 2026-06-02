"use client";

import Image from "next/image";
import logo from "@/assets/images/viju-logo.png";
interface LogoProps {
  width?: string;
  height?: string;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({
  width = "w-[165px]",
  height = "h-[165px]",
  className = "rounded-lg",
}) => {
  return (
    <Image
      src={logo}
      width={400}
      height={400}
      alt="viju brand logo"
      className={`${width} ${height} ${className}`}
      loading="eager"
    />
  );
};

export default Logo;
