export interface OnboardChildDto {
  nameOrNickName: string;
  dateOfBirth: string;
}

export interface OnboardParentDto {
  email: string;
  password: string;
  firstNameOrNickName: string;
  postCode: string;
  searchRadius: number;
  children: OnboardChildDto[];
}
