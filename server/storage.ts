import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

function getUploadRoot(): string {
  return process.env.UPLOAD_DIR || path.resolve(process.cwd(), "uploads");
}

function normalizeKey(relKey: string): string {
  const normalized = relKey
    .replace(/\\/g, "/")
    .split("/")
    .filter(part => part && part !== "." && part !== "..")
    .map(part => part.replace(/[^a-zA-Z0-9._-]/g, "_"))
    .join("/");

  if (!normalized) {
    throw new Error("Invalid storage key");
  }

  return normalized;
}

function appendHashSuffix(relKey: string): string {
  const hash = randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");

  if (lastDot === -1) {
    return `${relKey}_${hash}`;
  }

  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function buildPublicUrl(key: string): string {
  const encodedKey = key
    .split("/")
    .map(part => encodeURIComponent(part))
    .join("/");

  return `/uploads/${encodedKey}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const root = getUploadRoot();
  const key = appendHashSuffix(normalizeKey(relKey));
  const filePath = path.join(root, key);

  await fs.mkdir(path.dirname(filePath), { recursive: true });

  const buffer =
    typeof data === "string"
      ? Buffer.from(data)
      : Buffer.from(data);

  await fs.writeFile(filePath, buffer);

  return {
    key,
    url: buildPublicUrl(key),
  };
}

export async function storageGet(
  relKey: string,
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);

  return {
    key,
    url: buildPublicUrl(key),
  };
}

export async function storageGetSignedUrl(
  relKey: string,
): Promise<string> {
  const key = normalizeKey(relKey);
  return buildPublicUrl(key);
}