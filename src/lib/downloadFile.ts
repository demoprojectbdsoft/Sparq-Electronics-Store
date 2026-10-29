/**
 * Saves a plain object as a formatted `.json` file in the browser.
 *
 * Used by the "Export Account Data" button, the same way `triggerCsvDownload`
 * in `csvExport.ts` saves CSV reports.
 */
export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
