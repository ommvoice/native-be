const S3_BASE = "https://native-uat.s3.eu-west-3.amazonaws.com/opportunities-3";

export const IMG_FOLDER: Record<string, string> = {
  root:  "",
  club:  "club",
  event: "event",
  route: "route",
  venue: "venue",
  community: "community",
};


function normalizeFileName(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, (ext) => {
    const extLower = ext.toLowerCase();
    if(extLower === ".jpeg" || extLower === ".png") return ".jpg";

    return extLower;
  });
}

export function buildImageUrl(imageName: string | null | undefined, folderName?: string, skipExtensionNormalization?: boolean): string {
  if (!imageName || imageName.trim() === "") return "";
  const folder = folderName ? `${IMG_FOLDER[folderName]}/` : IMG_FOLDER.root;

  return `${S3_BASE}/${folder}${encodeURIComponent(skipExtensionNormalization ? imageName : normalizeFileName(imageName))}`;
}

export function buildImageUrls(imageName: string | null | undefined, folderName?: string): string[] | null {
  if (!imageName) return null;
  return [buildImageUrl(imageName, folderName)];
}
