import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
})
export class AutocompleteComponent implements OnChanges {

  @Input() lista: any[] = [];
  @Input() placeholder: string = '';
  @Input() campoDescricao: string = 'descricao';
   @Input() disabled: boolean = false;
   

  /** 🔥 VALOR SELECIONADO (ID) */
  @Input() valorSelecionado: any;

  @Output() selecionado = new EventEmitter<any>();

  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;

  textoBusca = '';
  listaFiltrada: any[] = [];
  aberto = false;

  // =============================
  // 🔄 ATUALIZA QUANDO RECEBE ID
  // =============================
  ngOnChanges(changes: SimpleChanges) {
    if (changes['lista'] || changes['valorSelecionado']) {
      this.sincronizarValorSelecionado();
    }
  }

  private sincronizarValorSelecionado() {
    if (!this.valorSelecionado || !this.lista?.length) {
      this.textoBusca = '';
      return;
    }

    const item = this.lista.find(
      (i: any) =>
        String(i.id ?? i.codigo ?? i.valor) === String(this.valorSelecionado)
    );

    if (item) {
      this.textoBusca = this.getDescricao(item);
    }
  }

  // =============================
  // 🔎 DESCRIÇÃO DO ITEM
  // =============================
  getDescricao(item: any): string {
    return (
      item?.[this.campoDescricao] ||
      item?.descricao ||
      item?.nome ||
      ''
    );
  }

  abrirDropdown() {
    this.aberto = true;
    this.listaFiltrada = [...this.lista];

    setTimeout(() => {
      this.inputRef?.nativeElement.focus();
    });
  }

  filtrar() {
    const termo = (this.textoBusca || '').toLowerCase();
    this.aberto = true;

    if (!termo) {
      this.listaFiltrada = [...this.lista];
      return;
    }

    this.listaFiltrada = this.lista.filter(item =>
      this.getDescricao(item).toLowerCase().includes(termo)
    );
  }

  selecionar(item: any) {
    this.textoBusca = this.getDescricao(item);
    this.aberto = false;
    this.selecionado.emit(item);
  }

  limpar() {
    this.textoBusca = '';
    this.listaFiltrada = [...this.lista];
    this.aberto = false;
    this.selecionado.emit(null);
  }

  isSelecionado(item: any): boolean {
    if (!item) return false;
    // Compara por id, codigo ou valor
    const idItem = String(item.id ?? item.codigo ?? item.valor);
    const idSelecionado = String(this.valorSelecionado);
    return idItem === idSelecionado;
  }

  fecharComDelay() {
    setTimeout(() => {
      this.aberto = false;
    }, 150);
  }
}
