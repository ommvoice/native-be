import { StatusCodes } from "http-status-codes";
import AppError from "../../shared/errors/AppError.js";
import type { RequestOnboardParentCreateDto } from "./onboard-parents.dto.js";
import type { OnboardParentRepository } from "./onboard-parents.repository.js";
import type { AuthService } from "../auth/auth.service.js";
import { getLatLngForPostCode } from "../../shared/utils/external-api-calls.js";

export class OnboardParentService {
  constructor(
    private onboardParentRepository: OnboardParentRepository,
    private authService: AuthService,
  ) {}

  async create(data: RequestOnboardParentCreateDto): Promise<{ id: string; token: string; sub: string }> {
    const { token, user } = await this.authService.register(data.email, data.password);

    const latLongs = await getLatLngForPostCode(data.postCode);
    if (!latLongs) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Mapbox failed.");
    }

    const { longitude, latitude } = latLongs;
    const id = await this.onboardParentRepository.createParentAndChildren(
      data,
      user.id,
      String(latitude),
      String(longitude),
    );

    return { id, token, sub: user.sub };
  }
}
