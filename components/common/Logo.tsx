"use client";

import Image from "next/image";
import logo from "@/assets/images/viju-logo.png";
interface LogoProps {
  width?: string;
  height?: string;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({
  width = "w-10",
  height = "h-10",
  className = "rounded-lg",
}) => {
  return (
    <Image
      src={logo}
      width={400}
      height={400}
      alt="viju brand logo"
      className={`${width} ${height} ${className}`}
    />
  );
};

export default Logo;
