/**
 * Password strength (spec 43).
 *
 * Five rules, spelled out to the user rather than scored behind a bar they
 * cannot reason about: at least 8 characters, a lowercase letter, an uppercase
 * letter, a number, and a special character.
 *
 * The rules ARE the score. A meter that says "weak" without saying why leaves
 * someone guessing at what to add, so each rule is reported individually and
 * the band is simply how many of them hold.
 */

export type PasswordStrength = "weak" | "moderate" | "strong";

export interface PasswordRule {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordAssessment {
  strength: PasswordStrength;
  rules: PasswordRule[];
  /** How many rules hold, out of `rules.length` */
  metCount: number;
  /** Only a strong password may be submitted */
  isAcceptable: boolean;
}

/** The requirement text, shown whether or not anything has been typed */
export const PASSWORD_REQUIREMENT_TEXT =
  "Minimum of 8 characters, containing a special character, a number, and both lower and capital letters.";

const RULES: { id: string; label: string; test: (value: string) => boolean }[] =
  [
    {
      id: "length",
      label: "At least 8 characters",
      test: (value) => value.length >= 8,
    },
    {
      id: "lowercase",
      label: "A lowercase letter",
      test: (value) => /[a-z]/.test(value),
    },
    {
      id: "uppercase",
      label: "A capital letter",
      test: (value) => /[A-Z]/.test(value),
    },
    {
      id: "number",
      label: "A number",
      test: (value) => /\d/.test(value),
    },
    {
      /**
       * Anything that is not a letter, a number or whitespace. Defined by
       * exclusion rather than a fixed list, so a keyboard this list never
       * anticipated still counts - and a space alone does not, since a
       * trailing space is a typo far more often than a deliberate choice.
       */
      id: "special",
      label: "A special character (e.g. ! ? @ # $)",
      test: (value) => /[^A-Za-z0-9\s]/.test(value),
    },
  ];

/**
 * Assess a password against all five rules.
 *
 * An empty value reports every rule unmet and "weak" rather than a neutral
 * state - there is no meaningful third answer, and the rules list is what the
 * user reads before typing anything at all.
 */
export const assessPassword = (value: string): PasswordAssessment => {
  const password = typeof value === "string" ? value : "";

  const rules: PasswordRule[] = RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    met: rule.test(password),
  }));

  const metCount = rules.filter((rule) => rule.met).length;

  /**
   * Bands, and why they sit where they do.
   *
   * STRONG means every rule holds - nothing less is accepted, because the
   * spec's requirement text promises all five and a meter that says "strong"
   * while refusing the submission would be lying to the user.
   *
   * The 3-4 band is "moderate" rather than "almost there": it is close, and
   * the unmet rules below say exactly what is missing.
   */
  const strength: PasswordStrength =
    metCount === RULES.length ? "strong" : metCount >= 3 ? "moderate" : "weak";

  return {
    strength,
    rules,
    metCount,
    // Only a password meeting every rule may be submitted
    isAcceptable: strength === "strong",
  };
};

/** Colour and label per band - one place, so the bar and the text agree */
export const STRENGTH_PRESENTATION: Record<
  PasswordStrength,
  { label: string; text: string; bar: string; barBackground: string }
> = {
  weak: {
    label: "Weak",
    text: "text-[#D42D2D]",
    bar: "bg-[#D42D2D]",
    barBackground: "bg-[#FFE4E4]",
  },
  moderate: {
    label: "Moderate",
    text: "text-[#FFA10B]",
    bar: "bg-[#FFA10B]",
    barBackground: "bg-[#FFF4E1]",
  },
  strong: {
    label: "Strong",
    text: "text-[#04B054]",
    bar: "bg-[#04B054]",
    barBackground: "bg-[#D4FFE9]",
  },
};
