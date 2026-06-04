export interface RegisterDto {
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokenResponse {
  token: string;
  user: {
    id: string;
    email: string;
    sub: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
}
