const S3_BASE = "https://native-uat.s3.eu-west-3.amazonaws.com/opportunities-3";

const OPP_IMG_FOLDER: Record<string, string> = {
  club:  "club",
  event: "event",
  route: "route",
  venue: "venue",
};


function normalizeFileName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, (ext) => {
    const extLower = ext.toLowerCase();
    if(extLower === ".jpeg" || extLower === ".png") return ".jpg";

    return extLower;
  });
}

export function buildImageUrl(imageName: string | null | undefined, oppType?: string): string {
  if (!imageName || imageName.trim() === "") return "";
  const folder = oppType ? `${OPP_IMG_FOLDER[oppType]}/` : "";

  return `${S3_BASE}/${folder}${encodeURIComponent(normalizeFileName(imageName))}`;
}

export function buildImageUrls(imageName: string | null | undefined, oppType?: string): string[] | null {
  if (!imageName) return null;
  return [buildImageUrl(imageName, oppType)];
}
