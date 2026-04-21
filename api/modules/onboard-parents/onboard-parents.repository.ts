import prisma from "../../database/database.config.js";
import type { RequestParentAndChildrenCreateDto } from "./onboard-parents.dto.js";

export class OnboardParentRepository {
  async createParentAndChildren(
    dto: RequestParentAndChildrenCreateDto,
    newUserId: string,
    latitude: string,
    longitude: string,
  ): Promise<string> {
    const createData = {
      firstNameOrNickName: dto.firstNameOrNickName,
      user: {
        connect: { id: newUserId },
      },
      postCode: dto.postCode,
      latitude,
      longitude,
      searchRadius: 20, // Default value
      ...(dto.children &&
        dto.children.length > 0 && {
          children: {
            create: dto.children.map((child) => ({
              nameOrNickName: child.nameOrNickName,
              dateOfBirth: new Date(child.dateOfBirth),
            })),
          },
        }),
    };

    const newEntity = await prisma.parents.create({ data: createData });
    return newEntity.id;
  }
}
