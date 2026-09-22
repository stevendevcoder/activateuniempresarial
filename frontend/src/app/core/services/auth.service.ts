import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DEMO_USERS, DEFAULT_PREFERENCES, roleFromUser } from '../mock-data';
import { ApiUser, LoginResponse, Preferences, SessionUser } from '../models';

const TOKEN_KEY = 'activate_token';
const USER_KEY = 'activate_user';
const PREF_KEY = 'activate_preferences';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly user = signal<SessionUser | null>(this.readUser());
  readonly preferences = signal<Preferences>(this.readPreferences());
  readonly firstName = computed(() => this.user()?.name.split(' ')[0] ?? 'tú');

  constructor() {
    if (!this.isAuthenticated()) {
      this.clearSession();
    }
  }

  login(email: string, password: string): Observable<SessionUser> {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const demo = this.matchDemo(cleanEmail, cleanPassword);

    if (demo) {
      return of(this.enterDemo(demo));
    }

    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/api/login`, {
        email: cleanEmail,
        password: cleanPassword,
      })
      .pipe(
        switchMap((res) => {
          this.saveToken(res.token);
          return this.loadProfile(cleanEmail, res.token);
        }),
      );
  }

  private matchDemo(email: string, password: string) {
    return DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
  }

  private enterDemo(demo: (typeof DEMO_USERS)[number]): SessionUser {
    const { password: _password, ...session } = demo;
    this.saveToken('demo-token');
    this.setUser(session);
    return session;
  }

  private loadProfile(email: string, token: string): Observable<SessionUser> {
    return this.http
      .get<ApiUser>(`${environment.apiUrl}/api/users/email/${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .pipe(
        map((apiUser) => this.toSession(apiUser)),
        tap((session) => this.setUser(session)),
        catchError(() => {
          const payload = this.decodeToken(token);
          const session: SessionUser = {
            id: Number(payload?.['id'] ?? 0),
            name: email.split('@')[0].replace('.', ' '),
            email,
            role: roleFromUser('', email),
            area: 'Uniempresarial',
            jornada: '8:00 a.m. – 5:00 p.m.',
            avatar: roleFromUser('', email) === 'administrador' ? 'admin' : 'sharit',
            demo: false,
          };
          this.setUser(session);
          return of(session);
        }),
      );
  }

  private toSession(apiUser: ApiUser): SessionUser {
    const role = roleFromUser(apiUser.name, apiUser.email);
    const demoMatch = DEMO_USERS.find((u) => u.email.toLowerCase() === apiUser.email.toLowerCase());
    return {
      id: apiUser.id,
      name: apiUser.name,
      email: apiUser.email,
      role,
      area: demoMatch?.area ?? (role === 'administrador' ? 'Talento Humano' : 'Administrativa'),
      jornada: demoMatch?.jornada ?? '8:00 a.m. – 5:00 p.m.',
      avatar: demoMatch?.avatar ?? (role === 'administrador' ? 'admin' : 'sharit'),
      demo: false,
    };
  }

  updateProfile(name: string): Observable<boolean> {
    const current = this.user();
    if (!current) return of(false);
    if (current.demo || this.getToken() === 'demo-token') {
      this.setUser({ ...current, name });
      return of(true);
    }
    return this.http.put(`${environment.apiUrl}/api/users/${current.id}`, { name }).pipe(
      map(() => {
        this.setUser({ ...current, name });
        return true;
      }),
    );
  }

  setPreference<K extends keyof Preferences>(key: K, value: Preferences[K]): void {
    const next = { ...this.preferences(), [key]: value };
    this.preferences.set(next);
    localStorage.setItem(PREF_KEY, JSON.stringify(next));
  }

  greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.user();
    if (!token || !user) return false;
    if (token === 'demo-token') return true;
    try {
      const payload = this.decodeToken(token);
      const exp = Number(payload?.['exp'] ?? 0);
      return exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  isAdmin(): boolean {
    return this.user()?.role === 'administrador';
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  logout(redirect = true): void {
    this.clearSession();
    if (redirect) this.router.navigate(['/login']);
  }

  private setUser(user: SessionUser): void {
    this.user.set(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  private readUser(): SessionUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionUser;
    } catch {
      return null;
    }
  }

  private readPreferences(): Preferences {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    try {
      return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Preferences) };
    } catch {
      return { ...DEFAULT_PREFERENCES };
    }
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.user.set(null);
  }

  private decodeToken(token: string): Record<string, unknown> | null {
    try {
      return JSON.parse(atob(token.split('.')[1] ?? '')) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
