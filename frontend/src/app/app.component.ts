import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DialogComponent } from './shared/dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DialogComponent],
  template: `<router-outlet /><app-dialog />`,
})
export class AppComponent {}
