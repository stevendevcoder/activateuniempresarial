import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ADMIN_NAV } from '../../layout/admin-shell.component';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-admin-mas',
  imports: [RouterLink, IconComponent],
  templateUrl: './mas.component.html',
})
export class AdminMasComponent {
  readonly items = ADMIN_NAV.filter((item) => !item.mobile);
}