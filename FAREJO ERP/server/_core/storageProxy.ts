import express, { type Express } from "express";
import path from "node:path";

function getUploadRoot(): string {
  return process.env.UPLOAD_DIR || path.resolve(process.cwd(), "uploads");
}

export function registerStorageProxy(app: Express) {
  const uploadRoot = getUploadRoot();

  app.use(
    "/uploads",
    express.static(uploadRoot, {
      fallthrough: false,
      maxAge: "7d",
      immutable: true,
    }),
  );

  // Compatibilidade com URLs antigas salvas pelo sistema
  app.use(
    "/manus-storage",
    express.static(uploadRoot, {
      fallthrough: false,
      maxAge: "7d",
      immutable: true,
    }),
  );
}