export * from './user-repository.port';

export interface IHashingService {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

export interface ITokenService {
  sign(payload: Record<string, any>, expiresIn?: string): string;
  verify(token: string): Record<string, any>;
}
