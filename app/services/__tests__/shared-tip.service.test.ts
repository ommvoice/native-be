import { beforeEach, describe, expect, it, vi } from 'vitest';

const s3 = vi.hoisted(() => ({
  headObject: vi.fn(),
  presignPut: vi.fn(async (key: string) => `https://signed.example/put/${key}`),
  presignGet: vi.fn(async (key: string) => `https://signed.example/get/${key}`),
  objectUrl: (key: string) => `https://bucket.s3.eu-west-3.amazonaws.com/${key}`,
}));
vi.mock('../../shared/storage/s3-client', () => s3);

import { SharedTipService } from '../shared-tip.service';
import { createSharedTipSchema } from '../../schemas/shared-tip.schema';

const parent = { id: 'parent-1', userId: 'user-1' };
const makeService = () => {
  const repo = {
    create: vi.fn(async (data: Record<string, unknown>) => ({ ...data, id: 'tip-1', status: 'pending', createdAt: 'now', updatedAt: 'now' })),
    listByParentId: vi.fn(),
  };
  const userRepo = { getBySub: vi.fn(async () => ({ id: 'user-1', sub: 'sub-1' })) };
  const parentRepo = { getByUserId: vi.fn(async () => parent) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = new SharedTipService(repo as any, userRepo as any, parentRepo as any);
  return { service, repo };
};

const baseTip = { kind: 'venue' as const, placeName: 'Haldon Forest Park', tip: 'Great trails' };

describe('SharedTipService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('issues an upload URL under the parent prefix with a matching extension', async () => {
    const { service } = makeService();
    const res = await service.createPhotoUploadUrl('sub-1', { contentType: 'image/jpeg' });
    expect(res.photoKey).toMatch(/^shared-tips\/parent-1\/[0-9a-f-]{36}\.jpg$/);
    expect(res.uploadUrl).toContain(res.photoKey);
    expect(res.headers).toEqual({ 'Content-Type': 'image/jpeg' });
    expect(res.photoUrl).toBe(s3.objectUrl(res.photoKey));
  });

  it('stores the uploaded photo key + URL with the tip', async () => {
    const { service, repo } = makeService();
    s3.headObject.mockResolvedValue({ contentType: 'image/jpeg', size: 1000 });
    const key = 'shared-tips/parent-1/abc.jpg';
    const res = await service.create('sub-1', { ...baseTip, photoKey: key, worksFor: ['Low Effort'], ratings: { kidsEnjoyed: 5 } });
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      parentId: 'parent-1', userId: 'user-1', photoKey: key, photoUrl: s3.objectUrl(key), worksFor: ['Low Effort'],
    }));
    expect(res.photoViewUrl).toBe(`https://signed.example/get/${key}`);
  });

  it("rejects another parent's photo key", async () => {
    const { service, repo } = makeService();
    await expect(service.create('sub-1', { ...baseTip, photoKey: 'shared-tips/parent-2/x.jpg' })).rejects.toMatchObject({ statusCode: 403 });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('rejects a photo key that was never uploaded', async () => {
    const { service } = makeService();
    s3.headObject.mockResolvedValue(null);
    await expect(service.create('sub-1', { ...baseTip, photoKey: 'shared-tips/parent-1/x.jpg' })).rejects.toMatchObject({ statusCode: 422 });
  });

  it('stores a tip without a photo', async () => {
    const { service, repo } = makeService();
    await service.create('sub-1', baseTip);
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ photoKey: null, photoUrl: null, bring: null }));
    expect(s3.headObject).not.toHaveBeenCalled();
  });
});

describe('createSharedTipSchema', () => {
  it('requires kind/placeName/tip and bounds ratings', async () => {
    await expect(createSharedTipSchema.validate({ placeName: 'x', tip: 'y' })).rejects.toThrow();
    await expect(createSharedTipSchema.validate({ ...baseTip, ratings: { kidsEnjoyed: 6 } })).rejects.toThrow();
    await expect(createSharedTipSchema.validate({ ...baseTip, opportunityId: 'o1' })).rejects.toThrow(/opportunityType/);
    const ok = await createSharedTipSchema.validate({ ...baseTip, opportunityId: 'o1', opportunityType: 'venue', worksFor: ['Breather'] });
    expect(ok.worksFor).toEqual(['Breather']);
  });
});
