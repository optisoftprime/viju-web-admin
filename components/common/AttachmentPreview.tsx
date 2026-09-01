"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
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
 * labelled tile rather than a broken image icon. That branch also catches a
 * dead URL, and a file that turned out not to be an image after all.
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

/**
 * The file's own name, for the non-image tile.
 *
 * Storage URLs end in the stored filename, which is the only thing we know
 * about a file we cannot render. Query strings and fragments are stripped, and
 * a URL that carries no usable name falls back to the file type.
 */
const fileNameOf = (url: string): string => {
  try {
    const path = url.split(/[?#]/)[0];
    const name = decodeURIComponent(path.split("/").pop() ?? "");
    return name.trim();
  } catch {
    // A malformed escape sequence in the URL is not worth failing over
    return "";
  }
};

/** Upper-case extension, e.g. "PDF" - the label on the fallback tile */
const extensionOf = (url: string): string => {
  const match = fileNameOf(url).match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toUpperCase() : "FILE";
};

export default function AttachmentPreview({
  url,
  size = "md",
  className = "",
}: AttachmentPreviewProps) {
  /**
   * Set when the browser gives up on the <img>. Held in state rather than by
   * hiding the node in the error handler: a DOM mutation is undone by the next
   * render, which puts the broken frame straight back and re-requests the
   * dead URL.
   */
  const [failedToLoad, setFailedToLoad] = useState(false);

  const href = typeof url === "string" ? url.trim() : "";

  /**
   * A new URL deserves a fresh attempt - replacing a waybill reuses this
   * component, and carrying the previous file's failure over would show the
   * fallback tile for an image that loads perfectly well.
   */
  const [lastUrl, setLastUrl] = useState(href);
  if (lastUrl !== href) {
    setLastUrl(href);
    setFailedToLoad(false);
  }

  if (!href) return null;

  const showImage = looksLikeImage(href) && !failedToLoad;
  const maxHeight = size === "sm" ? "max-h-40" : "max-h-64";

  return (
    <div className={`space-y-1 ${className}`.trim()}>
      {showImage ? (
        /**
         * `object-contain`, not `object-cover`.
         *
         * These are documents as often as they are photographs, and cover
         * crops to fill the box - on a waybill or a screenshot that removes
         * the header and footer, which are exactly the parts that identify
         * it. What is left is a band of text with no frame of reference,
         * which reads as if it were part of this page rather than a picture
         * of something else. Contain shows the whole file, letterboxed
         * against a tinted panel so its edges are visible.
         */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={href}
          alt="Attachment"
          loading="lazy"
          className={`w-full ${maxHeight} rounded-lg object-contain border border-muted/20 bg-[#F0F5F9] p-1`}
          onError={() => setFailedToLoad(true)}
        />
      ) : (
        /* No inline preview: a PDF, another document type, or a dead URL.
           A labelled tile says what it is instead of leaving a bare link. */
        <div className="flex items-center gap-3 rounded-lg border border-muted/20 bg-[#F0F5F9] px-3 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-muted">
            <FileText className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <Text
              variant="thinnote"
              weight="medium"
              color="foreground"
              className="block truncate"
            >
              {fileNameOf(href) || `${extensionOf(href)} attachment`}
            </Text>
            <Text variant="thinnote" color="muted" className="block">
              {failedToLoad
                ? "Preview unavailable - open it to view"
                : `${extensionOf(href)} document`}
            </Text>
          </span>
        </div>
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
          {/* "Open image" is a lie for a PDF waybill */}
          {showImage ? "Open image" : "Open file"}
        </Text>
      </a>
    </div>
  );
}
