import { Injectable, signal } from '@angular/core';
import { Observable, Subject, map } from 'rxjs';

export interface DialogOptions {
  title: string;
  message: string;
  type?: 'confirm' | 'alert';
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface DialogState {
  options: DialogOptions;
  result: Subject<boolean>;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  readonly state = signal<DialogState | null>(null);

  confirm(options: Omit<DialogOptions, 'type'>): Observable<boolean> {
    return this.open({ ...options, type: 'confirm' });
  }

  alert(options: Omit<DialogOptions, 'type'>): Observable<void> {
    return this.open({ ...options, type: 'alert' }).pipe(map(() => undefined));
  }

  close(value: boolean): void {
    const current = this.state();
    if (!current) return;
    this.state.set(null);
    current.result.next(value);
    current.result.complete();
  }

  private open(options: DialogOptions): Observable<boolean> {
    this.state()?.result.complete();
    const result = new Subject<boolean>();
    this.state.set({ options, result });
    return result.asObservable();
  }
}
