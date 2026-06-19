"use client";

import Image from "next/image";
import { Text } from "../common";
import Logo from "../common/Logo";
import padlock from "@/assets/icons/padlock.svg";

interface AuthBannerProps {
  showLockup?: boolean;
}

const AuthBanner: React.FC<AuthBannerProps> = ({ showLockup }) => {
  return (
    <div>
      {showLockup ? (
        <div className="">
          <Image
            src={padlock}
            width={400}
            height={400}
            alt="padlock image"
            className={`w-[395px] h-[395px] `}
          />
        </div>
      ) : (
        <div className="flex flex-col space-y-1 justify-center items-center">
          {/* Logo */}
          <Logo width="w-24" height="h-24" className="rounded-lg" />

          {/* Brand Name */}
          <Text variant="h2" weight="bold" color="white">
            Viju
          </Text>

          {/* Portal Tagline */}
          <Text variant="caption" weight="medium" color="white">
            STAFF PORTAL – VIJU DISTRIBUTION
          </Text>
        </div>
      )}
    </div>
  );
};

export default AuthBanner;
