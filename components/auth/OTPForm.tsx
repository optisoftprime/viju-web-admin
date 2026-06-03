"use client";

import { useState } from "react";
import OtpInput from "react-otp-input";
import { Text, Button } from "@/components/common";

export default function OTPForm() {
  const [otp, setOtp] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("OTP Form Submitted:", { otp });
  };

  return (
    <div className="flex items-center justify-center h-full px-8 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mt-8">
          <Text variant="h2" weight="bold" color="foreground">
            Enter your verification code
          </Text>
          <Text variant="caption" color="muted" className="mt-2">
            We sent a 6 digits code to james.o@viju.ng
          </Text>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-12 mt-3">
          {/* OTP Input */}
          <div className="">
            <OtpInput
              value={otp}
              onChange={setOtp}
              numInputs={6}
              renderSeparator={<span className="mx-1"></span>}
              renderInput={(props) => (
                <input
                  {...props}
                  style={{
                    backgroundColor: "#FFC6A7",
                  }}
                  className="rounded-lg text-black font-bold text-[20px] mt-5 p-4 flex justify-center items-center w-12 h-12"
                />
              )}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full bg-gradient-to-r from-primary via-orange to-primary"
          >
            Verify Code
          </Button>
        </form>
      </div>
    </div>
  );
}
