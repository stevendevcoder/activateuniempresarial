export interface IRepository<T> {
  save(entity: T): Promise<void>;
  findById(id: number): Promise<T | null>;
  update(entity: T): Promise<void>;
  delete(id: number): Promise<void>;
}

export interface IMapper<Domain, DTO> {
  toDomain(dto: DTO): Domain;
  toDTO(domain: Domain): DTO;
}
