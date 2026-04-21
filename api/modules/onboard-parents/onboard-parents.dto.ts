export interface RequestChildDto {
  nameOrNickName: string;
  dateOfBirth: string;
}

export interface RequestParentAndChildrenCreateDto {
  firstNameOrNickName: string;
  postCode: string;
  children?: RequestChildDto[];
}

export interface RequestOnboardParentCreateDto {
  firstNameOrNickName: string;
  postCode: string;
  email: string;
  password: string;
  children?: RequestChildDto[];
}
