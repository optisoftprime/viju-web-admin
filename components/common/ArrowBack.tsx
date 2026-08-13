"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ArrowBack() {
  const router = useRouter();

  const handleClick = () => {
    router.back();
  };

  return (
    <span
      onClick={handleClick}
      className="flex items-center gap-1 cursor-pointer"
    >
      <ArrowLeft cursor="pointer" size={20} />
      <span className="text-[14px] font-semibold text-black">Back</span>
    </span>
  );
}
