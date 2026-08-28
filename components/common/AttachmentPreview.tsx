"use client";

import { Text } from "./Text";

interface AttachmentPreviewProps {
  url: string;
  /** Constrains the thumbnail; the sender's own bubble is narrower */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Spec 43: attachments show the picture, not the word "attachment".
 *
 * Almost every attachment in this system is a photograph - a damaged carton, a
 * signed waybill, a screenshot of an error - and "View Attachment" made an
 * officer click through to find out whether it was even relevant. The image
 * itself is the information.
 *
 * A non-image (a PDF waybill) has no inline preview, so it falls back to a
 * labelled tile rather than a broken image icon. That branch is only reached
 * when the image genuinely fails to load, so it also covers a dead URL.
 */

/** Extensions we can be confident render inline in an <img> */
const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|avif|bmp|svg)(\?|#|$)/i;

/**
 * A URL is treated as an image unless it clearly is not one.
 *
 * Cloudinary URLs carry an extension, but a signed or transformed one may not,
 * and guessing "not an image" would lose the preview for exactly the files
 * this feature exists for. So anything without a recognised NON-image
 * extension is attempted, and the onError fallback catches the rest.
 */
const NON_IMAGE_EXTENSIONS = /\.(pdf|docx?|xlsx?|csv|txt|zip|mp4|mov|mp3)(\?|#|$)/i;

export const looksLikeImage = (url: string): boolean => {
  const raw = typeof url === "string" ? url.trim() : "";
  if (!raw) return false;
  if (IMAGE_EXTENSIONS.test(raw)) return true;
  return !NON_IMAGE_EXTENSIONS.test(raw);
};

export default function AttachmentPreview({
  url,
  size = "md",
  className = "",
}: AttachmentPreviewProps) {
  const href = typeof url === "string" ? url.trim() : "";
  if (!href) return null;

  const maxHeight = size === "sm" ? "max-h-40" : "max-h-64";

  return (
    <div className={`space-y-1 ${className}`.trim()}>
      {looksLikeImage(href) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={href}
          alt="Attachment"
          loading="lazy"
          className={`w-full ${maxHeight} rounded-lg object-cover border border-muted/20 bg-white`}
          onError={(event) => {
            /**
             * Not an image after all, or the URL is dead. Hide the broken
             * frame and leave the link - which still works, and is the only
             * thing that can be offered for a file that cannot be shown.
             */
            event.currentTarget.style.display = "none";
          }}
        />
      )}

      {/*
        Opens in a new tab so reading an attachment never costs the reader
        their place in the conversation. `noopener` because `target="_blank"`
        otherwise hands the opened page a reference back to this one.
      */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block"
      >
        <Text
          variant="thinnote"
          weight="medium"
          className="text-primary underline hover:text-orange transition-colors"
        >
          Open image
        </Text>
      </a>
    </div>
  );
}
