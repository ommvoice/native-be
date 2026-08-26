import { AppError } from '../shared/errors/app-error';
import { AuthService } from './auth.service';
import { ParentRepository } from '../repositories/parent.repository';
import { ChildRepository } from '../repositories/child.repository';
import { WishlistService } from './wishlist.service';
import type { OnboardParentDto } from '../dtos/onboard.dto';
import { getLocationForPostCode } from './postcode.service';

export class OnboardParentService {
  constructor(
    private readonly authService: AuthService,
    private readonly parentRepo: ParentRepository,
    private readonly childRepo: ChildRepository,
    private readonly wishlistService: WishlistService,
  ) {}

  async create(dto: OnboardParentDto): Promise<{ id: string; token: string; sub: string }> {
    const { token, user } = await this.authService.register(dto.email, dto.password);

    const location = await getLocationForPostCode(dto.postCode);
    if (!location) throw new AppError(400, 'Could not resolve postcode coordinates');

    const parent = await this.parentRepo.create({
      firstNameOrNickName: dto.firstNameOrNickName,
      postCode:            dto.postCode,
      latitude:            String(location.latitude),
      longitude:           String(location.longitude),
      placeName:           location.placeName,
      searchRadius:        dto.searchRadius ?? 25,
      userId:              user.id,
    });

    await Promise.all(
      dto.children.map(async (c) => {
        const child = await this.childRepo.create({
          parentId:               parent.id,
          nameOrNickName:         c.nameOrNickName,
          dateOfBirth:            c.dateOfBirth,
          skillIds:               [],
          interestCategoryIds:    [],
          interestSubCategoryIds: [],
          interestTags:           [],
        });
        // Every child gets a wishlist named after them by default — same as ChildService.create().
        await this.wishlistService.createDefaultForChild(parent.id, child.id, child.nameOrNickName);
      }),
    );

    return { id: parent.id, token, sub: user.sub };
  }
}
