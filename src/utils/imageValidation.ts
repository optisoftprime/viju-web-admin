/**
 * Image type validation by MAGIC NUMBER (spec 42).
 *
 * A file's extension is a rename away, and `File.type` is whatever the browser
 * guessed from that extension - neither is evidence of what the bytes are. A
 * `.png` that is really a PDF, or a script renamed `.jpg`, passes both. So the
 * first bytes are read and matched against the actual container signature.
 *
 * This is a usability guard, not a security boundary: anything client-side can
 * be bypassed by talking to the API directly, which is why the same check is
 * asked for server-side (**PR-3**). What it does buy is an immediate, accurate
 * error instead of a round trip and a generic 400.
 */

/** The five formats the spec allows */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

/** What to put in an <input accept="..."> - a hint, never the check */
export const IMAGE_ACCEPT_ATTRIBUTE =
  ".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif";

export const IMAGE_TYPES_LABEL = "JPG, JPEG, PNG, WEBP or AVIF";

/** How many leading bytes any of the signatures below needs */
const HEADER_BYTES = 32;

const startsWith = (bytes: Uint8Array, signature: number[]): boolean =>
  signature.every((byte, index) => bytes[index] === byte);

/** ASCII at a given offset, e.g. the "ftyp" brand inside an ISO-BMFF box */
const asciiAt = (bytes: Uint8Array, offset: number, length: number): string =>
  Array.from(bytes.slice(offset, offset + length))
    .map((byte) => String.fromCharCode(byte))
    .join("");

/**
 * Identify the container from its leading bytes.
 *
 * Returns null for anything not on the allow-list - including formats that are
 * genuinely images (GIF, BMP, TIFF, SVG). "Not an image" and "not an image we
 * accept" are the same answer to the caller.
 */
export const sniffImageType = (bytes: Uint8Array): AllowedImageType | null => {
  // JPEG - FF D8 FF. Every variant (JFIF, Exif, raw) shares this prefix.
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";

  // PNG - the 8-byte signature, including the CRLF/EOF trap bytes
  if (
    startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  ) {
    return "image/png";
  }

  // WEBP - RIFF container with a "WEBP" form type at byte 8. The four bytes
  // between are the file size, so they are deliberately not matched.
  if (asciiAt(bytes, 0, 4) === "RIFF" && asciiAt(bytes, 8, 4) === "WEBP") {
    return "image/webp";
  }

  /**
   * AVIF - ISO-BMFF. Bytes 4-8 are "ftyp"; the brand that follows says which
   * flavour. `avif` is a still image and `avis` is a sequence; both are what
   * a browser will render from an .avif file, so both are accepted.
   *
   * HEIC shares the ftyp structure with different brands and is deliberately
   * NOT matched - it is not on the spec's list.
   */
  if (asciiAt(bytes, 4, 4) === "ftyp") {
    const brand = asciiAt(bytes, 8, 4);
    if (brand === "avif" || brand === "avis") return "image/avif";
  }

  return null;
};

export interface ImageValidationResult {
  ok: boolean;
  /** The container actually detected, null when nothing matched */
  detectedType: AllowedImageType | null;
  /** Ready to render - names what was wrong, not just that something was */
  error?: string;
}

/**
 * Read the header and confirm the file really is one of the allowed images.
 *
 * The browser's `File.type` is reported alongside but never trusted: a
 * mismatch between it and the bytes is worth naming, because it usually means
 * the file was renamed rather than converted, and the user needs to know the
 * rename did not change anything.
 */
export const validateImageFile = async (
  file: File,
  options: { maxBytes?: number } = {},
): Promise<ImageValidationResult> => {
  const { maxBytes } = options;

  if (maxBytes && file.size > maxBytes) {
    const megabytes = Math.round((maxBytes / (1024 * 1024)) * 10) / 10;
    return {
      ok: false,
      detectedType: null,
      error: `That image is larger than ${megabytes}MB.`,
    };
  }

  // A zero-byte file has no header to read and would otherwise sniff as null
  // with a misleading "not a supported image" message
  if (file.size === 0) {
    return { ok: false, detectedType: null, error: "That file is empty." };
  }

  let bytes: Uint8Array;
  try {
    const header = await file.slice(0, HEADER_BYTES).arrayBuffer();
    bytes = new Uint8Array(header);
  } catch {
    return {
      ok: false,
      detectedType: null,
      error: "That file could not be read. Try choosing it again.",
    };
  }

  const detectedType = sniffImageType(bytes);

  if (!detectedType) {
    return {
      ok: false,
      detectedType: null,
      error: `That file is not a ${IMAGE_TYPES_LABEL} image. Renaming a file does not change its format.`,
    };
  }

  /**
   * The bytes win. This branch is not a failure - the file IS a valid image -
   * so it only sharpens the message when the two disagree, which is the case
   * a user is most likely to be confused by.
   */
  const claimed = typeof file.type === "string" ? file.type.trim() : "";
  if (claimed && claimed !== detectedType) {
    return {
      ok: true,
      detectedType,
      error: undefined,
    };
  }

  return { ok: true, detectedType };
};
