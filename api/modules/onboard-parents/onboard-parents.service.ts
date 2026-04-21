import { StatusCodes } from "http-status-codes";
import AppError from "../../shared/errors/AppError.js";
import type { RequestOnboardParentCreateDto } from "./onboard-parents.dto.js";
import type { UserRepository } from "../users/users.repository.js";
import type { OnboardParentRepository } from "./onboard-parents.repository.js";
import { getLatLngForPostCode } from "../../shared/utils/external-api-calls.js";

export class OnboardParentService {
  constructor(
    private onboardParentRepository: OnboardParentRepository,
    private userRepository: UserRepository,
  ) {}

  async create(data: RequestOnboardParentCreateDto): Promise<string> {
    const existingEntity = await this.userRepository.getByEmail(data.email);
    if (existingEntity)
      throw new AppError(StatusCodes.CONFLICT, "Duplicate entry.");
    const sub = "sub"; // TODO: get from cognito

    const newUserId = await this.userRepository.create(
      data.email,
      "PARENT",
      sub,
    );
    const latLongs = await getLatLngForPostCode(data.postCode);
    if (!latLongs) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Mapbox failed.");
    }

    const { longitude, latitude } = latLongs;
    return await this.onboardParentRepository.createParentAndChildren(
      data,
      newUserId,
      String(latitude),
      String(longitude),
    );
  }
}
