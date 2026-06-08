import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../../database/database.config.js";
import { TABLES } from "../../database/tables.js";
import type { RequestParentAndChildrenCreateDto } from "./onboard-parents.dto.js";

export class OnboardParentRepository {
  async createParentAndChildren(
    dto: RequestParentAndChildrenCreateDto,
    newUserId: string,
    latitude: string,
    longitude: string,
  ): Promise<string> {
    const parentId = uuidv4();
    const now = new Date().toISOString();

    await db.send(
      new PutCommand({
        TableName: TABLES.parents,
        Item: {
          id: parentId,
          firstNameOrNickName: dto.firstNameOrNickName,
          userId: newUserId,
          postCode: dto.postCode,
          latitude,
          longitude,
          searchRadius: 20,
          interestCategoryIds: [],
          interestSubCategoryIds: [],
          createdAt: now,
          updatedAt: now,
        },
      }),
    );

    if (dto.children && dto.children.length > 0) {
      await Promise.all(
        dto.children.map((child) =>
          db.send(
            new PutCommand({
              TableName: TABLES.children,
              Item: {
                id: uuidv4(),
                parentId,
                nameOrNickName: child.nameOrNickName,
                dateOfBirth: new Date(child.dateOfBirth).toISOString(),
                interestCategoryIds: [],
                interestSubCategoryIds: [],
                skillIds: [],
                createdAt: now,
                updatedAt: now,
              },
            }),
          ),
        ),
      );
    }

    return parentId;
  }
}
