import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WORKERS } from '../mock-data';
import { ApiUser, WorkerTrack } from '../models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  readonly workers = signal<WorkerTrack[]>([...WORKERS]);

  loadWorkers(): Observable<WorkerTrack[]> {
    if (this.auth.user()?.demo) {
      this.workers.set([...WORKERS]);
      return of(WORKERS);
    }

    return this.http.get<ApiUser[]>(`${environment.apiUrl}/api/users`).pipe(
      map((users) =>
        users.map((user, index) => {
          const known = WORKERS.find((w) => w.email.toLowerCase() === user.email.toLowerCase());
          return (
            known ?? {
              id: user.id,
              name: user.name,
              area: 'Uniempresarial',
              avatar: ['sharit', 'laura', 'carlos', 'maria'][index % 4],
              compliance: 70 + ((user.id * 13) % 28),
              status: user.id % 2 === 0 ? 'pending' : 'ok',
              email: user.email,
              jornada: '8:00 a.m. – 5:00 p.m.',
              completedToday: user.id % 2 === 0 ? 0 : 2,
              totalToday: 2,
            } satisfies WorkerTrack
          );
        }),
      ),
      tap((list) => this.workers.set(list)),
      catchError(() => {
        this.workers.set([...WORKERS]);
        return of(WORKERS);
      }),
    );
  }

  createWorker(data: { name: string; email: string; password: string }): Observable<boolean> {
    return this.http
      .post(`${environment.apiUrl}/api/users`, { ...data, status: 1 })
      .pipe(map(() => true));
  }
}
