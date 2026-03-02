import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { OrdemServicoEdicaoPageRoutingModule } from './ordem-servico-edicao-routing.module';
import { OrdemServicoEdicaoPage } from './ordem-servico-edicao.page';
import { CalendarPopoverComponentModule } from '../../components/calendar-popover/calendar-popover.module';
import { AutocompleteComponent } from '../../components/autocomplete/autocomplete.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OrdemServicoEdicaoPageRoutingModule,
    CalendarPopoverComponentModule,
    AutocompleteComponent
  ],

  //declarations: [OrdemServicoEdicaoPage]
})
export class OrdemServicoEdicaoPageModule {}
