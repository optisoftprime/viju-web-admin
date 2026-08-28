"use client";

import { Check, X } from "lucide-react";
import { Text } from "./Text";
import {
  assessPassword,
  PASSWORD_REQUIREMENT_TEXT,
  STRENGTH_PRESENTATION,
} from "@/utils/passwordStrength";

interface PasswordStrengthMeterProps {
  value: string;
  /**
   * Show the rule-by-rule list. On by default - "weak" without saying what is
   * missing leaves the user guessing, which is the failure this replaces.
   */
  showRules?: boolean;
  className?: string;
}

/**
 * Spec 43: the strength indicator - red weak, yellow moderate, green strong.
 *
 * The requirement is stated BEFORE anything is typed, not revealed as a
 * complaint afterwards, and each rule reports its own state so the reader
 * always knows what is left rather than only that they are not there yet.
 */
export default function PasswordStrengthMeter({
  value,
  showRules = true,
  className = "",
}: PasswordStrengthMeterProps) {
  const { strength, rules, metCount } = assessPassword(value);
  const presentation = STRENGTH_PRESENTATION[strength];

  const hasInput = value.length > 0;

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {/* The bar fills by rules met, so it moves for every real improvement */}
      <div className="flex items-center gap-2">
        <div
          className={`h-1.5 flex-1 rounded-full overflow-hidden ${
            hasInput ? presentation.barBackground : "bg-muted/20"
          }`}
        >
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              hasInput ? presentation.bar : ""
            }`}
            style={{
              width: hasInput ? `${(metCount / rules.length) * 100}%` : "0%",
            }}
          />
        </div>

        {hasInput && (
          <Text
            variant="thinnote"
            weight="bold"
            className={`shrink-0 ${presentation.text}`}
          >
            {presentation.label}
          </Text>
        )}
      </div>

      {/* Stated up front, whether or not anything has been typed */}
      <Text variant="thinnote" color="muted" className="block">
        {PASSWORD_REQUIREMENT_TEXT}
      </Text>

      {showRules && hasInput && (
        <ul className="space-y-0.5 pt-1">
          {rules.map((rule) => (
            <li key={rule.id} className="flex items-center gap-1.5">
              {rule.met ? (
                <Check
                  className="w-3 h-3 shrink-0 text-[#04B054]"
                  aria-hidden="true"
                />
              ) : (
                <X
                  className="w-3 h-3 shrink-0 text-muted"
                  aria-hidden="true"
                />
              )}
              <Text
                variant="thinnote"
                className={rule.met ? "text-[#04B054]" : "text-muted"}
              >
                {rule.label}
              </Text>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
