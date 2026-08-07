/**
 * Browser download helpers
 */

/**
 * Save a CSV blob returned by an export endpoint to the user's device
 */
export const downloadCsvFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(
    new Blob([blob], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
