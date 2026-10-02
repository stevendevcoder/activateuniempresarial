export interface IAuthService {
  login(email: string, password: string): Promise<string>;
  validateToken(token: string): Promise<boolean>;
  refreshToken(token: string): Promise<string>;
}

export interface IUserManagementService {
  createUser(email: string, password: string, idRole?: number): Promise<void>;
  updateUser(id: number, updates: Record<string, any>): Promise<void>;
  deleteUser(id: number): Promise<void>;
}
