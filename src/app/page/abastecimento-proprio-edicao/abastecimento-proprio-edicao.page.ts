import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PopoverController, ToastController } from '@ionic/angular';
import { format, parseISO } from 'date-fns';
import { CalendarPopoverComponent } from '../../components/calendar-popover/calendar-popover.component';
import { AbastecimentoService } from '../../services/abastecimento.service';
import { EtapaService } from '../../services/etapa.service';
import { InsumoService } from '../../services/insumo.service';

type IonicChangeEvent<T = unknown> = CustomEvent<{ value: T }>;

type EmpreendimentoDto = {
  id: string | number;
  descricao?: string;
  nome?: string;
  empreendimentoDesc?: string;
  empreendimentoNome?: string;
  emprdCod?: number | null;
};

type BombaDto = {
  bombaId: string;
  empreendimentoId?: string;
  bombaDescricao?: string;
  bombaCod?: string;
};

type EquipamentoDto = { id: string; descricao: string };
type BicoDto = { bicoId: string; bicoDescricao?: string; bicoCdg?: string | number };

type DestinoDto = {
  destino: string;
  destinoTipo?: string;
  destinoDesc?: string;
  destinoid?: string;
};

type EtapaDto = { id: string; descricao: string };
type InsumoDto = { insumoId: string; insumoDescr: string };
type AplicacaoDto = { aplicacaoId: string; aplicacaoDescr: string };
type MotoristaOperadorDto = { fornId: string; colaboradorNome: string };
type ColaboradorFrentistaDto = { id: string; descricao: string };

type BlocoDto = {
  id?: string | number;
  blocoId?: string;
  BlocoId?: string;
  nome?: string;
  nomeBloco?: string;
  descricao?: string;
  Descricao?: string;
};

@Component({
  standalone: false,
  selector: 'app-abastecimento-proprio-edicao',
  templateUrl: './abastecimento-proprio-edicao.page.html',
  styleUrls: ['./abastecimento-proprio-edicao.page.scss'],
})
export class AbastecimentoProprioEdicaoPage implements OnInit {
  // Novos campos para exibição completa
  public fornecedorRazao: string | null = null;
  public placa: string | null = null;
  public modelo: string | null = null;
  public equipamentoNome: string | null = null;
  public empresaNome: string | null = null;
  public centroDespesaDescr: string | null = null;
  public emprDesc: string | null = null;
  // Novos campos compatíveis com backend
  public frentistaCod: string | null = null;
  public frentistalNome: string | null = null;
  public frentistaId: string | null = null;
  public emprdCod: number | null = null;
  public emprdId: string | null = null;


  // Funções de mudança de campos para o template HTML
// =====================================================
// 🔥 FUNÇÕES DE MUDANÇA DE CAMPOS (COM AUTOCOMPLETE)
// =====================================================

// =======================
// BOMBA
// =======================

onBombaChange(value: string | null) {
  const bombaId = value ? String(value) : null;

  this.bombaSelecionada = bombaId;
  this.bicoSelecionado = null;
  this.bicos = [];
  this.destinoSelecionado = null;
  this.destinos = [];
  this.insumoSelecionado = null;
  this.insumos = [];

  if (this.bombaSelecionada) {
    this.carregarEmpreendimentoPorBomba(this.bombaSelecionada);

    this.abastecimentoService.listarBicos(this.bombaSelecionada).subscribe({
      next: (bicos) => {
        this.bicos = bicos || [];
      },
      error: () => {},
    });

    this.abastecimentoService.listarDestinos(this.bombaSelecionada).subscribe({
      next: (destinos) => {
        this.destinos = destinos || [];
      },
      error: () => {},
    });

    this.abastecimentoService.listarInsumosComboio(this.bombaSelecionada).subscribe({
      next: (insumos) => {
        this.insumos = insumos || [];
      },
      error: () => {},
    });

  } else {
    this.empreendimentos = [];
  }
}

/* 🔥 ADAPTADOR AUTOCOMPLETE BOMBA */
selecionarBomba(item: any) {
  const bombaId = item?.bombaId ?? null;
  this.onBombaChange(bombaId);
}

// =======================
// BICO
// =======================

onBicoChange(value: string | null) {
  this.bicoSelecionado = value ? String(value) : null;
}

/* 🔥 ADAPTADOR AUTOCOMPLETE BICO */
selecionarBico(item: any) {
  this.onBicoChange(item?.bicoId ?? null);
}

// =======================
// DESTINO
// =======================

onDestinoChange(value: string | null) {
  this.destinoSelecionado = value ? String(value) : null;
}

/* 🔥 ADAPTADOR AUTOCOMPLETE DESTINO */
selecionarDestino(item: any) {
  this.onDestinoChange(item?.destino ?? null);
}

// =======================
// ETAPA
// =======================

onEtapaChange(value: string | null) {
  this.etapaSelecionada = value ? String(value) : null;
}

/* 🔥 ADAPTADOR AUTOCOMPLETE ETAPA */
selecionarEtapa(item: any) {
  this.onEtapaChange(item?.id ?? null);
}

// =======================
// INSUMO
// =======================

onInsumoChange(value: string | null) {
  this.insumoSelecionado = value ? String(value) : null;

  this.etapaSelecionada = null;
  this.etapas = [];
  this.aplicacaoSelecionada = null;
  this.aplicacoes = [];
  this.aplicacaoHabilitada = false;
  this.tipoPrevAbast = null;

  this.carregarEtapas();
  this.carregarAplicacoes();
}

/* 🔥 ADAPTADOR AUTOCOMPLETE INSUMO */
selecionarInsumo(item: any) {
  this.onInsumoChange(item?.insumoId ?? null);
}

    onMotoristaOperadorChange(event: Event) {
      const value = (event as CustomEvent).detail?.value;
      this.motoristaOperadorSelecionado = value as typeof this.motoristaOperadorSelecionado;
      //
      this.logPayloadPreview();
    }

    onColaboradorFrentistaChange(event: Event) {
      const value = (event as CustomEvent).detail?.value;
      this.colaboradorFrentistaSelecionado = String(value ?? '');
      //
      this.logPayloadPreview();
    }

    onBlocoChange(event: Event) {
      const value = (event as CustomEvent).detail?.value;
      this.blocoSelecionado = String(value ?? '');
      //
    }
  // Blocos para select
  blocos: BlocoDto[] = [];
  blocoSelecionado: string | null = null;

  // Colaboradores/Frentistas
  colaboradoresFrentista: ColaboradorFrentistaDto[] = [];
  colaboradorFrentistaSelecionado: string | null = null;

  // Motoristas/Operadores
  motoristasOperadores: MotoristaOperadorDto[] = [];
  motoristaOperadorSelecionado: string | { fornId: string } | null = null;

  tipoPrevAbast: string | null = null;
  aplicacaoSelecionada: string | null = null;
  aplicacoes: AplicacaoDto[] = [];
  aplicacaoHabilitada = false;
  insumos: InsumoDto[] = [];
  insumoSelecionado: string | null = null;
  etapas: EtapaDto[] = [];
  etapaSelecionada: string | null = null;
  empreendimentos: EmpreendimentoDto[] = [];
  empreendimentoSelecionado: string | null = null;
  data: string | null = null;
  bombas: BombaDto[] = [];
  equipamentos: EquipamentoDto[] = [];
  bombaSelecionada: string | null = null;
  equipamentoSelecionado: string | null = null;
  destinoSelecionado: string | null = null;
  bicoSelecionado: string | null = null;
  bicos: BicoDto[] = [];
  destinos: DestinoDto[] = [];
  quantidade: number | null = null;
  numBombaInicial: number | null = null;
  numBombaFinal: number | null = null;
  horimetroAtual: number | null = null;
  odometroAtual: number | null = null;
  horimetro: number | null = null;
  odometro: number | null = null;
  observacao: string = '';
  horaAbastecimento: string | null = null;
  carregando = false;

  // ID do abastecimento para edição
  abastecimentoId: string | null = null;
  // Dados do abastecimento para edição
  dadosAbastecimento: any = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private popoverCtrl: PopoverController,
    private abastecimentoService: AbastecimentoService,
    private etapaService: EtapaService,
    private insumoService: InsumoService,
    private toastCtrl: ToastController
  ) {
    // Captura os dados passados via state (só funciona no construtor)
    const navigation = this.router.getCurrentNavigation();
    this.dadosAbastecimento = navigation?.extras?.state?.['abastecimento'];

    //
  }

  private async toast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'top',
      color,
      icon: color === 'success' ? 'checkmark-circle-outline' : undefined,
    });
    await toast.present();
  }

  ngOnInit() {
    // Apenas carrega listas base, sem preencher formulário
    this.carregarBombas();
    this.carregarMotoristasOperadores();
    this.carregarColaboradoresFrentista();
    this.carregarEmpreendimentos();

      //  DATA ATUAL AUTOMÁTICA
    if (!this.abastecimentoId) {
      const hoje = new Date();
      this.data = hoje.toISOString().split('T')[0];
    }

    this.abastecimentoService.listarEquipamentos().subscribe({
      next: (eqps) => {
        this.equipamentos = eqps || [];
        //
      },
        error: () => {
        //
      },
    });
  }
      
    limparData(event: Event) {
      event.stopPropagation(); // impede abrir o calendário
      this.data = null;
    }

  // Carrega todos os empreendimentos disponíveis
  private carregarEmpreendimentos() {
    this.abastecimentoService.listarEmpresas().subscribe({
      next: (emps) => {
        this.empreendimentos = emps || [];
        // Garante que o empreendimento selecionado está na lista
        if (this.empreendimentoSelecionado && !this.empreendimentos.find(e => String(e.id) === String(this.empreendimentoSelecionado))) {
          // Adiciona um item fake apenas para manter o select funcionando
          this.empreendimentos.push({
            id: this.empreendimentoSelecionado,
            descricao: '[Selecionado anteriormente - não encontrado na lista]'
          });
        }
      },
      error: () => {
        this.empreendimentos = [];
        //
      },
    });
  }

  /**
   * Executa sempre que a página fica visível
   * Garante que ao voltar da navegação os dados sejam reprocessados se necessário
   */
  private paramMapSubscription: any;

  ionViewWillEnter() {
  if (this.paramMapSubscription) {
    this.paramMapSubscription.unsubscribe();
  }

  this.paramMapSubscription = this.route.paramMap.subscribe(params => {

    const id = params.get('id');

    // 🔥 LIMPA SEMPRE PRIMEIRO
    this.limparFormulario();

    if (id) {
      // ===============================
      // 🔵 MODO EDIÇÃO
      // ===============================
      this.abastecimentoId = id;

      this.carregarBombas();

      this.abastecimentoService.listarEquipamentos().subscribe({
        next: (eqps) => {
          this.equipamentos = eqps || [];

          this.abastecimentoService
            .consultarAbastecimentoProprioPorId(id)
            .subscribe({
              next: (res: any) => {
                const dados = Array.isArray(res) ? res[0] : res;

                if (dados) {

                  const bombaId = dados.comboioBombaId;
                  const empreendimentoId = dados.emprdId;
                  const insumoId = dados.insumoId;

                  const promises: Promise<any>[] = [];

                  if (bombaId) {
                    promises.push(
                      this.abastecimentoService.listarBicos(bombaId)
                        .toPromise()
                        .then(bicos => this.bicos = bicos || [])
                    );

                    promises.push(
                      this.abastecimentoService.listarDestinos(bombaId)
                        .toPromise()
                        .then(destinos => this.destinos = destinos || [])
                    );

                    promises.push(
                      this.abastecimentoService.listarInsumosComboio(bombaId)
                        .toPromise()
                        .then(insumos => this.insumos = insumos || [])
                    );
                  }

                  if (empreendimentoId && insumoId) {
                    promises.push(
                      this.etapaService.listarEtapas(empreendimentoId, insumoId)
                        .toPromise()
                        .then(etapas => this.etapas = etapas || [])
                    );

                    promises.push(
                      this.abastecimentoService
                        .listarBlocosPorEmpreendimento(empreendimentoId, insumoId)
                        .toPromise()
                        .then(blocos => this.blocos = blocos || [])
                    );
                  }

                  Promise.all(promises).then(() => {
                    this.preencherFormularioComDados(dados);

                    if (this.empreendimentoSelecionado && this.insumoSelecionado) {
                      this.carregarBlocosPorEmpreendimento(this.empreendimentoSelecionado);
                    }
                  });
                }
              },
              error: () => {
                this.limparFormulario();
              }
            });
        }
      });

    } else {
      // ===============================
      // 🟢 MODO NOVO REGISTRO
      // ===============================

      this.abastecimentoId = null;

      // 🔥 AQUI ESTÁ O SEGREDO
      const hoje = new Date();
      this.data = hoje.toISOString().split('T')[0];
    }

  });
}

  ngOnDestroy() {
    if (this.paramMapSubscription) {
      this.paramMapSubscription.unsubscribe();
    }
  }

  // Novos campos para exibição completa

  // Método auxiliar para buscar valor de campo por múltiplos nomes
  private getItemValue(item: any, keys: string[]): any {
    if (!item || typeof item !== 'object') return undefined;
    for (const k of keys) {
      const v = item[k];
      if (v !== null && typeof v !== 'undefined') return v;
    }
    return undefined;
  }

  private preencherFormularioComDados(dados: any) {
    // Exemplo de uso do método adaptado do abastecimento de postos
    // Corrige: sempre preencher o ID do abastecimento para garantir update
    this.abastecimentoId = this.getItemValue(dados, ['abastecimentoId', 'IdAbastecimento', 'idAbastecimento']);
    const guidZerado = '00000000-0000-0000-0000-000000000000';
    // Equipamento
    const equipamentoRaw = this.getItemValue(dados, ['equipamentoId', 'idEquipamento', 'IdEquipamento']);
    if (equipamentoRaw && equipamentoRaw !== guidZerado) {
      if (!this.equipamentos.find(e => String(e.id) === String(equipamentoRaw))) {
        this.equipamentos = [
          ...this.equipamentos,
          { id: equipamentoRaw, descricao: dados.modelo || 'Equipamento carregado' }
        ];
        // ...removido log de warning...
      }
      this.equipamentoSelecionado = equipamentoRaw;
    } else {
      this.equipamentoSelecionado = null;
    }
    // Empreendimento
    const empreendimentoRaw = this.getItemValue(dados, ['emprdId', 'empreendimentoId', 'idEmpreendimento']);
    const empreendimentoCod = this.getItemValue(dados, ['emprdCod', 'codigoEmpreendimento', 'codEmpreendimento']);
    if (empreendimentoRaw && empreendimentoRaw !== guidZerado) {
      // Garante que o empreendimento está na lista
      if (!this.empreendimentos.find(e => String(e.id) === String(empreendimentoRaw))) {
        // Adiciona manualmente se não estiver, incluindo o código numérico
        this.empreendimentos = [
          ...this.empreendimentos,
          {
            id: empreendimentoRaw,
            descricao: dados.emprDesc || 'Empreendimento carregado',
            emprdCod: empreendimentoCod || dados.emprdCod || null
          }
        ];
        // ...removido log de warning...
      }
      this.empreendimentoSelecionado = empreendimentoRaw;
    } else {
      this.empreendimentoSelecionado = null;
    }
    // Bomba
    const bombaRaw = this.getItemValue(dados, ['comboioBombaId', 'bombaId', 'idBomba']);
    this.bombaSelecionada = (bombaRaw && bombaRaw !== guidZerado) ? bombaRaw : null;
    // Bico
    const bicoRaw = this.getItemValue(dados, ['bicoId', 'idBico', 'BicoId']);
    this.bicoSelecionado = (bicoRaw && bicoRaw !== guidZerado) ? bicoRaw : null;
    // Insumo
    const insumoRaw = this.getItemValue(dados, ['insumoId', 'idInsumo', 'InsumoId']);
    this.insumoSelecionado = (insumoRaw && insumoRaw !== guidZerado) ? insumoRaw : null;
    // Etapa
    const etapaRaw = this.getItemValue(dados, ['etapaId', 'idEtapa', 'EtapaId']);
    this.etapaSelecionada = (etapaRaw && etapaRaw !== guidZerado) ? etapaRaw : null;
    // Bloco
    const blocoRaw = this.getItemValue(dados, ['blocoId', 'idBloco', 'BlocoId', 'blocoCod']);
    if (blocoRaw && blocoRaw !== guidZerado) {
      if (!this.blocos.find(b => String(b.id) === String(blocoRaw) || String((b as any).blocoCod) === String(blocoRaw))) {
        this.blocos = [
          ...this.blocos,
          { id: blocoRaw, nomeBloco: dados.blocoDescricao || 'Bloco carregado' }
        ];
        // ...removido log de warning...
      }
      this.blocoSelecionado = String(blocoRaw);
    } else {
      this.blocoSelecionado = null;
    }
    // Colaborador/Frentista
    const frentistaRaw = this.getItemValue(dados, ['frentistaId', 'idFrentista', 'FrentistaId']);
    this.colaboradorFrentistaSelecionado = (frentistaRaw && frentistaRaw !== guidZerado) ? frentistaRaw : null;
    // Motorista/Operador
    const operadorRaw = this.getItemValue(dados, ['responsavelId', 'operadorSolicitanteId']);
    this.motoristaOperadorSelecionado = (operadorRaw && operadorRaw !== guidZerado) ? operadorRaw : null;
    // Aplicação
    const aplicacaoRaw = this.getItemValue(dados, ['aplicacaoId', 'idAplicacao', 'AplicacaoId']);
    this.aplicacaoSelecionada = (aplicacaoRaw && aplicacaoRaw !== guidZerado) ? aplicacaoRaw : null;
    // Destino
    this.destinoSelecionado = this.getItemValue(dados, ['destino']);
    // Troca/Reposição
    this.tipoPrevAbast = this.getItemValue(dados, ['tipoPrevAbast']);
    // Quantidade
    this.quantidade = this.getItemValue(dados, ['quantidade', 'qtdInsumo']);
    // Horímetro/Odômetro
    this.horimetro = this.getItemValue(dados, ['horimetro']);
    this.odometro = this.getItemValue(dados, ['odometro']);
    this.horimetroAtual = this.getItemValue(dados, ['horimetroAtual']);
    this.odometroAtual = this.getItemValue(dados, ['odometroAtual']);
    // Bombas iniciais/finais
    this.numBombaInicial = this.getItemValue(dados, ['numBombaInicial', 'bombaInicial', 'numBicoInicial']);
    this.numBombaFinal = this.getItemValue(dados, ['numBombaFinal', 'bombaFinal', 'numBicoFinal']);
    // Observação
    this.observacao = this.getItemValue(dados, ['observacao']) || '';
    // Datas
    if (dados.dataAbastecimento) {
      this.data = String(dados.dataAbastecimento).split('T')[0];
    }
    this.horaAbastecimento = this.getItemValue(dados, ['horaAbastecimento']);
    // Campos extras
    this.fornecedorRazao = this.getItemValue(dados, ['fornecedorRazao']);
    this.placa = this.getItemValue(dados, ['placa']);
    this.modelo = this.getItemValue(dados, ['modelo']);
    this.equipamentoNome = this.getItemValue(dados, ['codEquipamento']);
    this.empresaNome = this.getItemValue(dados, ['empresaNome']);
    this.centroDespesaDescr = this.getItemValue(dados, ['centroDespesaDescr']);
    this.emprDesc = this.getItemValue(dados, ['emprDesc']);
    this.frentistaCod = this.getItemValue(dados, ['frentistaCod']);
    this.frentistalNome = this.getItemValue(dados, ['frentistalNome']);
    this.frentistaId = (frentistaRaw && frentistaRaw !== guidZerado) ? frentistaRaw : null;
    this.emprdCod = this.getItemValue(dados, ['emprdCod']);
    this.emprdId = (empreendimentoRaw && empreendimentoRaw !== guidZerado) ? empreendimentoRaw : null;
    // Dependências (listas) podem ser carregadas como já feito antes
    // ...
    // Log para depuração
    // ...removido log de preenchimento...
    // fechamento correto da função
  }

  /**
   * Limpa todos os campos do formulário para criar um novo abastecimento
   */
  private limparFormulario() {
    //

    // Limpar ID e dados
    this.abastecimentoId = null;
    this.dadosAbastecimento = null;

    // Limpar campos principais
    this.data = null;
    this.bombaSelecionada = null;
    this.equipamentoSelecionado = null;
    this.bicoSelecionado = null;
    this.destinoSelecionado = null;
    this.insumoSelecionado = null;
    this.quantidade = null;
    this.horimetro = null;
    this.odometro = null;
    this.observacao = '';
    this.numBombaInicial = null;
    this.numBombaFinal = null;

    // Limpar seleções de listas
    this.empreendimentoSelecionado = null;
    this.etapaSelecionada = null;
    this.blocoSelecionado = null;
    this.motoristaOperadorSelecionado = null;
    this.colaboradorFrentistaSelecionado = null;
    this.tipoPrevAbast = null;
    this.aplicacaoSelecionada = null;

    // Limpar arrays dependentes
    this.bicos = [];
    this.destinos = [];
    this.insumos = [];
    this.etapas = [];
    this.blocos = [];
    this.aplicacoes = [];
    this.aplicacaoHabilitada = false;

    //
  }

  private carregarBlocosPorEmpreendimento(empreendimentoId: string) {
    // Só carrega blocos se empreendimento e insumo estiverem preenchidos
    if (!empreendimentoId || !this.insumoSelecionado) {
      this.blocos = [];
      return;
    }
    this.abastecimentoService.listarBlocosPorEmpreendimento(empreendimentoId, this.insumoSelecionado).subscribe({
      next: (blocos) => {
        this.blocos = blocos || [];
      },
      error: () => {
        this.blocos = [];
      },
    });
  }


  private carregarColaboradoresFrentista() {
    this.abastecimentoService.listarColaboradoresFrentista().subscribe({
      next: (colabs) => {
        this.colaboradoresFrentista = colabs || [];
      },
      error: () => {},
    });
  }

  private carregarMotoristasOperadores() {
    this.abastecimentoService.listarColaboradoresMotoristaOperador().subscribe({
      next: (colabs) => {
        this.motoristasOperadores = colabs || [];
      },
      error: () => {},
    });
  }



  private carregarEmpreendimentoPorBomba(bombaId: string) {
    const bomba = this.bombas.find(b => b.bombaId === bombaId);
    if (bomba && bomba.empreendimentoId) {
      this.abastecimentoService.listarEmpreendimentos().subscribe({
        next: (emps) => {
          this.empreendimentos = (emps || []).filter(e => e.id === bomba.empreendimentoId);
        },
        error: () => {},
      });
    } else {
      this.empreendimentos = [];
    }
  }

onEmpreendimentoChange(value: string | null) {

  this.empreendimentoSelecionado = value ? String(value) : null;

  // Limpar seleções dependentes
  this.etapaSelecionada = null;
  this.etapas = [];
  this.blocos = [];
  this.blocoSelecionado = null;

  // Carregar blocos
  if (this.empreendimentoSelecionado) {
    this.carregarBlocosPorEmpreendimento(this.empreendimentoSelecionado);
  }

  // Se já tiver insumo, carregar etapas
  if (this.insumoSelecionado && this.empreendimentoSelecionado) {
    this.carregarEtapas();
  }
}

/* 🔥 ADAPTADOR AUTOCOMPLETE EMPREENDIMENTO */
selecionarEmpreendimento(item: any) {
  const empreendimentoId = item?.id ?? null;
  this.onEmpreendimentoChange(empreendimentoId);
}











onEquipamentoChange(value: string | null) {
  this.equipamentoSelecionado = value ? String(value) : null;
}



  // ✨ Método auxiliar para carregar etapas
  private carregarEtapas() {
    // ⚠️ IMPORTANTE: Etapas só carregam se EMPREENDIMENTO estiver selecionado
    if (!this.empreendimentoSelecionado) {
      //
      return;
    }

    if (!this.insumoSelecionado) {
      //
      return;
    }

    //

    this.etapaService.listarEtapas(this.empreendimentoSelecionado, this.insumoSelecionado).subscribe({
      next: (etapas) => {
        this.etapas = etapas || [];
        //
        if (this.etapas.length === 0) {
          //
        } else {
          //
        }
      },
      error: () => {},
    });
  }

  // ✨ Método auxiliar para carregar aplicações
  private carregarAplicacoes() {
    if (!this.equipamentoSelecionado || !this.insumoSelecionado) {
      //
      return;
    }

    //

    this.abastecimentoService.consultarAplicacaoPrevEquipInsumo(this.equipamentoSelecionado, this.insumoSelecionado).subscribe({
      next: (aplics) => {
        this.aplicacoes = aplics || [];
        this.aplicacaoHabilitada = this.aplicacoes.length > 0;

        //
        if (this.aplicacoes.length === 0) {
          //
        } else {
          //
        }
      },
      error: () => {
        //
        this.aplicacaoHabilitada = false;
        this.aplicacoes = [];
      },
    });
  }



  onBack() {
    this.router.navigate(['/tabs/abastecimento-proprio-pesquisa']);
  }

  async openCalendar(event: Event) {
    const popover = await this.popoverCtrl.create({
      component: CalendarPopoverComponent,
      event,
      backdropDismiss: true,
      translucent: true,
      cssClass: 'calendar-popover',
    });

    await popover.present();

    const { data } = await popover.onDidDismiss();

    if (data && data.date) {
      // Validar se a data não é futura
      const dataSelecionada = new Date(data.date);
      const hoje = new Date();
      hoje.setHours(23, 59, 59, 999); // Permite até o final do dia de hoje

      if (dataSelecionada > hoje) {
        this.toast('⚠️ Data não pode ser futura!', 'warning');
  }

      this.data = data.date;
      //
      this.logPayloadPreview();
    }
  }

  onOdometroChange(event: Event) {
    const ce = event as CustomEvent<{ value?: unknown }>;
    const value = ce.detail?.value ?? (event.target as HTMLInputElement | null)?.value ?? null;
    this.odometro = value !== null && value !== '' ? Number(value) : null;
    //
    this.logPayloadPreview();
  }

  onHorimetroChange(event: Event) {
    const ce = event as CustomEvent<{ value?: unknown }>;
    const value = ce.detail?.value ?? (event.target as HTMLInputElement | null)?.value ?? null;
    this.horimetro = value !== null && value !== '' ? Number(value) : null;
    //
    this.logPayloadPreview();
  }

  logPayloadPreview() {
    //
  }

  formatDate(isoString: string | null): string {
    if (!isoString) return '';
    try {
      return format(parseISO(isoString), 'dd/MM/yyyy');
    } catch {
      return '';
    }
  }

  private carregarBombas() {
    this.abastecimentoService.listarBombas().subscribe({
      next: (bombas) => {
        this.bombas = bombas || [];
      },
      error: () => {},
    });
  }







  private carregarEquipamentos() {
    this.abastecimentoService.listarEquipamentos().subscribe({
      next: (eqps) => {
        this.equipamentos = eqps || [];
      },
      error: () => {},
    });
  }

  onQuantidadeChange(event: Event) {
    const ce = event as CustomEvent<{ value?: unknown }>;
    const value = ce.detail?.value ?? (event.target as HTMLInputElement | null)?.value ?? null;
    this.quantidade = value !== null && value !== '' ? Number(value) : null;
    // ...removido log de quantidade...
    this.logPayloadPreview();
  }

  onNumBombaInicialChange(event: Event) {
    const ce = event as CustomEvent<{ value?: unknown }>;
    const value = ce.detail?.value ?? (event.target as HTMLInputElement | null)?.value ?? null;
    this.numBombaInicial = value !== null && value !== '' ? Number(value) : null;
    // ...removido log de bomba inicial...
    this.logPayloadPreview();
  }

  onNumBombaFinalChange(event: Event) {
    const ce = event as CustomEvent<{ value?: unknown }>;
    const value = ce.detail?.value ?? (event.target as HTMLInputElement | null)?.value ?? null;
    this.numBombaFinal = value !== null && value !== '' ? Number(value) : null;
    // ...removido log de bomba final...
    this.logPayloadPreview();
  }

  confirmar() {

    // Validação extra: se for edição, o ID deve estar presente
    const isEdicao = !!this.abastecimentoId;
    if (isEdicao && !this.abastecimentoId) {
      this.toast('Erro interno: ID do abastecimento não encontrado para edição!', 'danger');
      // ...removido log de erro...
      return;
    }
    if (isEdicao) {
      // ...removido log de edição...
    }

    // Validações de campos obrigatórios (conforme doc 1.11)
    if (!this.data) {
      this.toast('⚠️ Data obrigatória', 'warning');
      return;
    }

    // Validar se a data não é futura
    const dataSelecionada = new Date(this.data);
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    if (dataSelecionada > hoje) {
      this.toast('⚠️ Data não pode ser futura!', 'warning');
      return;
    }


    if (!this.bombaSelecionada) {
      this.toast('⚠️ Origem/Tanque obrigatória', 'warning');
      return;
    }

    if (!this.bicoSelecionado) {
      this.toast('⚠️ Bico obrigatório', 'warning');
      return;
    }

    if (!this.destinoSelecionado) {
      this.toast('⚠️ Destino obrigatório', 'warning');
      return;
    }

    if (!this.insumoSelecionado) {
      this.toast('⚠️ Insumo obrigatório', 'warning');
      return;
    }

    if (this.quantidade == null || this.quantidade <= 0) {
      this.toast('⚠️ Quantidade inválida', 'warning');
      return;
    }

    // Formatar data para ISO (ex: 2025-12-15T02:29:00)
    const d = new Date(this.data ?? new Date());
    const pad2 = (n: number) => n.toString().padStart(2, '0');

    const dataFormatada =
      `${d.getFullYear()}-` +
      `${pad2(d.getMonth() + 1)}-` +
      `${pad2(d.getDate())}T` +
      `${pad2(d.getHours())}:` +
      `${pad2(d.getMinutes())}:` +
      `${pad2(d.getSeconds())}`;

    // Monta horaAbastecimento no formato HH:mm:ss
    let horaAbastecimentoFormatada = this.horaAbastecimento;
    if (horaAbastecimentoFormatada && horaAbastecimentoFormatada.length === 5) {
      // Se vier só HH:mm, completa com :00
      horaAbastecimentoFormatada += ':00';
    }

    // Montar objeto de params para query string
    let operadorId = undefined;
    // Adiciona IdAbastecimento se estiver editando (já definido acima)
    if (this.motoristaOperadorSelecionado) {
      if (typeof this.motoristaOperadorSelecionado === 'string') {
        operadorId = this.motoristaOperadorSelecionado;
      } else if (
        typeof this.motoristaOperadorSelecionado === 'object' &&
        this.motoristaOperadorSelecionado &&
        'fornId' in this.motoristaOperadorSelecionado &&
        (this.motoristaOperadorSelecionado as any).fornId
      ) {
        operadorId = (this.motoristaOperadorSelecionado as any).fornId;
      }
    }
    // Descobre o tipo do destino selecionado
    const destinoObj = (this.destinos ?? []).find(d => d.destino === this.destinoSelecionado);
    const guidZerado = '00000000-0000-0000-0000-000000000000';
    // Log da lista de empreendimentos para depuração
    if (this.empreendimentos) {
      // ...removido log de debug...
    }
    // Resolve IdEmprd para o valor que o backend espera (código numérico)
    // Sempre enviar o GUID do empreendimento (emprdId) para o backend
    let idEmprdFinal: string | undefined = undefined;
    if (this.empreendimentoSelecionado && this.empreendimentos && Array.isArray(this.empreendimentos)) {
      const encontrado = this.empreendimentos.find(e =>
        String(e.id) === String(this.empreendimentoSelecionado) ||
        String((e as any).emprdId) === String(this.empreendimentoSelecionado) ||
        String((e as any).guid) === String(this.empreendimentoSelecionado)
      );
      if (encontrado && encontrado.id) {
        idEmprdFinal = String(encontrado.id);
      } else if (this.emprdId) {
        idEmprdFinal = String(this.emprdId);
        // ...removido log de warning...
      } else {
        // ...removido log de erro...
      }
    } else if (this.emprdId) {
      idEmprdFinal = String(this.emprdId);
      // ...removido log de warning...
    }
    // Resolve IdBloco para o valor que o backend espera (código ou GUID)
    let idBlocoFinal = this.blocoSelecionado;
    if (this.blocoSelecionado && this.blocos && Array.isArray(this.blocos)) {
      const blocoEncontrado = this.blocos.find(b => String(b.id) === String(this.blocoSelecionado));
      if (blocoEncontrado && (blocoEncontrado as any).blocoCod) {
        idBlocoFinal = (blocoEncontrado as any).blocoCod;
      }
    }
    // Log detalhado do valor de observação antes do envio
    // ...removido log de debug...
    const params: Record<string, unknown> = {
      DataAbastecimento: dataFormatada || undefined,
      horaAbastecimento: horaAbastecimentoFormatada || undefined,
      TpAbastecimento: 0,
      TpDestino: this.destinoSelecionado ?? undefined,
      IdTanqueOrigem: this.bombaSelecionada ?? undefined,
      IdBico: this.bicoSelecionado ?? undefined,
      IdInsumo: this.insumoSelecionado ?? undefined,
      QtdInsumo: this.quantidade != null ? Number(this.quantidade) : undefined,
      Origem: 3,
      Horimetro: this.horimetro != null ? Number(this.horimetro) : undefined,
      Odometro: this.odometro != null ? Number(this.odometro) : undefined,
      NumBicoInicial: this.numBombaInicial != null ? Number(this.numBombaInicial) : undefined,
      NumBicoFinal: this.numBombaFinal != null ? Number(this.numBombaFinal) : undefined,
      Observacao: this.observacao ?? undefined,
      IdBloco: idBlocoFinal ?? undefined,
      OperadorSolicitanteId: operadorId,
      FrentistaId: this.colaboradorFrentistaSelecionado ?? undefined,
      IdEmprd: idEmprdFinal ?? undefined,
      IdEtapa: this.etapaSelecionada ?? undefined,
      // Campos novos conforme doc 1.11
      TipoPrevAbast: this.tipoPrevAbast ?? undefined,
      AplicacaoPrevId: this.aplicacaoSelecionada ?? undefined,
      // Alinhar nome do campo para garantir compatibilidade
      ...(isEdicao ? { IdAbastecimento: this.abastecimentoId } : {}),
    };
    if (isEdicao) {
      // ...removido log de edição/erro...
    }

    // Regra: nunca enviar IdEquipamento e IdTanqueDestino juntos!
    if (destinoObj && destinoObj.destinoTipo === 'M') {
      params.IdEquipamento = this.equipamentoSelecionado;
      delete params.IdTanqueDestino;
    } else {
      if (destinoObj && destinoObj.destinoid && destinoObj.destinoid !== guidZerado) {
        params.IdTanqueDestino = destinoObj.destinoid;
      } else {
        delete params.IdTanqueDestino;
      }
      delete params.IdEquipamento;
    }

    Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
    // Log dos dados enviados para API
    // ...removido log de payload...

    this.carregando = true;
    this.abastecimentoService.gravarAbastecimento(params).subscribe({
      next: (res) => {
        this.carregando = false;
        this.toast('✅ Abastecimento gravado! ID: ' + (typeof res === 'string' ? res.substring(0, 8) : 'OK'), 'success');
        setTimeout(() => {
          this.router.navigate(['/tabs/abastecimento-proprio-pesquisa']);
        }, 1500);
      },
      error: (err) => {
        this.carregando = false;
        this.toast('Erro ao salvar abastecimento. Veja o console para detalhes.', 'danger');
      },
    });
  }
}

