import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { Router } from '@angular/router';
import { format, parseISO } from 'date-fns';
import { CalendarPopoverComponent } from '../../components/calendar-popover/calendar-popover.component';
import { AbastecimentoService } from '../../services/abastecimento.service';

@Component({
  selector: 'app-abastecimento-postos',
  templateUrl: './abastecimento-postos.page.html',
  styleUrls: ['./abastecimento-postos.page.scss'],
  standalone: false
})
export class AbastecimentoPostosPage implements OnInit {

  // ===============================
  // 🔹 LISTAS DO AUTOCOMPLETE
  // ===============================

  fornecedoresLista: any[] = [];
  equipamentosLista: any[] = [];

  // ===============================
  // 🔹 IDS SELECIONADOS
  // ===============================

  fornecedorId: string | null = null;
  equipamentoId: string | null = null;

  // ===============================
  // 🔹 OUTROS CAMPOS
  // ===============================

  numeroVoucher = '';

  dataInicial: string | null = null;
  dataFinal: string | null = null;

  constructor(
    private popoverCtrl: PopoverController,
    private router: Router,
    private abastecimentoService: AbastecimentoService
  ) {}

  // ===============================
  // 🔹 INIT
  // ===============================

  ngOnInit() {
    this.carregarListas();
  }

  // ===============================
  // 🔹 CARREGAR LISTAS REAIS (API)
  // ===============================

  carregarListas() {

    // 🔥 FORNECEDORES (mesma API da edição)
    this.abastecimentoService.listarFornecedores().subscribe({
      next: dados => {
        this.fornecedoresLista = dados ?? [];
      },
      error: err => {
        console.error('[FORNECEDORES] Erro ao carregar:', err);
        this.fornecedoresLista = [];
      }
    });

    // 🔥 EQUIPAMENTOS (mesma API da edição)
    this.abastecimentoService.listarEquipamentosMobile().subscribe({
      next: dados => {
        this.equipamentosLista = dados ?? [];
      },
      error: err => {
        console.error('[EQUIPAMENTOS] Erro ao carregar:', err);
        this.equipamentosLista = [];
      }
    });

  }

  // ===============================
  // 🔹 EVENTOS AUTOCOMPLETE
  // ===============================

  onFornecedorSelecionado(item: any) {
    this.fornecedorId = item?.id ?? null;
  }

  onEquipamentoSelecionado(item: any) {
    this.equipamentoId = item?.id ?? null;
  }

  // ===============================
  // 🔹 HEADER
  // ===============================

  onBack() {
    this.router.navigate(['/tabs/abastecimento']);
  }

  // ===============================
  // 🔹 CALENDÁRIO
  // ===============================

  async openCalendar(event: any, fieldName: 'dataInicial' | 'dataFinal') {
    const popover = await this.popoverCtrl.create({
      component: CalendarPopoverComponent,
      event,
      backdropDismiss: true,
      translucent: true,
      cssClass: 'calendar-popover'
    });

    await popover.present();

    const { data } = await popover.onDidDismiss();

    if (data?.date) {
      if (fieldName === 'dataInicial') {
        this.dataInicial = data.date;
      } else {
        this.dataFinal = data.date;
      }
    }
  }

  limparData(campo: 'dataInicial' | 'dataFinal', event: Event) {
    event.stopPropagation();
    this[campo] = null;
  }

  formatDate(isoString: string | null): string {
    if (!isoString) return '';
    try {
      return format(parseISO(isoString), 'dd/MM/yyyy');
    } catch {
      return '';
    }
  }

  // ===============================
  // 🔹 PESQUISAR
  // ===============================

  pesquisar() {
    const filtros = {
      fornecedorId: this.fornecedorId,
      equipamentoId: this.equipamentoId,
      dataInicial: this.dataInicial,
      dataFinal: this.dataFinal,
      numVoucher: this.numeroVoucher,
    };

    this.router.navigate(
      ['/tabs/abastecimento-postos-pesquisa'],
      { queryParams: filtros }
    );
  }

  novo() {
    this.router.navigate(['/tabs/abastecimento-postos-edicao']);
  }
}