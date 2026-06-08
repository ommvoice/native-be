export interface RequestChildDto {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

export interface RequestParentCreateDto {
  firstName: string;
  lastName: string;
  postCode: string;
  password: string;
  children?: RequestChildDto[];
}

export interface RequestParentAddChildDto {
  parentId: string;
  children: RequestChildDto[];
}

export interface RequestChildrenCreateDto {
  parentId: string;
  children: RequestChildDto[];
}
