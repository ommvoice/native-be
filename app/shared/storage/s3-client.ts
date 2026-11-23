import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  PutObjectTaggingCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { env } from '../config/env';

/** Single S3 client per Lambda container (region comes from the Lambda runtime's AWS_REGION). */
const s3 = new S3Client({ region: env.awsRegion() });

/** Canonical (non-public) object URL. The uploads bucket is private, so this URL is the stable
 *  identifier stored alongside records; use `presignGet` to hand out a viewable link. */
export function objectUrl(key: string): string {
  return `https://${env.uploadsBucket()}.s3.${env.awsRegion()}.amazonaws.com/${key}`;
}

/** Presigned PUT the client uploads the file bytes to directly (bypasses API Gateway's 10 MB cap).
 *  The client must send the same Content-Type header it asked for. */
export async function presignPut(key: string, contentType: string, expiresIn: number): Promise<string> {
  return getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: env.uploadsBucket(), Key: key, ContentType: contentType }),
    { expiresIn },
  );
}

/** Uploads start tagged `upload-status=pending`; a lifecycle rule (TableStack) deletes pending
 *  objects after a day, so files that never get attached to a record don't pile up. */
export const UPLOAD_STATUS_TAG = 'upload-status';
const PENDING_TAGGING = `<Tagging><TagSet><Tag><Key>${UPLOAD_STATUS_TAG}</Key><Value>pending</Value></Tag></TagSet></Tagging>`;

/**
 * Presigned POST (multipart form upload). Unlike a presigned PUT, the signed policy enforces the
 * size range and exact Content-Type, so a client can't push a multi-GB or non-image file.
 */
export async function presignPost(key: string, contentType: string, maxBytes: number, expiresIn: number) {
  return createPresignedPost(s3, {
    Bucket: env.uploadsBucket(),
    Key: key,
    Expires: expiresIn,
    Fields: { 'Content-Type': contentType, tagging: PENDING_TAGGING },
    Conditions: [
      ['content-length-range', 1, maxBytes],
      ['eq', '$Content-Type', contentType],
      ['eq', '$tagging', PENDING_TAGGING],
    ],
  });
}

/** Marks an upload as attached to a record, so the pending-upload lifecycle rule leaves it alone. */
export async function confirmUpload(key: string): Promise<void> {
  await s3.send(new PutObjectTaggingCommand({
    Bucket: env.uploadsBucket(),
    Key: key,
    Tagging: { TagSet: [{ Key: UPLOAD_STATUS_TAG, Value: 'confirmed' }] },
  }));
}

/** First `n` bytes of an object (magic-number sniffing). */
export async function readObjectStart(key: string, n = 16): Promise<Uint8Array> {
  const res = await s3.send(new GetObjectCommand({ Bucket: env.uploadsBucket(), Key: key, Range: `bytes=0-${n - 1}` }));
  return res.Body ? new Uint8Array(await res.Body.transformToByteArray()) : new Uint8Array();
}

/** Deletes every object under a prefix (account deletion). */
export async function deletePrefix(prefix: string): Promise<void> {
  let token: string | undefined;
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket: env.uploadsBucket(), Prefix: prefix, ContinuationToken: token }));
    const keys = (page.Contents ?? []).map((o) => ({ Key: o.Key! }));
    if (keys.length) {
      await s3.send(new DeleteObjectsCommand({ Bucket: env.uploadsBucket(), Delete: { Objects: keys, Quiet: true } }));
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
}

/** Short-lived viewable link for a private object. */
export async function presignGet(key: string, expiresIn = 15 * 60): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: env.uploadsBucket(), Key: key }), { expiresIn });
}

/** Object metadata, or null when the key doesn't exist (e.g. the client never finished uploading). */
export async function headObject(key: string): Promise<{ contentType?: string; size?: number } | null> {
  try {
    const res = await s3.send(new HeadObjectCommand({ Bucket: env.uploadsBucket(), Key: key }));
    return { contentType: res.ContentType, size: res.ContentLength };
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404 || status === 403) return null;
    throw err;
  }
}
