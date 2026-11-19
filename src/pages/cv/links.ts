// Link rules shared by the preview and the LaTeX export.

export const mailtoOf = (address: string) =>
  address.trim() ? `mailto:${address.trim()}` : "";

/**
 * Link of the QR code: same as the text link, with "_qr-code" added to its
 * "src" tracking parameter, so a scan can be told apart from a click.
 */
export function qrLinkOf(url: string): string {
  return url.replace(
    /([?&]src=)([^&#]*)/,
    (match, prefix: string, code: string) =>
      code && !code.endsWith("_qr-code") ? `${prefix}${code}_qr-code` : match,
  );
}

/** Address shown for a link: without the protocol, the tracking and the trailing slash. */
export function displayUrl(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[?#].*$/, "")
    .replace(/\/$/, "");
}
