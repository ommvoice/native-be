export interface RegisterDto {
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshDto {
  refreshToken: string;
}

export interface AuthTokenResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    sub: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface RefreshTokenResponse {
  token: string;
}
