import type { RequestChildDto } from "../onboard-parents/onboard-parents.dto.js";

export interface RequestChildrenCreateDto {
  parentId: string;
  children: RequestChildDto[];
}
