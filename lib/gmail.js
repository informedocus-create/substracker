export function getHeader(headers, name) {
  return headers.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  )?.value;
}

export function decodeBase64(data) {
  if (!data) return "";
  // In Node.js environment (server-side)
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), "base64").toString("utf-8");
}
