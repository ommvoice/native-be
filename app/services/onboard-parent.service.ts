import { AppError } from '../shared/errors/app-error';
import { AuthService } from './auth.service';
import { ParentRepository } from '../repositories/parent.repository';
import { ChildRepository } from '../repositories/child.repository';
import type { OnboardParentDto } from '../dtos/onboard.dto';
import { getLatLngForPostCode } from './postcode.service';

export class OnboardParentService {
  constructor(
    private readonly authService: AuthService,
    private readonly parentRepo: ParentRepository,
    private readonly childRepo: ChildRepository,
  ) {}

  async create(dto: OnboardParentDto): Promise<{ id: string; token: string; sub: string }> {
    const { token, user } = await this.authService.register(dto.email, dto.password);

    const coords = await getLatLngForPostCode(dto.postCode);
    if (!coords) throw new AppError(400, 'Could not resolve postcode coordinates');

    const parent = await this.parentRepo.create({
      firstNameOrNickName: dto.firstNameOrNickName,
      postCode:            dto.postCode,
      latitude:            String(coords.latitude),
      longitude:           String(coords.longitude),
      searchRadius:        dto.searchRadius,
      userId:              user.id,
    });

    await Promise.all(
      dto.children.map((c) =>
        this.childRepo.create({
          parentId:               parent.id,
          nameOrNickName:         c.nameOrNickName,
          dateOfBirth:            c.dateOfBirth,
          skillIds:               [],
          interestCategoryIds:    [],
          interestSubCategoryIds: [],
        }),
      ),
    );

    return { id: parent.id, token, sub: user.sub };
  }
}
