import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../shared/errors/app-error';
import { UserRepository } from '../repositories/user.repository';
import { ParentRepository, type ParentRecord } from '../repositories/parent.repository';
import { SharedTipRepository, type SharedTipRecord } from '../repositories/shared-tip.repository';
import { headObject, objectUrl, presignGet, presignPut } from '../shared/storage/s3-client';
import type {
  CreateSharedTipDto,
  CreateSharedTipPhotoUploadUrlDto,
  SharedTipPhotoContentType,
} from '../dtos/shared-tip.dto';

const UPLOAD_URL_TTL_SECONDS = 10 * 60;
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

const EXTENSIONS: Record<SharedTipPhotoContentType, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/webp': 'webp',
};

/** Photos live under shared-tips/<parentId>/ so a submission can only reference its own uploads. */
const photoPrefix = (parentId: string) => `shared-tips/${parentId}/`;

export class SharedTipService {
  constructor(
    private readonly repo = new SharedTipRepository(),
    private readonly userRepo = new UserRepository(),
    private readonly parentRepo = new ParentRepository(),
  ) {}

  /** The signed-in user's parent profile (parentId is never taken from the request). */
  private async parentFor(sub: string): Promise<ParentRecord> {
    const user = await this.userRepo.getBySub(sub);
    if (!user) throw new AppError(404, 'User not found');
    const parent = await this.parentRepo.getByUserId(user.id);
    if (!parent) throw new AppError(404, 'Parent profile not found');
    return parent;
  }

  /** Step 1 of a photo upload: a presigned PUT the app sends the image bytes to. */
  async createPhotoUploadUrl(sub: string, dto: CreateSharedTipPhotoUploadUrlDto) {
    const parent = await this.parentFor(sub);
    const key = `${photoPrefix(parent.id)}${uuidv4()}.${EXTENSIONS[dto.contentType]}`;
    const uploadUrl = await presignPut(key, dto.contentType, UPLOAD_URL_TTL_SECONDS);
    return {
      uploadUrl,
      method: 'PUT' as const,
      headers: { 'Content-Type': dto.contentType },
      photoKey: key,
      photoUrl: objectUrl(key),
      expiresIn: UPLOAD_URL_TTL_SECONDS,
    };
  }

  /** Step 2: store the tip, with the uploaded photo's key + URL when one was attached. */
  async create(sub: string, dto: CreateSharedTipDto) {
    const parent = await this.parentFor(sub);

    let photoKey: string | null = null;
    if (dto.photoKey) {
      if (!dto.photoKey.startsWith(photoPrefix(parent.id))) throw new AppError(403, 'photoKey does not belong to this user');
      const head = await headObject(dto.photoKey);
      if (!head) throw new AppError(422, 'Photo upload not found — upload the file before submitting');
      if ((head.size ?? 0) > MAX_PHOTO_BYTES) throw new AppError(422, 'Photo is too large (max 15 MB)');
      photoKey = dto.photoKey;
    }

    const record = await this.repo.create({
      parentId: parent.id,
      userId: parent.userId,
      kind: dto.kind,
      placeName: dto.placeName,
      tip: dto.tip,
      bring: dto.bring?.trim() || null,
      photoKey,
      photoUrl: photoKey ? objectUrl(photoKey) : null,
      opportunityId: dto.opportunityId ?? null,
      opportunityType: dto.opportunityId ? (dto.opportunityType ?? null) : null,
      worksFor: dto.worksFor ?? [],
      ratings: dto.ratings ?? {},
    });
    return this.withViewUrl(record);
  }

  /** The signed-in parent's own tips, newest first. */
  async listMine(sub: string) {
    const parent = await this.parentFor(sub);
    const tips = await this.repo.listByParentId(parent.id);
    tips.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return Promise.all(tips.map((t) => this.withViewUrl(t)));
  }

  /** Adds a short-lived `photoViewUrl` (the bucket is private, so `photoUrl` itself isn't viewable). */
  private async withViewUrl(tip: SharedTipRecord) {
    return { ...tip, photoViewUrl: tip.photoKey ? await presignGet(tip.photoKey) : null };
  }
}
