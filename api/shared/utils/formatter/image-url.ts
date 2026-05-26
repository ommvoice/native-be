const S3_BASE = "https://native-uat.s3.eu-west-3.amazonaws.com/opportunities";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=250&auto=format&fit=crop";

export function buildImageUrl(imageName: string | null | undefined, oppType?: string): string {
  if (!imageName) return DEFAULT_IMAGE;
  const folder = oppType ? `${oppType}/` : "";
  return `${S3_BASE}/${folder}${encodeURIComponent(imageName)}`;
}

export function buildImageUrls(imageName: string | null | undefined, oppType?: string): string[] | null {
  if (!imageName) return null;
  return [buildImageUrl(imageName, oppType)];
}
