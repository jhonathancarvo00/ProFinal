// Tipo genérico para itens de lista (alguns endpoints não garantem id)
type ItemComId = { id?: string } & Record<string, unknown>;
import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AutocompleteComponent } from '../../components/autocomplete/autocomplete.component';

// Definição do tipo FotoCacheItem
type FotoCacheItem = { id?: string; dataUrl: string; createdAt: string };

// Interface mínima para OrdemServicoPayload
interface OrdemServicoPayload {
  numeroOs: string;
  descricao: string;
  equipamento: string;
  empreendimento: string;
  empreendimentoIntervencao: string;
  classificacao: string;
  tipo: string;
  causaIntervencao: string;
  operadorMotorista: string;
  manutentor: string;
  statusCodigo?: string;
  dataAbertura?: string;
  dataConclusao?: string;
  hodometro?: string | number;
  horimetro?: string | number;
  // Adicione outros campos conforme necessário
}
import { Router, ActivatedRoute } from '@angular/router';
import { PopoverController, ToastController } from '@ionic/angular';//ADD ToastController
import { format, parseISO } from 'date-fns';
import { CalendarPopoverComponentModule } from '../../components/calendar-popover/calendar-popover.module';
import { CalendarPopoverComponent } from '../../components/calendar-popover/calendar-popover.component';
import { OrdemServicoService } from '../../services/ordem-servico.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HostListener, ElementRef } from '@angular/core';
// ...existing code...


// ...existing code...
@Component({
  selector: 'app-ordem-servico-edicao',
  templateUrl: './ordem-servico-edicao.page.html',
  styleUrls: ['./ordem-servico-edicao.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CalendarPopoverComponentModule,
    AutocompleteComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class OrdemServicoEdicaoPage implements OnInit {
  // Métodos para template
  // Métodos para template
  onClassificacaoSelecionada(item: { id?: string }) {
    if (!item || !item.id) {
      this.classificacao = '';
      return;
    }
    this.classificacao = item.id;
  }

  onTipoSelecionado(item: { id?: string }) {
    if (!item || !item.id) {
      this.tipo = '';
      return;
    }
    this.tipo = item.id;
  }

  // Campos de texto e seleção
  numeroOS: string = '';
  // Campo de retorno (numRetornoPosto)
  retorno: string = '';
  // Id interno da OS (GUID) usado para update/anexos
  osId: string = '';
  fotos: FotoCacheItem[] = [];
  fotoSelecionadaIndex = 0;
  fotoPreviewDataUrl: string | null = null;
  fotoPreviewSafeHref: SafeUrl | null = null;
  private fotoPreviewBlobUrl: string | null = null;
  fotoModalAberto = false;
  descricao: string = '';
  equipamento: string = '';
  empreendimento: string = '';
  empreendimentoIntervencao: string = '';
  classificacao: string = '';
  tipo: string = '';
  tipoDescricao: string = '';
  causaIntervencao: string = '';
  operadorMotorista: string = '';
  manutentor: string = '';
  statusCodigo: number | null = null;
  dataAbertura: string | null = null;
  dataConclusao: string | null = null;

  //status: string = '';
  //NOVOS CAMPOS
  defeitosConstatados: string = '';
  causasProvaveis: string = '';
  observacoes: string = '';


  hodometro: string = '';
  horimetro: string = '';

// ALTERAÇÃO: controla liberação do botão "Anexar Foto"
  //osConfirmada = false;

  // Listas para combos
  equipamentosLista: ItemComId[] = [];
  empreendimentosLista: ItemComId[] = [];
  classificacoesLista: ItemComId[] = [];
  tiposOsLista: ItemComId[] = [];
  causasIntervencaoLista: ItemComId[] = [];
  motoristasLista: ItemComId[] = [];
  manutentoresLista: ItemComId[] = [];

  // Status fixo (exemplo)
statusLista = [
  { valor: 1, descricao: 'Aberta' },
  { valor: 2, descricao: 'Em andamento' },
  { valor: 3, descricao: 'Finalizada' },
  { valor: 4, descricao: 'Cancelada' },
];
  carregando = false;

  get podeAnexarFoto(): boolean {
    return !!this.osId && this.osId.length === 36;
  }

  private getFotoCacheKeyById(osId: string) {
    return `os:lastFotoDataUrl:id:${osId}`;
  }

  private getFotoIdCacheKeyById(osId: string) {
    return `os:lastFotoId:id:${osId}`;
  }

  private getFotoCacheKeyByCod(osCod: string) {
    return `os:lastFotoDataUrl:cod:${osCod}`;
  }

  private getFotoIdCacheKeyByCod(osCod: string) {
    return `os:lastFotoId:cod:${osCod}`;
  }

  private getFotosCacheKeyById(osId: string) {
    return `os:fotos:id:${osId}`;
  }

  private getFotosCacheKeyByCod(osCod: string) {
    return `os:fotos:cod:${osCod}`;
  }

  // Chaves antigas (compat)
  private getLegacyFotoCacheKey(osId: string) {
    return `os:lastFotoDataUrl:${osId}`;
  }

  private getLegacyFotoIdCacheKey(osId: string) {
    return `os:lastFotoId:${osId}`;
  }

  abrirFotoOverlay(index?: number) {
    if (!this.fotos?.length) return;
    if (typeof index === 'number' && index >= 0 && index < this.fotos.length) {
      this.fotoSelecionadaIndex = index;
    }
    this.fotoPreviewDataUrl = this.fotos[this.fotoSelecionadaIndex]?.dataUrl || null;
    this.atualizarHrefSeguro();
    this.fotoModalAberto = true;
  }

  fecharFotoOverlay() {
    this.fotoModalAberto = false;
  }

  excluirFotoLocal() {
    // Remove apenas do app (cache local). Não remove do servidor.
    if (!this.fotos?.length) {
      this.fecharFotoOverlay();
      return;
    }

    const idx = Math.max(0, Math.min(this.fotoSelecionadaIndex, this.fotos.length - 1));
    this.fotos.splice(idx, 1);

    if (this.fotos.length === 0) {
      this.limparCacheFotos();
      this.fotoSelecionadaIndex = 0;
      this.fotoPreviewDataUrl = null;
      this.fotoPreviewSafeHref = null;
      this.atualizarHrefSeguro();
      this.fecharFotoOverlay();
      return;
    }

    this.fotoSelecionadaIndex = Math.max(0, Math.min(idx, this.fotos.length - 1));
    this.persistirListaFotosNoCache();
    this.fotoPreviewDataUrl = this.fotos[this.fotoSelecionadaIndex]?.dataUrl || null;
    this.atualizarHrefSeguro();
    this.fecharFotoOverlay();
  }

  private limparCacheFotos() {
    try {
      const osCod = this.numeroOS;
      const osId = this.osId;

      if (osId && osId.length === 36) {
        localStorage.removeItem(this.getFotosCacheKeyById(osId));
        localStorage.removeItem(this.getFotoCacheKeyById(osId));
        localStorage.removeItem(this.getFotoIdCacheKeyById(osId));
        localStorage.removeItem(this.getLegacyFotoCacheKey(osId));
        localStorage.removeItem(this.getLegacyFotoIdCacheKey(osId));
      }
      if (osCod) {
        localStorage.removeItem(this.getFotosCacheKeyByCod(osCod));
        localStorage.removeItem(this.getFotoCacheKeyByCod(osCod));
        localStorage.removeItem(this.getFotoIdCacheKeyByCod(osCod));
      }
    } catch {
      // ignore
    }
  }

  private persistirListaFotosNoCache() {
    const osCod = this.numeroOS;
    const osId = this.osId;
    try {
      const payload = JSON.stringify(this.fotos);
      if (osId && osId.length === 36) {
        localStorage.setItem(this.getFotosCacheKeyById(osId), payload);
      }
      if (osCod) {
        localStorage.setItem(this.getFotosCacheKeyByCod(osCod), payload);
      }

      // Mantém também “última foto” para compat
      const last = this.fotos[this.fotos.length - 1];
      if (last?.dataUrl) {
        if (osId && osId.length === 36) {
          localStorage.setItem(this.getFotoCacheKeyById(osId), last.dataUrl);
          localStorage.setItem(this.getLegacyFotoCacheKey(osId), last.dataUrl);
        }
        if (osCod) {
          localStorage.setItem(this.getFotoCacheKeyByCod(osCod), last.dataUrl);
        }
      }
      if (last?.id) {
        if (osId && osId.length === 36) {
          localStorage.setItem(this.getFotoIdCacheKeyById(osId), last.id);
          localStorage.setItem(this.getLegacyFotoIdCacheKey(osId), last.id);
        }
        if (osCod) {
          localStorage.setItem(this.getFotoIdCacheKeyByCod(osCod), last.id);
        }
      }
    } catch {
      // ignore
    }
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private popoverCtrl: PopoverController,
    private ordemService: OrdemServicoService,
    private toastCtrl: ToastController, //  ALTERAÇÃO injeção do ToastController
    private sanitizer: DomSanitizer,
    private elementRef: ElementRef//novo
  ) {}

@HostListener('document:click', ['$event'])
fecharDropdownAoClicarFora(event: Event) {
  const clicouDentro = this.elementRef.nativeElement.contains(event.target);

  if (!clicouDentro) {
    this.modalEquipamentoAberto = false;
  }
}


  ionViewWillEnter() {
    // Ao voltar da tela de anexar foto (navCtrl.back), o ngOnInit não roda de novo.
    // Então recarregamos as fotos do cache aqui para atualizar a grade imediatamente.
    this.atualizarPreviewFoto();
  }

ngOnInit() {

  // =============================
  // 🔹 LIMPAR CAMPOS
  // =============================
  const limparCampos = () => {
    this.numeroOS = '';
    this.osId = '';
    this.descricao = '';
    this.equipamento = '';
    this.empreendimento = '';
    this.empreendimentoIntervencao = '';
    this.classificacao = '';
    this.tipo = '';
    this.causaIntervencao = '';
    this.operadorMotorista = '';
    this.manutentor = '';
    this.statusCodigo = null;
    this.dataAbertura = new Date().toISOString();
    this.dataConclusao = null;
    this.hodometro = '';
    this.horimetro = '';
    this.defeitosConstatados = '';
    this.causasProvaveis = '';
    this.observacoes = '';
  };

  // =============================
  // 🔹 QUERY PARAMS
  // =============================
  this.route.queryParams.subscribe((params) => {

    // 🔹 NOVA OS (sem parâmetro)
    if (!params || !params['os']) {

      this.carregarCombosComCallback(() => {

        limparCampos();
        this.atualizarPreviewFoto();
        this.ativarFiltroEquipamento();

        this.equipamentosFiltrados = [...this.equipamentosLista];
        this.empreendimentosFiltrados = [...this.empreendimentosLista];
        this.classificacoesFiltradas = [...this.classificacoesLista];
        this.tiposFiltrados = [...this.tiposOsLista];
        this.causasFiltradas = [...this.causasIntervencaoLista];
        this.motoristasFiltrados = [...this.motoristasLista];
        this.empreendimentosIntervFiltrados = [...this.empreendimentosLista];
        this.manutentoresFiltrados = [...this.manutentoresLista];
        this.statusFiltrados = [...this.statusLista];

      });

      return;
    }

    // =============================
    // 🔥 MODO EDIÇÃO (SIMPLIFICADO)
    // =============================

    const osIdRecebido = String(params['os'] || '');

    this.carregarCombosComCallback(() => {

      // Guarda GUID
      this.osId = osIdRecebido;

      // Validação básica
      if (!this.osId || this.osId.length !== 36) {
        return;
      }

      // 🔥 AQUI É O QUE REALMENTE IMPORTA
      this.carregarOsCompleta(this.osId);

    });

  });
}


  private atualizarPreviewFoto() {
    // Prioridade: lista por osId, depois por osCod, depois chaves antigas.
    try {
      const osId = this.osId;
      const osCod = this.numeroOS;

      const parseList = (raw: string | null): FotoCacheItem[] | null => {
        if (!raw) return null;
        try {
          const arr = JSON.parse(raw) as Array<Partial<FotoCacheItem>>;
          if (!Array.isArray(arr)) return null;
          return arr
            .filter(x => typeof x?.dataUrl === 'string' && String(x.dataUrl).trim() !== '')
            .map(x => ({
              id: typeof x.id === 'string' ? x.id : undefined,
              dataUrl: String(x.dataUrl),
              createdAt: typeof x.createdAt === 'string' ? x.createdAt : new Date().toISOString(),
            }));
        } catch {
          return null;
        }
      };

      let list: FotoCacheItem[] | null = null;

      if (osId && osId.length === 36) {
        list = parseList(localStorage.getItem(this.getFotosCacheKeyById(osId)));
      }
      if ((!list || list.length === 0) && osCod) {
        list = parseList(localStorage.getItem(this.getFotosCacheKeyByCod(osCod)));
      }

      // Fallback: se não tem lista, tenta “última foto” (novo/legado)
      if (!list || list.length === 0) {
        let cached: string | null = null;
        if (osId && osId.length === 36) {
          cached =
            localStorage.getItem(this.getFotoCacheKeyById(osId)) ||
            localStorage.getItem(this.getLegacyFotoCacheKey(osId));
        }

        if (!cached && osCod) {
          cached = localStorage.getItem(this.getFotoCacheKeyByCod(osCod));
        }

        if (cached) {
          list = [{ dataUrl: cached, createdAt: new Date().toISOString() }];
        }
      }

      this.fotos = list || [];
      if (this.fotoSelecionadaIndex >= this.fotos.length) {
        this.fotoSelecionadaIndex = Math.max(0, this.fotos.length - 1);
      }

      let cached: string | null = this.fotos[this.fotoSelecionadaIndex]?.dataUrl || null;

      // Normaliza: se vier só o base64 puro, monta um dataURL padrão (jpeg)
      if (cached && !cached.startsWith('data:')) {
        const looksLikeBase64 = /^[A-Za-z0-9+/=\r\n]+$/.test(cached);
        if (looksLikeBase64) {
          cached = `data:image/jpeg;base64,${cached}`;
        }
      }

      this.fotoPreviewDataUrl = cached || null;
      this.atualizarHrefSeguro();
    } catch {
      this.fotos = [];
      this.fotoPreviewDataUrl = null;
      this.atualizarHrefSeguro();
    }
  }

  private atualizarHrefSeguro() {
    // Limpa blob anterior para evitar vazamento de memória
    if (this.fotoPreviewBlobUrl) {
      try {
        URL.revokeObjectURL(this.fotoPreviewBlobUrl);
      } catch {
        // ignore
      }
      this.fotoPreviewBlobUrl = null;
    }

    if (!this.fotoPreviewDataUrl) {
      this.fotoPreviewSafeHref = null;
      return;
    }

    // Converte dataURL -> Blob URL (evita 'unsafe:data:' em href)
    try {
      const dataUrl = this.fotoPreviewDataUrl;
      const match = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl);
      if (!match) {
        // fallback: ainda assim tenta abrir como URL normal
        this.fotoPreviewSafeHref = this.sanitizer.bypassSecurityTrustUrl(dataUrl);
        return;
      }

      const mime = match[1] || 'image/jpeg';
      const b64 = match[2] || '';
      const byteString = atob(b64);
      const bytes = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
      const blob = new Blob([bytes], { type: mime });
      this.fotoPreviewBlobUrl = URL.createObjectURL(blob);
      this.fotoPreviewSafeHref = this.sanitizer.bypassSecurityTrustUrl(this.fotoPreviewBlobUrl);
    } catch {
      this.fotoPreviewSafeHref = this.sanitizer.bypassSecurityTrustUrl(this.fotoPreviewDataUrl);
    }
  }

  private migrarCacheFotoSeMudou(oldOsId: string, newOsId: string, osCod: string) {
    if (!oldOsId || oldOsId.length !== 36) return;
    if (!newOsId || newOsId.length !== 36) return;
    if (oldOsId === newOsId) return;

    try {
      const listRaw =
        localStorage.getItem(this.getFotosCacheKeyById(oldOsId)) ||
        (osCod ? localStorage.getItem(this.getFotosCacheKeyByCod(osCod)) : null);
      if (listRaw) {
        localStorage.setItem(this.getFotosCacheKeyById(newOsId), listRaw);
      }

      const dataUrl =
        // Duplicidade removida. Já tratado em outro bloco/método.
        localStorage.getItem(this.getLegacyFotoIdCacheKey(oldOsId)) ||
        (osCod ? localStorage.getItem(this.getFotoIdCacheKeyByCod(osCod)) : null);

      if (dataUrl) {
        localStorage.setItem(this.getFotoCacheKeyById(newOsId), dataUrl);
        localStorage.setItem(this.getLegacyFotoCacheKey(newOsId), dataUrl);
      }
      const fotoId = '';
      if (fotoId) {
        localStorage.setItem(this.getFotoIdCacheKeyById(newOsId), fotoId);
        localStorage.setItem(this.getLegacyFotoIdCacheKey(newOsId), fotoId);
      }
    } catch {
      // ignore
    }
  }

  private atualizarQueryParamOsComNovoId(novoOsId: string) {
    try {
      if (!novoOsId || novoOsId.length !== 36) return;

      const raw = this.route.snapshot?.queryParams?.['os'];
      if (!raw || typeof raw !== 'string') return;

      const trimmed = raw.trim();
      if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return;

      let obj: Record<string, unknown> | null = null;
      try {
        obj = JSON.parse(trimmed) as Record<string, unknown>;
      } catch {
        // tenta aspas simples
        try {
          obj = JSON.parse(trimmed.replace(/'/g, '"')) as Record<string, unknown>;
        } catch {
          obj = null;
        }
      }
      if (!obj) return;

      obj['OsId'] = novoOsId;
      obj['osId'] = novoOsId;
      obj['IdOs'] = novoOsId;
      obj['id'] = novoOsId;

      const updated = JSON.stringify(obj);
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { os: updated },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    } catch {
      // ignore
    }
  }

  // --------- LOOKUPS / COMBOS ---------

  private carregarCombosComCallback(callback: () => void) {
    // Equipamentos
    let carregadas = 0;
    const total = 7;
    const checkDone = () => { carregadas++; if (carregadas === total) callback(); };
    this.ordemService.listarEquipamentos().subscribe({
      next: (lista) => { this.equipamentosLista = lista || []; checkDone(); },
    });
    this.ordemService.listarEmpreendimentos().subscribe({
      next: (lista) => { this.empreendimentosLista = lista || []; checkDone(); },
    });
    this.ordemService.listarClassificacoesServico().subscribe({
      next: (lista) => { this.classificacoesLista = lista || []; checkDone(); },
    });
    this.ordemService.listarTiposOs().subscribe({
      next: (lista) => { this.tiposOsLista = lista || []; checkDone(); },
    });

    this.ordemService.listarCausasIntervencao().subscribe({
      next: (lista) => { this.causasIntervencaoLista = lista || []; checkDone(); },
    });


this.ordemService.listarColaboradoresMotoristas().subscribe({
  next: (lista) => {

    this.motoristasLista = (lista || []).map((m: ItemComId) => ({
      ...m,
      id: String(
        m.fornId ||
        m.colaboradorId ||
        m.id ||
        m.colaboradorCod ||
        ''
      ),
      colaboradorNome:
        m.colaboradorNome ||
        m.nome ||
        m.descricao ||
        m.razaoSocial ||
        ''
    }));

    // 🔥 ESSA LINHA FALTAVA
    this.motoristasFiltrados = [...this.motoristasLista];

    checkDone();
  },
});


    this.ordemService.listarColaboradoresManutentores().subscribe({
      next: (lista) => {
        this.manutentoresLista = (lista || []).map(m => ({
          ...m,
          id: String(m.fornId || m.colaboradorId || m.id || m.colaboradorCod || ''),
        }));
        checkDone();
      },
    });
  }
      //---------------------------------------------------------------------//
      // ADD ALTERAÇÃO: Toast de sucesso com fechamento automático */
      //--------------------------------------------------------------------//
  private async mostrarToastSucesso() {
    const toast = await this.toastCtrl.create({
      message: 'OS criada e confirmada com sucesso',
      duration: 2500,
      position: 'top',
      color: 'success',
      icon: 'checkmark-circle-outline',
    });

    await toast.present();
  }

  private async mostrarToastAviso(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2800,
      position: 'top',
      color: 'warning',
    });
    await toast.present();
  }

  // --------- NAVEGAÇÃO / CALENDÁRIO ---------

  onBack() {
    this.router.navigate(['/tabs/ordem-servico']);
  }

  async openCalendar(event: Event, fieldName: 'dataAbertura' | 'dataConclusao') {
    const popover = await this.popoverCtrl.create({
      component: CalendarPopoverComponent,
      event,
      backdropDismiss: true,
      translucent: true,
      cssClass: 'calendar-popover',
    });

    await popover.present();
    const { data } = await popover.onDidDismiss();

    if (data?.cleared) {
      if (fieldName === 'dataAbertura') {
        this.dataAbertura = null;
      } else {
        this.dataConclusao = null;
      }
      return;
    }

    if (data && data.date) {
      let dateStr: string;
      // Se vier como objeto Date, converte para ISO
      if (data.date instanceof Date) {
        dateStr = data.date.toISOString();
      } else if (typeof data.date === 'string') {
        // Se vier como string dd/MM/yyyy, converte para ISO
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(data.date)) {
          const [dia, mes, ano] = data.date.split('/');
          const d = new Date(Number(ano), Number(mes) - 1, Number(dia));
          dateStr = d.toISOString();
        } else {
          dateStr = data.date;
        }
      } else {
        dateStr = String(data.date);
      }
      if (fieldName === 'dataAbertura') {
        this.dataAbertura = dateStr;
      } else {
        this.dataConclusao = dateStr;
      }
    }
  }

  formatDate(isoOrDate: string | null): string {
    // Removido log de debug
    if (!isoOrDate) return '';
    // Se já estiver no formato dd/MM/yyyy, só devolve
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(isoOrDate)) {
      return isoOrDate;
    }
    // Se vier no formato yyyy-MM-dd, converte para dd/MM/yyyy
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDate)) {
      const [ano, mes, dia] = isoOrDate.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    // Se vier no formato yyyy-MM-ddTHH:mm:ss (com ou sem milissegundos, sem Z), adiciona Z para parseISO
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(isoOrDate)) {
      try {
        return format(parseISO(isoOrDate + 'Z'), 'dd/MM/yyyy');
      } catch {
        return isoOrDate;
      }
    }
    // Se vier no formato ISO completo, tenta converter
    try {
      return format(parseISO(isoOrDate), 'dd/MM/yyyy');
    } catch {
      return isoOrDate;
    }
  }

  /** Converte a data interna para um formato ISO (ou null) */
  private toApiDate(dateStr: string | null): string | null {
    if (!dateStr) return null;

    // dd/MM/yyyy -> ISO
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [dia, mes, ano] = dateStr.split('/');
      const d = new Date(Number(ano), Number(mes) - 1, Number(dia));
      return d.toISOString();
    }

    // já ISO
    try {
      const d = parseISO(dateStr);
      return d.toISOString();
    } catch {
      return dateStr;
    }
  }
/////////////////////////////////////////////////////////////////////////////
  /* ================================
   DROPDOWN EQUIPAMENTO
================================ */
onEquipamentoSelecionado(item: ItemComId | Event) {
  if (!item) {
    this.equipamento = '';
    return;
  }
  // Se for Event, ignora
  if ((item as Event).type) return;
  this.equipamento = (item as ItemComId).id;
}
  /* ==========================
   DROPDOWN EMPREENDIMENTO
================================ */
onEmpreendimentoSelecionado(item: ItemComId | Event) {
  if (!item) {
    this.empreendimento = '';
    return;
  }
  if ((item as Event).type) return;
  this.empreendimento = (item as ItemComId).id;
}
  /* ======================
   DROPDOWN CLASSIFICAÇÃO
      // ===============================
      // 🔎 OPERADOR / MOTORISTA (CORREÇÃO DEFINITIVA)
      // ===============================
      // Já tratado acima, remover duplicidade
}
  /* =============================
   DROPDOWN CAUSA DA INTERVENÇÃO
================================== */
onCausaSelecionada(item: ItemComId | Event) {
  if (!item) {
    this.causaIntervencao = '';
    return;
  }
  if ((item as Event).type) return;
  this.causaIntervencao = (item as ItemComId).id;
}

  /* ===========================
   DROPDOWN OPERADOR/MOTORISTA
================================ */
onMotoristaSelecionado(item: ItemComId | Event) {
  if (!item) {
    this.operadorMotorista = '';
    return;
  }
  if ((item as Event).type) return;
  this.operadorMotorista = (item as ItemComId).id;
}

  /* =====================================
   DROPDOWN EMPREENDIMENTO DA INTERVENÇÃO
========================================== */
onEmpreendimentoIntervSelecionado(item: ItemComId | Event) {
  if (!item) {
    this.empreendimentoIntervencao = '';
    return;
  }
  if ((item as Event).type) return;
  this.empreendimentoIntervencao = (item as ItemComId).id;
}

  /* =====================================
   DROPDOWN STATUS
========================================== */

onStatusSelecionado(item: { valor: number } | Event) {
  if (!item) {
    this.statusCodigo = null;
    return;
  }
  if ((item as Event).type) return;
  this.statusCodigo = (item as { valor: number }).valor;
}

  /* =====================================
   DROPDOWN MANUTENTOR
========================================== */

onManutentorSelecionado(item: ItemComId | Event) {
  if (!item) {
    this.manutentor = '';
    return;
  }
  if ((item as Event).type) return;
  this.manutentor = (item as ItemComId).id;
}
////////////////////////////////////////////////////////////////////////////////

abrirDropdownEquipamento() {
  this.modalEquipamentoAberto = this.equipamentosFiltrados.length > 0;
}

limparEquipamento() {
  this.textoBuscaEquipamento = '';
  this.equipamento = '';
  this.modalEquipamentoAberto = false;
  this.equipamentosFiltrados = [];
}

// =============================
// 🔢 SOMENTE NÚMEROS (CORRIGIDO)
// =============================
somenteNumero(event: Event, campo: 'hodometro' | 'horimetro') {
  const input = event.target as HTMLInputElement;
  const valor = (input?.value || '').toString().replace(/\D/g, '');
  input.value = valor;

  // 🔥 AQUI ESTAVA O ERRO — agora atualiza a variável correta
  this[campo] = valor;
}
  // --------- PAYLOAD PARA A API ---------

  /** Monta o payload completo da OS com base nos campos da tela */
  private montarPayloadOS(): OrdemServicoPayload {
    // Garante que os campos são sempre o id/UUID do item selecionado
    const payload: OrdemServicoPayload = {
      numeroOs: this.numeroOS,
      descricao: this.descricao,
      equipamento: this.equipamento,
      empreendimento: this.empreendimento,
      empreendimentoIntervencao: this.empreendimentoIntervencao,
      classificacao: this.classificacao,
      tipo: this.tipo,
      causaIntervencao: this.causaIntervencao,
      operadorMotorista: this.operadorMotorista,
      manutentor: this.manutentor,
      statusCodigo: String(this.statusCodigo),
      dataAbertura: this.toApiDate(this.dataAbertura),
      dataConclusao: this.toApiDate(this.dataConclusao),
      hodometro: this.hodometro,
      horimetro: this.horimetro,


    };
    return payload;
  }
  /*  NOVO — prepara atualização visual do equipamento */
private ativarFiltroEquipamento() {
  if (!this.equipamentosLista || !this.equipamentosLista.length) return;

  /* inicializa lista visível */
  this.equipamentosFiltrados = [...this.equipamentosLista];
}
// =============================
// 🔎 BUSCA DE EQUIPAMENTO
// =============================
modalEquipamentoAberto = false;
textoBuscaEquipamento = '';
equipamentosFiltrados: ItemComId[] = [];

get nomeEquipamentoSelecionado(): string {
  const eq = this.equipamentosLista.find(
    e => String(e.id) === String(this.equipamento)
  );
  return (eq?.descricao || eq?.nome || eq?.equipamento || '') as string;
}

abrirBuscaEquipamento() {
  this.modalEquipamentoAberto = true;
  this.textoBuscaEquipamento = '';
  this.equipamentosFiltrados = [...this.equipamentosLista];
}

fecharBuscaEquipamento() {
  this.modalEquipamentoAberto = false;
}

filtrarEquipamentos() {
  const termo = (this.textoBuscaEquipamento || '').toLowerCase();

  this.equipamentosFiltrados = this.equipamentosLista.filter((eq: ItemComId) =>
    String(eq.descricao || eq.nome || eq.equipamento || '')
      .toLowerCase()
      .includes(termo)
  );
}

  selecionarEquipamento(eq: ItemComId) {
  this.equipamento = eq.id;
  this.textoBuscaEquipamento = String(eq.descricao || eq.nome || eq.equipamento || '');
  this.modalEquipamentoAberto = false;
}


/** 🔥 FAZ O FILTRO AUTOMÁTICO AO DIGITAR */
onDigitarEquipamento() {
  const texto = (this.textoBuscaEquipamento || '').toLowerCase().trim();

  // Se não tem texto → fecha dropdown
  if (!texto) {
    this.modalEquipamentoAberto = false;
    this.equipamentosFiltrados = [];
    return;
  }

this.equipamentosFiltrados = this.equipamentosLista.filter(eq =>
  String(eq.descricao || eq.nome || eq.equipamento || '')
    .toLowerCase()
    .includes(texto)
);

  // Só abre se tiver resultado
  this.modalEquipamentoAberto = this.equipamentosFiltrados.length > 0;
}


// =============================
// 🔎 BUSCA DE EMPREENDIMENTO
// =============================

modalEmpreendimentoAberto = false;
textoBuscaEmpreendimento = '';
empreendimentosFiltrados: ItemComId[] = [];

/** 🔥 FAZ O FILTRO AUTOMÁTICO AO DIGITAR */
onDigitarEmpreendimento() {

  const termo = (this.textoBuscaEmpreendimento || '').toLowerCase();

  this.modalEmpreendimentoAberto = true;

  if (!termo) {
    this.empreendimentosFiltrados = [...this.empreendimentosLista];
    return;
  }

  this.empreendimentosFiltrados = this.empreendimentosLista.filter((emp: ItemComId) =>
    String(emp.descricao || emp.nome || emp.empreendimento || '')
      .toLowerCase()
      .includes(termo)
  );
}

  selecionarEmpreendimento(emp: ItemComId) {
  this.empreendimento = String(
    emp.id || emp.EmpreendimentoId || emp.empreendimentoId
  );

  this.textoBuscaEmpreendimento =
    String(emp.descricao || emp.nome || emp.empreendimento || '');

  this.modalEmpreendimentoAberto = false;
}

// =============================
// 🔎 BUSCA DE CLASSIFICAÇÃO
// =============================

modalClassificacaoAberto = false;
textoBuscaClassificacao = '';
classificacoesFiltradas: ItemComId[] = [];

/** 🔥 FILTRO AO DIGITAR */
onDigitarClassificacao() {

  const termo = (this.textoBuscaClassificacao || '').toLowerCase();

  this.modalClassificacaoAberto = true;

  if (!termo) {
    this.classificacoesFiltradas = [...this.classificacoesLista];
    return;
  }

  this.classificacoesFiltradas = this.classificacoesLista.filter((c: ItemComId) =>
    String(c.descricao || c.nome || '')
      .toLowerCase()
      .includes(termo)
  );
}

  selecionarClassificacao(c: ItemComId) {
  this.classificacao = String(
    c.id || c.Classificacao || c.classificacaoId
  );

  this.textoBuscaClassificacao =
    String(c.descricao || c.nome || '');

  this.modalClassificacaoAberto = false;
}
// =============================
// 🔎 BUSCA DE TIPO
// =============================

modalTipoAberto = false;
textoBuscaTipo = '';
tiposFiltrados: ItemComId[] = [];

/** 🔥 FILTRO AO DIGITAR */
onDigitarTipo() {

  const termo = (this.textoBuscaTipo || '').toLowerCase();

  this.modalTipoAberto = true;

  if (!termo) {
    this.tiposFiltrados = [...this.tiposOsLista];
    return;
  }

  this.tiposFiltrados = this.tiposOsLista.filter((t: ItemComId) =>
    String(t.descricao || t.nome || '')
      .toLowerCase()
      .includes(termo)
  );
}

  selecionarTipo(t: ItemComId) {
  // Sempre armazena o GUID (id) do tipo selecionado
  if (t && t.id) {
    this.tipo = String(t.id);
  } else {
    this.tipo = '';
  }
  this.textoBuscaTipo = String(t.descricao || t.nome || '');
  this.modalTipoAberto = false;
}
// =============================
// 🔎 BUSCA DE CAUSA DA INTERVENÇÃO
// =============================

modalCausaAberto = false;
textoBuscaCausa = '';
causasFiltradas: ItemComId[] = [];

/** 🔥 FILTRO AO DIGITAR */
onDigitarCausa() {

  const termo = (this.textoBuscaCausa || '').toLowerCase();

  this.modalCausaAberto = true;

  if (!termo) {
    this.causasFiltradas = [...this.causasIntervencaoLista];
    return;
  }

  this.causasFiltradas = this.causasIntervencaoLista.filter((c: ItemComId) =>
    String(c.descricao || c.nome || '')
      .toLowerCase()
      .includes(termo)
  );
}

  selecionarCausa(c: ItemComId) {
  this.causaIntervencao = String(
    c.id || c.CausaIntervencao || c.causaIntervencaoId
  );

  this.textoBuscaCausa =
    String(c.descricao || c.nome || '');

  this.modalCausaAberto = false;
}
// =============================
// 🔎 BUSCA DE OPERADOR / MOTORISTA
// =============================

modalMotoristaAberto = false;
textoBuscaMotorista = '';
motoristasFiltrados: ItemComId[] = [];

/** 🔥 FILTRO AO DIGITAR */
onDigitarMotorista() {

  const termo = (this.textoBuscaMotorista || '').toLowerCase().trim();

  if (!termo) {
    this.motoristasFiltrados = [...this.motoristasLista];
    this.modalMotoristaAberto = this.motoristasFiltrados.length > 0;
    return;
  }

  this.motoristasFiltrados = this.motoristasLista.filter((m: ItemComId) =>
    String(m.colaboradorNome || '')
      .toLowerCase()
      .includes(termo)
  );

  this.modalMotoristaAberto = this.motoristasFiltrados.length > 0;
}


  selecionarMotorista(m: ItemComId) {
  // mantém exatamente a mesma lógica de GUID que você já usa
  this.operadorMotorista = String(m.id);

  this.textoBuscaMotorista =
    String(m.colaboradorNome || '');

  this.modalMotoristaAberto = false;
}

// =============================
// 🔎 BUSCA DE EMPREENDIMENTO DA INTERVENÇÃO
// =============================

modalEmpreendimentoIntervAberto = false;
textoBuscaEmpreendimentoInterv = '';
empreendimentosIntervFiltrados: ItemComId[] = [];

/** 🔥 FILTRO AO DIGITAR */
onDigitarEmpreendimentoInterv() {

  const termo = (this.textoBuscaEmpreendimentoInterv || '').toLowerCase();

  this.modalEmpreendimentoIntervAberto = true;

  if (!termo) {
    this.empreendimentosIntervFiltrados = [...this.empreendimentosLista];
    return;
  }

  this.empreendimentosIntervFiltrados = this.empreendimentosLista.filter((emp: ItemComId) =>
    String(emp.descricao || emp.nome || emp.empreendimento || '')
      .toLowerCase()
      .includes(termo)
  );
}

  selecionarEmpreendimentoInterv(emp: ItemComId) {
  this.empreendimentoIntervencao = String(
    emp.id || emp.EmpreendimentoId || emp.empreendimentoId
  );

  this.textoBuscaEmpreendimentoInterv =
    String(emp.descricao || emp.nome || emp.empreendimento || '');

  this.modalEmpreendimentoIntervAberto = false;
}
// =============================
// 🔎 BUSCA DE MANUTENTOR
// =============================

modalManutentorAberto = false;
textoBuscaManutentor = '';
manutentoresFiltrados: ItemComId[] = [];

/** 🔥 FILTRO AO DIGITAR */
onDigitarManutentor() {

  const termo = (this.textoBuscaManutentor || '').toLowerCase();

  this.modalManutentorAberto = true;

  if (!termo) {
    this.manutentoresFiltrados = [...this.manutentoresLista];
    return;
  }

  this.manutentoresFiltrados = this.manutentoresLista.filter((m: ItemComId) =>
    String(m.colaboradorNome || '')
      .toLowerCase()
      .includes(termo)
  );
}

  selecionarManutentor(m: ItemComId) {
  this.manutentor = String(m.id);

  this.textoBuscaManutentor =
    String(m.colaboradorNome || '');

  this.modalManutentorAberto = false;
}
// =============================
// 🔠 DESCRIÇÃO EM UPPERCASE
// =============================
onDescricaoInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const valor = input?.value || '';
  this.descricao = valor.toUpperCase();
}
// =============================
// 🔎 BUSCA DE STATUS
// =============================

modalStatusAberto = false;
textoBuscaStatus = '';
statusFiltrados: { valor: number; descricao: string }[] = [];

abrirBuscaStatus() {
  this.modalStatusAberto = true;

  if (!this.textoBuscaStatus) {
    this.statusFiltrados = [...this.statusLista];
  }
}

selecionarStatus(st: { valor: number; descricao: string }) {
  this.statusCodigo = st.valor;
  this.textoBuscaStatus = st.descricao;
  this.modalStatusAberto = false;
}

onDigitarStatus() {
  const termo = (this.textoBuscaStatus || '').toLowerCase().trim();

  // abre dropdown SOMENTE quando tem algo digitado
  this.modalStatusAberto = termo.length > 0;

  this.statusFiltrados = this.statusLista.filter(st =>
    st.descricao.toLowerCase().includes(termo)
  );
}

private carregarOsCompleta(osId: string) {
  if (!osId || osId.length !== 36) return;



  this.ordemService.buscarOSPorId(osId).subscribe({
  next: (res: ItemComId | ItemComId[] | null) => {

  const osApi = Array.isArray(res) ? res[0] : res;

  if (!osApi) {
    return;
  }

  // ===============================
  // 🔹 NÚMERO OS (do osCod da API)
  // ===============================
  this.numeroOS = String(osApi.numeroOs ?? osApi.NumeroOs ?? osApi.osCod ?? '');

      // ===============================
      // 🔹 CAMPOS SIMPLES
      // ===============================
      this.descricao = String(osApi.osDescricao ?? osApi.Descricao ?? '');

      this.defeitosConstatados = String(osApi.obsDef ?? osApi.DefeitosConstatados ?? '');

      this.causasProvaveis = String(osApi.obsCausas ?? osApi.CausasProvaveis ?? '');

      this.observacoes = String(osApi.observacao ?? osApi.Observacao ?? '');

      // Datas
      this.dataAbertura = String(
        osApi.dataAbertura ??
        osApi.osDataAbertura ??
        osApi.dataIniParaliz ??
        osApi.osDataInicio ??
        osApi.osDataAbertura ??
        ''
      );
      this.dataConclusao = String(
        osApi.dataConclusao ??
        osApi.osDataConclusao ??
        osApi.dataFimParaliz ??
        osApi.osDataFim ??
        osApi.osDataConclusao ??
        ''
      );

      // Hodômetro e Horímetro
      this.hodometro = String(osApi.hodometro ?? osApi.Hodometro ?? osApi.odometro ?? osApi.osHodometro ?? '');
      this.horimetro = String(osApi.horimetro ?? osApi.Horimetro ?? osApi.osHorimetro ?? '');

      // Tipo
      const tipoCodigo = osApi.TipoServicoId ?? osApi.tipoServicoId ?? osApi.tpServCod ?? osApi.tpServcod ?? osApi.tipo ?? null;
      let tipoEncontrado = null;
      if (this.tiposOsLista?.length) {
        // Tenta encontrar pelo GUID
        tipoEncontrado = this.tiposOsLista.find(t => String(t.id) === String(tipoCodigo));
        // Se não encontrar pelo GUID, tenta pelo código
        if (!tipoEncontrado && (osApi.tpServcod || osApi.tpServCod)) {
          const cod = osApi.tpServcod ?? osApi.tpServCod;
          tipoEncontrado = this.tiposOsLista.find(t => String(t.codigo) === String(cod));
        }
        // Se não encontrar pelo código, tenta pela descrição (comparando o final da string)
        if (!tipoEncontrado && osApi.tpServDescricao) {
          tipoEncontrado = this.tiposOsLista.find(t =>
            String(t.descricao).toUpperCase().trim().endsWith(String(osApi.tpServDescricao).toUpperCase().trim())
          );
        }
      }
      if (tipoEncontrado) {
        // Sempre seleciona o GUID do tipo encontrado
        this.tipo = String(tipoEncontrado.id);
      } else if (this.tiposOsLista?.length && (osApi.tpServcod || osApi.tpServCod)) {
        // Se não encontrou, tenta buscar pelo código e selecionar o GUID
        const cod = osApi.tpServcod ?? osApi.tpServCod;
        const tipoPorCodigo = this.tiposOsLista.find(t => String(t.codigo) === String(cod));
        this.tipo = tipoPorCodigo ? String(tipoPorCodigo.id) : '';
      } else if (this.tiposOsLista?.length && osApi.tpServDescricao) {
        // Se não encontrou, tenta buscar pela descrição e selecionar o GUID
        const tipoPorDescricao = this.tiposOsLista.find(t => String(t.descricao).toUpperCase().trim() === String(osApi.tpServDescricao).toUpperCase().trim());
        this.tipo = tipoPorDescricao ? String(tipoPorDescricao.id) : '';
      } else {
        this.tipo = '';
      }

      // Status
      const statusCodigoApi = osApi.statusCodigo ?? osApi.statusCod ?? osApi.Status ?? osApi.status ?? osApi.statusDescricao ?? null;
      let statusEncontrado = null;
      if (statusCodigoApi && this.statusLista?.length) {
        statusEncontrado = this.statusLista.find((s: ItemComId) => String(s.valor) === String(statusCodigoApi));
      }
      if (statusEncontrado) {
        this.statusCodigo = statusEncontrado.valor;
      } else {
        this.statusCodigo = statusCodigoApi ? Number(statusCodigoApi) : null;
      }

      // Operador/Motorista
      const motoristaId =
        osApi.MotoristaOperadorId ??
        osApi.colaboradorId ??
        osApi.colaboradorCod ??
        osApi.colaColaboradorId ??
        osApi.colaborador ??
        null;
      let motoristaEncontrado = null;
      if (this.motoristasLista?.length) {
        // Tenta encontrar pelo GUID
        motoristaEncontrado = this.motoristasLista.find(m => String(m.id) === String(motoristaId));
        // Se não encontrar pelo código
        if (!motoristaEncontrado && osApi.colaboradorCod) {
          motoristaEncontrado = this.motoristasLista.find(m => String(m.codigo) === String(osApi.colaboradorCod));
        }
        // Se não encontrar pelo GUID/código, tenta pelo nome
        if (!motoristaEncontrado && osApi.colaboradorNome) {
          motoristaEncontrado = this.motoristasLista.find(m => String(m.descricao).toUpperCase().trim() === String(osApi.colaboradorNome).toUpperCase().trim());
        }
        // Se não encontrar pelo GUID/código/nome, tenta pelo colaColaboradorId
        if (!motoristaEncontrado && osApi.colaColaboradorId) {
          motoristaEncontrado = this.motoristasLista.find(m => String(m.id) === String(osApi.colaColaboradorId));
        }
      }
      if (motoristaEncontrado) {
        this.operadorMotorista = String(motoristaEncontrado.id);
      } else if (motoristaId) {
        this.operadorMotorista = String(motoristaId);
      } else {
        this.operadorMotorista = '';
      }
      // Bloco duplicado removido: tipoCodigo já tratado acima
      const equipId = String(osApi.equipId ?? osApi.EquipamentoId ?? '');
      let equipamento = null;
      if (equipId && equipId !== '00000000-0000-0000-0000-000000000000') {
        equipamento = this.equipamentosLista.find((e: ItemComId) => String(e.id) === equipId);
      }
      this.equipamento = equipamento?.id || '';


      // Bloco duplicado removido: motoristaId já tratado acima
      // Corrigir statusCodigo e statusEncontrado
      // Métodos para template removidos do escopo errado
      // Bloco duplicado removido: statusCodigoApi já tratado acima
      if (statusEncontrado) {
        this.statusCodigo = statusEncontrado.valor;
      } else {
        this.statusCodigo = statusCodigoApi ? Number(statusCodigoApi) : null;
      }
      // ===============================
      // 🔎 EMPREENDIMENTO
      // ===============================
      const empId = String(osApi.emprdId ?? osApi.emprdintervencaoId ?? '');
      this.empreendimento = (empId && empId !== '00000000-0000-0000-0000-000000000000') ? empId : '';

      // ===============================
      // 🔎 CLASSIFICAÇÃO
      // ==============================

      const classifId = osApi.ClassificacaoId ?? osApi.classifCod ?? osApi.classifId ?? null;
      if (classifId && this.classificacoesLista?.length) {
        const classificacaoEncontrada = this.classificacoesLista.find((c: ItemComId) =>
          String(c.id) === String(classifId) ||
          String(c.ClassificacaoId) === String(classifId) ||
          String(c.codigo) === String(classifId)
        );
        this.classificacao = classificacaoEncontrada ? String(classificacaoEncontrada.id) : String(classifId);
      } else {
        this.classificacao = '';
      }

      // ===============================
// 🔎 TIPO
// ===============================


      // Já tratado acima
// ===============================
// 🔎 CAUSA INTERVENÇÃO
// ===============================

      let causa = null;
      const causaId = String(osApi.causasId ?? osApi.CausasId ?? '');
      if (causaId && causaId !== '00000000-0000-0000-0000-000000000000') {
        causa = this.causasIntervencaoLista.find((c: ItemComId) => String(c.id ?? c.codigo ?? c.CausaIntervencao) === causaId);
      }
      this.causaIntervencao = causa?.id || '';

// ===============================
// 🔎 OPERADOR / MOTORISTA (CORREÇÃO DEFINITIVA)
// ===============================

      // Bloco duplicado removido. Já tratado acima.

      // ===============================
      // 🔎 MANUTENTOR
      // ===============================
      let manutentor = null;
      const manutentorId = String(osApi.manutentorId ?? osApi.ManutentorResponsavelId ?? '');
      if (manutentorId && manutentorId !== '00000000-0000-0000-0000-000000000000') {
        manutentor = this.manutentoresLista.find((m: ItemComId) => String(m.id ?? m.manutentorId ?? m.colaboradorCod) === manutentorId);
      }
      this.manutentor = manutentor?.id || '';

      // ===============================
      // 🔎 EMPREENDIMENTO INTERVENÇÃO
      // ===============================
      let empInterv = null;
      const empIntervId = String(osApi.emprdintervencaoId ?? osApi.emprdintervencaoCod ?? '');
      if (empIntervId && empIntervId !== '00000000-0000-0000-0000-000000000000') {
        empInterv = this.empreendimentosLista.find((e: ItemComId) => String(e.id ?? e.codigo ?? e.EmpreendimentoId) === empIntervId);
      }
      this.empreendimentoIntervencao = empInterv?.id || '';
    },
  });
}
private setarTipoPorCodigo(codigo: number) {

  const tipoEncontrado = this.tiposOsLista.find((t: ItemComId) => {
    const descricao = String(t.descricao || '');
    return descricao.startsWith(String(codigo) + ' ');
  });

  this.tipo = tipoEncontrado ? String(tipoEncontrado.id) : '';
}


  /** Clicou na setinha – monta o JSON igual ao do sistema antigo e chama a API */
  salvarOS() {
    const oldOsId = this.osId;
    const osCod = this.numeroOS;

      const isNovaOS = !oldOsId;



    // Log do valor atual do campo descricao
    // Monta o objeto principal usando o método centralizador do serviço
    // Só envia IdOs se for um GUID válido (evita duplicidade/criação indevida)
    const idOsValido = (this.osId && this.osId.length === 36) ? this.osId : undefined;
    const params = this.ordemService.montarPayloadOrdemServico({
      ...(idOsValido ? { IdOs: idOsValido } : {}),
      NumeroOs: this.numeroOS,
      Descricao: (this.descricao || '').toString().trim().toUpperCase(),
      EquipamentoId: this.equipamento,
      EmpreendimentoId: this.empreendimento,
      EmpreendimentoIntervencao: this.empreendimentoIntervencao,
      Classificacao: this.classificacao,
      // Sempre envia o GUID do tipo selecionado
      TipoServicoId: (() => {
        if (this.tiposOsLista?.length) {
          // Se o valor atual for um código ou descrição, converte para GUID
          let tipoEncontrado = this.tiposOsLista.find(t => String(t.id) === String(this.tipo));
          if (!tipoEncontrado) {
            tipoEncontrado = this.tiposOsLista.find(t => String(t.codigo) === String(this.tipo));
          }
          if (!tipoEncontrado) {
            tipoEncontrado = this.tiposOsLista.find(t => String(t.descricao).toUpperCase().trim() === String(this.tipo).toUpperCase().trim());
          }
          return tipoEncontrado ? String(tipoEncontrado.id) : String(this.tipo);
        }
        return String(this.tipo);
      })(),
      CausaIntervencao: this.causaIntervencao,
      ColaboradorId: this.operadorMotorista,
      ManutentorResponsavelId: this.manutentor,
      //Status: (this.statusCodigo !== null && this.statusCodigo !== undefined) ? this.statusCodigo : 1,
      Status: this.statusCodigo,
      DataAbertura: this.dataAbertura,
      DataFechamento: this.dataConclusao,

      Odometro: this.hodometro,
Horimetro: this.horimetro,

      // Novos campos:
      DefeitosConstatados: (this.defeitosConstatados || '').toString().trim(),
      CausasProvaveis: (this.causasProvaveis || '').toString().trim(),
      Observacao: (this.observacoes || '').toString().trim(),

    });


   // Validação dos campos obrigatórios (apenas o que o usuário precisa preencher)
const obrigatorios = ['Descricao', 'EquipamentoId'];

// Nome amigável dos campos
const nomesCampos: Record<string, string> = {
  Descricao: 'Descrição',
  EquipamentoId: 'Equipamento'
};

// Verifica quais estão faltando
const faltando = obrigatorios.filter((key) => !params[key]);

if (faltando.length > 0) {
  const msg =
    'Preencha os campos obrigatórios:\n' +
    faltando.map(f => nomesCampos[f]).join('\n');

  alert(msg);
  return;
}

    this.ordemService.gravarOrdem(params).subscribe({
      next: (res: ItemComId | string) => {
        // LOG: resposta do backend ao gravar OS
        // Se o backend retornar o OsId (GUID) no insert, guarda para anexos/edição
        const returnedId = typeof res === 'string'
          ? res
          : String((res as ItemComId)?.OsId ?? (res as ItemComId)?.osId ?? (res as ItemComId)?.id ?? '');
        if (returnedId && returnedId.length === 36) {
          // LOG: OS não foi duplicada, ID retornado corretamente
          this.osId = returnedId;
          /*
          /*

 // 🔥 SEMPRE recarregar a OS após salvar
if (this.osId && this.osId.length === 36) {
   this.carregarOsCompleta(this.osId);
}

*/
        } else {
          // LOG: backend não retornou OsId válido
        }

        // Atualiza o queryParam 'os' (JSON) para não voltar ao OsId antigo em refresh/retorno.
        this.atualizarQueryParamOsComNovoId(this.osId);

        // Se o backend trocou o OsId, mantém a foto “junto” via cache local.
        this.migrarCacheFotoSeMudou(oldOsId, this.osId, osCod);
        this.atualizarPreviewFoto();
        // 🔧 ALTERAÇÃO: exibe popup automático de sucesso
        this.mostrarToastSucesso();


         if (!isNovaOS) {

        //NOVO: navegar automaticamente para a tela de pesquisa
this.router.navigate(['/tabs/ordem-servico-pesquisa'], {//DEFINIR PARA QUAL TELA REALMENTE DEVERA VOLTAR
  replaceUrl: true
});

        // 🔧 ALTERAÇÃO: libera botão Anexar Foto
        //this.osConfirmada = true;
}
      },
      error: async () => {
        // mesmo em erro, mantém o fluxo atual conforme solicitado
        await this.mostrarToastAviso('Erro ao salvar a OS');
        //this.osConfirmada = true;

        // Mesmo em erro, tenta atualizar o preview (pode ter voltado da tela de foto)
        this.atualizarPreviewFoto();
      },
    });
  }
    //ALTERAÇÃO
irParaNovaFoto() {

  if (!this.osId || this.osId.length !== 36) {
    this.mostrarToastAviso('Salve a OS antes de anexar foto.');
    return;
  }

  this.router.navigate(['/tabs/ordem-servico-nova-foto'], {
    queryParams: {
      osId: this.osId,
      osCod: this.numeroOS,
      status: this.statusCodigo ?? 1   // 🔥 ENVIA STATUS ATUAL
    }
  });
}
  onMotoristaChange(event: Event) {
    let guid = (event as CustomEvent)?.detail?.value;
    // Se não for um GUID, tenta buscar na lista
    if (!guid || guid.length !== 36) {
      const motorista = this.motoristasLista?.find(m => m.id === guid || m.colaboradorCod === guid || m.colaboradorId === guid);
      guid = motorista?.id || '';
    }
    this.operadorMotorista = guid;
  }
}
