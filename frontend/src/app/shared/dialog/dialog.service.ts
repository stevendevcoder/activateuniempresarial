import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type DialogType = 'confirm' | 'alert';

export interface DialogOptions {
  title: string;
  message: string;
  type?: DialogType;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export interface DialogState {
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
    return new Observable((subscriber) => {
      this.open({ ...options, type: 'alert' }).subscribe({ next: () => {
        subscriber.next();
        subscriber.complete();
      }});
    });
  }

  close(value: boolean): void {
    const current = this.state();
    if (!current) return;
    this.state.set(null);
    current.result.next(value);
    current.result.complete();
  }

  private open(options: DialogOptions): Observable<boolean> {
    const result = new Subject<boolean>();
    this.state.set({ options, result });
    return result.asObservable();
  }
}