import type { ROLE } from "../../types/db.js";

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
