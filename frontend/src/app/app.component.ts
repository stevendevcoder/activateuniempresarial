import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DialogComponent } from './shared/dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DialogComponent],
  template: `<div class="app-phone"><router-outlet /></div><app-dialog />`,
})
export class AppComponent {}
