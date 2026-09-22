import { Injectable } from '@angular/core';
import { ROUTINES } from '../mock-data';
import { Routine } from '../models';

@Injectable({ providedIn: 'root' })
export class RutinasService {
  readonly routines = ROUTINES;

  byId(id: string): Routine | undefined {
    return this.routines.find((r) => r.id === id);
  }

  byCategory(category: string): Routine[] {
    if (category === 'todas') return this.routines;
    return this.routines.filter((r) => r.category === category);
  }
}
