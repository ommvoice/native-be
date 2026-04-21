import AppError from "../../shared/errors/AppError.js";
import type { UserRepository } from "./users.repository.js";
import type { ResponseUserDto } from "./users.dto.js";

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getById(id: string): Promise<ResponseUserDto> {
    console.log('g1: ', {id})
    const entity = await this.userRepository.getById(id);
    if (!entity) throw new AppError(404, "Entity not found");

    const { email, role } = entity;

    return {
      id,
      email,
      role,
    } as ResponseUserDto;
  }

  async getByEmail(email: string): Promise<ResponseUserDto> {
    const entity = await this.userRepository.getByEmail(email);
    if (!entity) throw new AppError(404, "Entity not found");

    const { id, role } = entity;

    return {
      id,
      email,
      role,
    } as ResponseUserDto;
  }
}
