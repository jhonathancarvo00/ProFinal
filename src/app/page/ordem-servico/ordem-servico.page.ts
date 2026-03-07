import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonicModule, PopoverController } from '@ionic/angular';
import { format, parseISO } from 'date-fns';

import { OrdemServicoService } from '../../services/ordem-servico.service';
import { CalendarPopoverComponent } from '../../components/calendar-popover/calendar-popover.component';

@Component({
  selector: 'app-ordem-servico',
  templateUrl: './ordem-servico.page.html',
  styleUrls: ['./ordem-servico.page.scss'],
  standalone: false
})
export class OrdemServicoPage implements OnInit {

  // 🔹 FILTRO
  filtro = {
    numeroOs: '',
    empreendimento: '',
    equipamento: '',
    causaIntervencao: '',
    manutentor: '',
    status: '',
    dataAberturaInicial: '',
    dataAberturaFinal: '',
    dataConclusaoInicial: '',
    dataConclusaoFinal: ''
  };

  resultados: any[] = [];

  // 🔹 LISTAS AUTOCOMPLETE
  equipamentosLista: any[] = [];
  empreendimentosLista: any[] = [];
  causasLista: any[] = [];
  manutentoresLista: any[] = [];

  // 🔹 STATUS
  statusLista = [
    { valor: 1, descricao: 'Aberto' },
    { valor: 2, descricao: 'Em andamento' },
    { valor: 3, descricao: 'Concluído' },
    { valor: 4, descricao: 'Cancelado' }
  ];

  // 🔹 CAMPOS DE DATA (USADO NO HTML)
  camposData: {
    key: 'dataAberturaInicial' |
         'dataAberturaFinal' |
         'dataConclusaoInicial' |
         'dataConclusaoFinal',
    label: string
  }[] = [
    { key: 'dataAberturaInicial',  label: 'Data Abertura Inicial' },
    { key: 'dataAberturaFinal',    label: 'Data Abertura Final' },
    { key: 'dataConclusaoInicial', label: 'Data Conclusão Inicial' },
    { key: 'dataConclusaoFinal',   label: 'Data Conclusão Final' }
  ];

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private popoverCtrl: PopoverController,
    private ordemService: OrdemServicoService
  ) {}

  // 🔹 INIT
  ngOnInit() {
    this.carregarCombos();
    this.restaurarFiltrosDaPesquisa();
  }

  private restaurarFiltrosDaPesquisa() {
    this.route.queryParamMap.subscribe((params) => {
      this.filtro.numeroOs = params.get('numeroOs') ?? '';
      this.filtro.empreendimento = params.get('empreendimento') ?? '';
      this.filtro.equipamento = params.get('equipamento') ?? '';
      this.filtro.causaIntervencao = params.get('causaIntervencao') ?? '';
      this.filtro.manutentor = params.get('manutentor') ?? '';
      this.filtro.status = params.get('status') ?? '';
      this.filtro.dataAberturaInicial = params.get('dataAberturaInicial') ?? '';
      this.filtro.dataAberturaFinal = params.get('dataAberturaFinal') ?? '';
      this.filtro.dataConclusaoInicial = params.get('dataConclusaoInicial') ?? '';
      this.filtro.dataConclusaoFinal = params.get('dataConclusaoFinal') ?? '';

      if (params.get('semResultado') === '1') {
        void this.exibirAlertaSemResultado();

        // Remove a flag para o alerta não reaparecer em refresh/back.
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { semResultado: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    });
  }

  private async exibirAlertaSemResultado() {
    const alert = await this.alertCtrl.create({
      header: 'Atenção!',
      message: 'A pesquisa não retornou resultados. Ajuste os filtros e tente novamente.',
      buttons: ['OK'],
      backdropDismiss: true,
    });

    await alert.present();
  }

  // 🔹 CARREGAR COMBOS
  private carregarCombos() {

    this.ordemService.listarEmpreendimentos().subscribe({
      next: (lista) => {
        this.empreendimentosLista = lista || [];
      },
      error: (err) => {
        console.error('❌ Erro ao carregar Empreendimentos:', err);
        this.empreendimentosLista = [];
      }
    });

    this.ordemService.listarEquipamentos().subscribe({
      next: (lista) => {
        this.equipamentosLista = lista || [];
      },
      error: (err) => {
        console.error('❌ Erro ao carregar Equipamentos:', err);
        this.equipamentosLista = [];
      }
    });

    this.ordemService.listarCausasIntervencao().subscribe({
      next: (lista) => {
        this.causasLista = lista || [];
      },
      error: (err) => {
        console.error('❌ Erro ao carregar Causas Intervenção:', err);
        this.causasLista = [];
      }
    });

    this.ordemService.listarColaboradoresManutentores().subscribe({
      next: (lista) => {
        this.manutentoresLista = (lista || []).map((m: any) => ({
          ...m,
          id: String(
            m.fornId ||
            m.colaboradorId ||
            m.id ||
            m.colaboradorCod ||
            ''
          )
        }));
      },
      error: (err) => {
        console.error('❌ Erro ao carregar Manutentores:', err);
        this.manutentoresLista = [];
      }
    });
  }

  // 🔹 NAVEGAÇÃO
  onBack() {
    this.router.navigate(['/tabs/frotas-home']);
  }

  goNovaOrdem() {
    this.router.navigate(['/tabs/ordem-servico-edicao']);
  }

  // 🔹 AUTOCOMPLETE
  onEquipamentoSelecionado(item: any) {
    this.filtro.equipamento = item?.id || '';
  }

  /*
  onEmpreendimentoSelecionado(item: any) {
    this.filtro.empreendimento =
  item?.id ||
  item?.empreendimentoId ||
  item?.emprdId ||
  item?.codigo ||
  '';
  }
*/

onEmpreendimentoSelecionado(item: any) {
  this.filtro.empreendimento = item?.id || '';
}
  onCausaSelecionada(item: any) {
    this.filtro.causaIntervencao = item?.id || '';
  }

  onManutentorSelecionado(item: any) {
    this.filtro.manutentor = item?.id || '';
  }

  onStatusSelecionado(item: any) {
    this.filtro.status = item?.valor || '';
  }

  // 🔹 CALENDÁRIO
  async openCalendar(
    event: any,
    field: 'dataAberturaInicial' |
           'dataAberturaFinal' |
           'dataConclusaoInicial' |
           'dataConclusaoFinal'
  ) {
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
      this.filtro[field] = data.date;
    }
  }

  // 🔹 LIMPAR DATA (ESSENCIAL PRO “X”)
  clearDate(
    field: 'dataAberturaInicial' |
           'dataAberturaFinal' |
           'dataConclusaoInicial' |
           'dataConclusaoFinal',
    event: Event
  ) {
    event.stopPropagation();
    this.filtro[field] = '';
  }

  // 🔹 FORMATAR DATA
  formatDate(isoString: string): string {
    if (!isoString) return '';
    try {
      return format(parseISO(isoString), 'dd/MM/yyyy');
    } catch {
      return '';
    }
  }

  // 🔹 PESQUISAR
pesquisar() {
  this.router.navigate(['/tabs/ordem-servico-pesquisa'], {
    queryParams: {
      numeroOs: this.filtro.numeroOs,
      empreendimento: this.filtro.empreendimento, // já é GUID
      equipamento: this.filtro.equipamento,
      causaIntervencao: this.filtro.causaIntervencao,
      manutentor: this.filtro.manutentor,
      status: this.filtro.status,
      dataAberturaInicial: this.filtro.dataAberturaInicial,
      dataAberturaFinal: this.filtro.dataAberturaFinal,
      dataConclusaoInicial: this.filtro.dataConclusaoInicial,
      dataConclusaoFinal: this.filtro.dataConclusaoFinal
    }
  });
}
}
