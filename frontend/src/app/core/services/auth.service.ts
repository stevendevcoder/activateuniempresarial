import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, MeResponse, TokenPayload } from '../api.types';
import { Preferences, SessionUser } from '../models';

const TOKEN_KEY = 'activate_token';
const USER_KEY = 'activate_user';
const PREF_KEY = 'activate_preferences';
const ADMIN_ROLE = 'Administrador';

const DEFAULT_PREFERENCES: Preferences = {
  notifications: true,
  dnd: false,
  reminders: true,
  visualRest: true,
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly api = environment.apiUrl;

  readonly user = signal<SessionUser | null>(this.readUser());
  readonly preferences = signal<Preferences>(this.readPreferences());
  readonly firstName = computed(() => this.user()?.name.split(' ')[0] ?? 'tú');

  constructor() {
    if (!this.isAuthenticated()) {
      this.clearSession();
    }
  }

  login(email: string, password: string): Observable<SessionUser> {
    return this.http
      .post<LoginResponse>(`${this.api}/api/login`, { email: email.trim(), password })
      .pipe(
        tap((res) => localStorage.setItem(TOKEN_KEY, res.token)),
        switchMap(() => this.refreshProfile()),
      );
  }

  /** Recarga los datos del usuario autenticado desde GET /api/me. */
  refreshProfile(): Observable<SessionUser> {
    return this.http.get<MeResponse>(`${this.api}/api/me`).pipe(
      map((me) => this.toSession(me)),
      tap((session) => this.setUser(session)),
    );
  }

  updateProfile(data: { name?: string; password?: string; currentPassword?: string }): Observable<SessionUser> {
    return this.http
      .put<{ message: string }>(`${this.api}/api/me/profile`, data)
      .pipe(switchMap(() => this.refreshProfile()));
  }

  uploadPhoto(file: File): Observable<SessionUser> {
    const body = new FormData();
    body.append('file', file);
    return this.http
      .post<{ photoUrl: string }>(`${this.api}/api/me/profile/photo`, body)
      .pipe(switchMap(() => this.refreshProfile()));
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
    const payload = this.tokenPayload();
    if (!payload || !this.user()) return false;
    return Number(payload.exp ?? 0) * 1000 > Date.now();
  }

  isAdmin(): boolean {
    return this.user()?.role === 'administrador';
  }

  hasPermission(permission: string): boolean {
    const perms = this.user()?.permissions ?? [];
    return perms.includes('*') || perms.includes(permission);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  logout(redirect = true): void {
    this.clearSession();
    if (redirect) this.router.navigate(['/login']);
  }

  private toSession(me: MeResponse): SessionUser {
    const isAdmin = me.role === ADMIN_ROLE;
    return {
      id: me.id,
      name: me.name,
      email: me.email,
      role: isAdmin ? 'administrador' : 'trabajador',
      roleName: me.role ?? (isAdmin ? ADMIN_ROLE : 'Trabajador'),
      area: me.area ?? 'Sin área asignada',
      idArea: me.idArea,
      photo: me.photo,
      permissions: me.permissions ?? [],
    };
  }

  private tokenPayload(): TokenPayload | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const base64 = (token.split('.')[1] ?? '').replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64)) as TokenPayload;
    } catch {
      return null;
    }
  }

  private setUser(user: SessionUser): void {
    this.user.set(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private readUser(): SessionUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      const user = JSON.parse(raw) as SessionUser;
      return Array.isArray(user.permissions) ? user : null;
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
}
