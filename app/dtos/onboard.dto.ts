export interface OnboardChildDto {
  nameOrNickName: string;
  dateOfBirth: string;
}

export interface OnboardParentDto {
  email: string;
  password: string;
  firstNameOrNickName: string;
  postCode: string;
  children: OnboardChildDto[];
  searchRadius?: number;
}
