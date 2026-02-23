import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { AbastecimentoProprioPageRoutingModule } from './abastecimento-proprio-routing.module';
import { AbastecimentoProprioPage } from './abastecimento-proprio.page';

import { AutocompleteComponent } from '../../components/autocomplete/autocomplete.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AbastecimentoProprioPageRoutingModule,
    AutocompleteComponent,
  ],
  declarations: [AbastecimentoProprioPage],
})
export class AbastecimentoProprioPageModule {}
