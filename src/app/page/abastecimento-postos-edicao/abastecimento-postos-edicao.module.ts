import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AbastecimentoPostosEdicaoPageRoutingModule } from './abastecimento-postos-edicao-routing.module';
import { AbastecimentoPostosEdicaoPage } from './abastecimento-postos-edicao.page';
import { CalendarPopoverComponentModule } from '../../components/calendar-popover/calendar-popover.module';

import { AutocompleteComponent } from '../../components/autocomplete/autocomplete.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AbastecimentoPostosEdicaoPageRoutingModule,
    CalendarPopoverComponentModule,
     AutocompleteComponent 
  ],
  declarations: [AbastecimentoPostosEdicaoPage]
})
export class AbastecimentoPostosEdicaoPageModule {}