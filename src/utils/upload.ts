/**
 * Upload response handling.
 *
 * POST /uploads is documented as never failing on a storage outage: it returns
 * 201 with a `placeholder://...` URL and logs the problem server-side, so the
 * frontend flow "keeps moving". That is fine for a chat attachment, but a
 * placeholder saved onto a product flyer or a waybill is a broken record, so
 * it is rejected here instead of being stored.
 */

/** URL schemes that can actually be rendered or linked */
const USABLE_SCHEME = /^(https?:)?\/\//i;

/**
 * Pull a usable public URL out of an upload response.
 * Throws when the upload did not produce something renderable.
 */
export const readUploadedUrl = (data: unknown): string => {
  const url =
    data && typeof data === "object"
      ? (data as { url?: unknown }).url
      : undefined;

  if (typeof url !== "string" || !url.trim()) {
    throw new Error("Upload did not return a file URL. Please try again.");
  }

  const trimmed = url.trim();

  if (trimmed.startsWith("placeholder://")) {
    throw new Error(
      "File storage is unavailable right now, so the image was not saved. Please try again shortly.",
    );
  }

  // A local-disk fallback returns a root-relative "/uploads/..." path, which is
  // renderable as-is; anything else must be an absolute http(s) URL
  if (!trimmed.startsWith("/") && !USABLE_SCHEME.test(trimmed)) {
    throw new Error("Upload returned an unusable file URL. Please try again.");
  }

  return trimmed;
};
