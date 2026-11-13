import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

/** Short-lived viewable link for a private object. */
export async function presignGet(key: string, expiresIn = 3600): Promise<string> {
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
