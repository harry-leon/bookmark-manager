import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";

// ── S3 client singleton ────────────────────────────────────────────────────

function createS3Client(): S3Client {
  const endpoint = process.env.STORAGE_ENDPOINT;
  const region   = process.env.STORAGE_REGION   ?? "auto";
  const accessKeyId     = process.env.STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Object storage not configured. Set STORAGE_ENDPOINT, STORAGE_ACCESS_KEY_ID, and STORAGE_SECRET_ACCESS_KEY."
    );
  }

  return new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    // Cloudflare R2 requires path-style URLs
    forcePathStyle: true,
  });
}

declare global {
  // eslint-disable-next-line no-var
  var __s3Client: S3Client | undefined;
}

function getClient(): S3Client {
  if (!global.__s3Client) {
    global.__s3Client = createS3Client();
  }
  return global.__s3Client;
}

function getBucket(): string {
  const bucket = process.env.STORAGE_BUCKET;
  if (!bucket) throw new Error("STORAGE_BUCKET environment variable is not set.");
  return bucket;
}

// ── Storage key generation ─────────────────────────────────────────────────

import { randomUUID } from "node:crypto";

/**
 * Generates an opaque, server-side storage key.
 * Format: attachments/{userId}/{noteId}/{id}.{ext}
 */
export function generateStorageKey(userId: string, noteId: string, ext: string): string {
  const id = randomUUID().replace(/-/g, "");
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 8);
  return `attachments/${userId}/${noteId}/${id}${safeExt ? "." + safeExt : ""}`;
}


// ── Upload ─────────────────────────────────────────────────────────────────

/**
 * Upload a buffer to private object storage.
 * The object is NOT publicly accessible — use getSignedUrl for retrieval.
 */
export async function uploadAttachment(
  buffer: Buffer,
  storageKey: string,
  mimeType: string
): Promise<void> {
  const client = getClient();
  const bucket = getBucket();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      Body: buffer,
      ContentType: mimeType,
      // No public ACL — private by default
    })
  );
}

// ── Signed URL ─────────────────────────────────────────────────────────────

/**
 * Generate a short-lived signed URL for authenticated image retrieval.
 * Default expiry: 15 minutes.
 */
export async function getSignedUrl(
  storageKey: string,
  expiresInSeconds = 900
): Promise<string> {
  const client = getClient();
  const bucket = getBucket();

  const command = new GetObjectCommand({ Bucket: bucket, Key: storageKey });
  return awsGetSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

// ── Delete ─────────────────────────────────────────────────────────────────

/**
 * Delete an object from storage. Safe to call even if the object doesn't exist.
 */
export async function deleteAttachment(storageKey: string): Promise<void> {
  const client = getClient();
  const bucket = getBucket();

  await client.send(
    new DeleteObjectCommand({ Bucket: bucket, Key: storageKey })
  );
}

// ── Existence check ────────────────────────────────────────────────────────

export async function objectExists(storageKey: string): Promise<boolean> {
  try {
    const client = getClient();
    const bucket = getBucket();
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: storageKey }));
    return true;
  } catch {
    return false;
  }
}

// ── Storage configured? ────────────────────────────────────────────────────

export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.STORAGE_ENDPOINT &&
    process.env.STORAGE_ACCESS_KEY_ID &&
    process.env.STORAGE_SECRET_ACCESS_KEY &&
    process.env.STORAGE_BUCKET
  );
}
