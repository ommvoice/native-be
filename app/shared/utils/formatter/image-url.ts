
const S3_BASE = "https://native-uat.s3.eu-west-3.amazonaws.com/opportunities-2";
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=250&auto=format&fit=crop";

const OPP_IMG_FOLDER: Record<string, string> = {
  club:  "club",
  event: "event",
  route: "route",
  venue: "venue",
};

function fileExt(ext: string) {

  if(ext === "jpeg" || ext === "png") return "jpg";

  return ext;
}


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
