import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { AbastecimentoProprioEdicaoPageRoutingModule } from './abastecimento-proprio-edicao-routing.module';
import { AbastecimentoProprioEdicaoPage } from './abastecimento-proprio-edicao.page';

import { AutocompleteComponent } from '../../components/autocomplete/autocomplete.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AbastecimentoProprioEdicaoPageRoutingModule,
    AutocompleteComponent
  ],
  declarations: [AbastecimentoProprioEdicaoPage],
})
export class AbastecimentoProprioEdicaoPageModule {}
