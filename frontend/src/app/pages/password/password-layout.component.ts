import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Marco visual compartido por las pantallas de recuperación de contraseña. */
@Component({
  selector: 'app-password-layout',
  imports: [RouterLink],
  template: `
    <main class="min-h-dvh w-full bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      <div class="absolute -right-24 -top-24 w-96 h-96 rounded-full border border-white/5 pointer-events-none"></div>
      <div class="absolute -left-16 bottom-[-80px] w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>

      <section class="relative w-full max-w-md rounded-3xl bg-white shadow-2xl shadow-black/30 p-7 sm:p-9">
        <a routerLink="/login" class="flex items-center gap-3 mb-8 w-fit">
          <span class="h-11 w-11 rounded-xl bg-white p-1.5 shadow-md ring-1 ring-slate-200 grid place-items-center">
            <img src="https://fabricasoluciones.uniempresarial.edu.co/assets/logo%20ue-Bilhu64G.png" class="w-full h-full object-contain" alt="Uniempresarial" />
          </span>
          <span>
            <span class="block text-lg font-extrabold tracking-wider text-brand-900 uppercase leading-none">
              ACTIVATE<span class="text-rose-500 font-black">.</span>
            </span>
            <span class="block text-[10px] font-semibold tracking-widest text-slate-400 uppercase mt-1">Pausas Saludables</span>
          </span>
        </a>

        <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">{{ title }}</h1>
        <p class="text-sm text-slate-500 mt-2 mb-7 leading-relaxed">{{ subtitle }}</p>

        <ng-content />

        <a routerLink="/login"
          class="mt-7 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-800 hover:text-brand-950 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
          Volver a iniciar sesión
        </a>
      </section>
    </main>
  `,
})
export class PasswordLayoutComponent {
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
}
