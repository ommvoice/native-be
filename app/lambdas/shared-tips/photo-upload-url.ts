import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SharedTipService } from '../../services/shared-tip.service.js';
import { errorHandler } from '../../shared/middleware/error-handler.js';
import { bodyValidator } from '../../shared/middleware/body-validator.js';
import { getAuthUser } from '../../shared/middleware/auth-guard.js';
import { created } from '../../shared/utils/response.js';
import { createSharedTipPhotoUploadUrlSchema } from '../../schemas/shared-tip.schema.js';
import type { CreateSharedTipPhotoUploadUrlDto } from '../../dtos/shared-tip.dto';

/** POST /shared-tips/photo-upload-url — presigned S3 PUT for a Share A Tip photo.
 *  Body: { contentType }. Returns { uploadUrl, method, headers, photoKey, photoUrl, expiresIn };
 *  the app PUTs the image to uploadUrl, then sends photoKey with POST /shared-tips. */
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { sub } = getAuthUser(event);
  const dto = event.body as unknown as CreateSharedTipPhotoUploadUrlDto;
  return created(await new SharedTipService().createPhotoUploadUrl(sub, dto));
};

export const handler = middy(baseHandler)
  .use(httpJsonBodyParser())
  .use(bodyValidator(createSharedTipPhotoUploadUrlSchema))
  .use(errorHandler());
