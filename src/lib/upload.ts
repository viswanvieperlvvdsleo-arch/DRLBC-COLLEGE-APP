import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

export type SavedUpload = {
  publicUrl: string;
  absolutePath: string;
};

const assertSafeSubdir = (subdir: string) => {
  // Keep this intentionally strict; we only expect controlled values like "posts", "notices", "reels".
  if (!/^[a-z0-9_-]+$/i.test(subdir)) {
    throw new Error("Invalid upload directory.");
  }
  if (subdir.includes("..")) {
    throw new Error("Invalid upload directory.");
  }
};

const sanitizeExt = (ext: string) => {
  const safe = ext.toLowerCase().replace(/[^a-z0-9.]/g, "");
  if (!safe.startsWith(".")) return "";
  if (safe.length > 10) return "";
  return safe;
};

export async function saveUploadedFile(file: File, subdir: string): Promise<SavedUpload> {
  assertSafeSubdir(subdir);

  const originalExt = sanitizeExt(path.extname(file.name || ""));
  const ext = originalExt || (file.type.startsWith("image/") ? ".png" : file.type.startsWith("video/") ? ".mp4" : "");
  const filename = `${crypto.randomUUID()}${ext}`;

  const relativeDir = path.join("public", "uploads", subdir);
  const absoluteDir = path.join(process.cwd(), relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  const absolutePath = path.join(absoluteDir, filename);
  // Stream to disk to avoid loading large uploads fully in memory.
  const readable = Readable.fromWeb(file.stream() as unknown as ReadableStream);
  await pipeline(readable, createWriteStream(absolutePath));

  const publicUrl = `/${path.posix.join("uploads", subdir, filename)}`;
  return { publicUrl, absolutePath };
}
