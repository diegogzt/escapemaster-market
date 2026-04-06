import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || import.meta.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || import.meta.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || import.meta.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || import.meta.env.R2_BUCKET_NAME || "master";
const PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL || import.meta.env.R2_PUBLIC_BASE_URL || "https://pub-d893856059e2460aa3f811b26da67ab2.r2.dev";

export function getPublicUrl(key: string): string {
  if (!key) return "";
  if (key.startsWith("http")) return key;
  return `${PUBLIC_BASE_URL}/${key}`;
}

export async function generatePresignedUploadUrl(
  key: string,
  contentType: string = "image/jpeg",
  expiresIn: number = 3600
): Promise<{ uploadUrl: string; key: string; expiresAt: string }> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return { uploadUrl, key, expiresAt };
}

export async function generatePresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  await s3Client.send(command);
}

export async function listFiles(prefix: string, maxKeys: number = 100): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });
  const response = await s3Client.send(command);
  return (response.Contents || []).map((obj) => obj.Key || "");
}

export function buildRoomImageKey(roomId: string, filename: string): string {
  return `escape-rooms/${roomId}/images/${filename}`;
}

export function buildOrgLogoKey(orgId: string, filename: string): string {
  return `organizations/${orgId}/logo/${filename}`;
}

export function buildOrgGalleryKey(orgId: string, filename: string): string {
  return `organizations/${orgId}/gallery/${filename}`;
}

export function buildUserAvatarKey(userId: string, filename: string): string {
  return `usuarios/${userId}/avatar/${filename}`;
}

export function extractKeyFromUrl(url: string): string | null {
  if (!url) return null;
  if (!url.startsWith(PUBLIC_BASE_URL)) return null;
  return url.replace(`${PUBLIC_BASE_URL}/`, "");
}

export interface UploadResult {
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
}

export async function uploadFromUrl(sourceUrl: string, destKey: string): Promise<UploadResult> {
  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      return { success: false, error: `Failed to fetch source: ${response.status}` };
    }
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: destKey,
      Body: Buffer.from(buffer),
      ContentType: contentType,
    });

    await s3Client.send(command);
    return { success: true, key: destKey, url: getPublicUrl(destKey) };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export { s3Client, BUCKET, PUBLIC_BASE_URL };
