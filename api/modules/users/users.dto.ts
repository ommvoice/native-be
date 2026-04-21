import type { ROLE } from "@prisma/client";

export enum ROLES {
  ADMIN,
  PARENT,
  PROVIDER
}

export interface RequestUserCreateDto {
  email: string;
  password: string;
  isParent?: boolean;
  isProvider?: boolean
}

export interface ResponseUserDto {
  email: string;
  role: ROLE;
}
