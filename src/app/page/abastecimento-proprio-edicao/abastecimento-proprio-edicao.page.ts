import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PopoverController, ToastController } from '@ionic/angular';
import { format, parseISO } from 'date-fns';
import { CalendarPopoverComponent } from '../../components/calendar-popover/calendar-popover.component';
import { AbastecimentoService } from '../../services/abastecimento.service';
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
//fazer a chamada dele
type EtapaDto = { id: string; descricao: string };
type InsumoDto = { insumoId: string; insumoDescr: string };
type AplicacaoDto = { aplicacaoId: string; aplicacaoDescr: string };
type MotoristaOperadorDto = { fornId: string; colaboradorNome: string };
type ColaboradorFrentistaDto = { id: string; descricao: string };


//
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

// =====================================================
//  FUNÇÕES DE MUDANÇA DE CAMPOS (COM AUTOCOMPLETE)
// =====================================================

// =======================
// BOMBA
// =======================

onBombaChange(value: string | null) {
  const bombaId = value ? String(value) : null;

  this.bombaSelecionada = bombaId;

  // Limpa dependentes
  this.bicoSelecionado = null;
  this.bicos = [];

  this.destinoSelecionado = null;
  this.destinos = [];

  this.insumoSelecionado = null;
  this.insumos = [];

  this.empreendimentoSelecionado = null;
  this.empreendimentos = [];

  if (!bombaId) return;

  // Consulta bomba para pegar Emprd
  this.abastecimentoService.consultarBomba(bombaId).subscribe({
  next: (bombas: any[]) => {

  const bomba = bombas?.[0]; // pega o primeiro item
  const emprdId = bomba?.empreendimentoId;


  if (emprdId) {
    this.carregarEmpreendimentoPorBomba(emprdId);
  }
      //Carrega dependências
      this.carregarBicos(bombaId);
      this.carregarDestinos(bombaId);
      this.carregarInsumos(bombaId);

    },
    error: () => {
      this.toast('Erro ao consultar bomba', 'danger');
    }
  });
}

/* DAPTADOR AUTOCOMPLETE BOMBA */
selecionarBomba(item: any) {
  const bombaId = item?.id ?? null;
  this.onBombaChange(bombaId);
}
// =======================
// BICO
// =======================

onBicoChange(value: string | null) {
  this.bicoSelecionado = value ? String(value) : null;

  this.carregarUltimoNumeroBico(); // chama automaticamente
}

/* ADAPTADOR AUTOCOMPLETE BICO */
selecionarBico(item: any) {
  this.onBicoChange(item?.id ?? null);
}
/* 🔥 ADAPTADOR AUTOCOMPLETE EQUIPAMENTO */
selecionarEquipamento(item: any) {
  const equipamentoId = item?.id ?? null;
  this.onEquipamentoChange(equipamentoId);
}
// =======================
// DESTINO
// =======================
onDestinoChange(value: string | null) {

  this.destinoSelecionado = value ? String(value) : null;
  this.destinoTravado = false;

  if (!this.destinoSelecionado) return;

  const destinoObj = this.destinos.find(
    d => String(d.id) === String(this.destinoSelecionado)
  );

  if (!destinoObj) return;

  // 🔥 Se NÃO for destino tipo Equipamento
  if (destinoObj.destinoTipo !== 'M') {
    this.equipamentoSelecionado = null;
  }
}

/* ADAPTADOR AUTOCOMPLETE DESTINO */
selecionarDestino(item: any) {
  const destinoId = item?.id ?? null;
  this.onDestinoChange(destinoId);
}
// =======================
// ETAPA
// =======================

onEtapaChange(value: string | null) {
  this.etapaSelecionada = value ? String(value) : null;
}

/* ADAPTADOR AUTOCOMPLETE ETAPA */
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

  this.carregarEtapas();
  this.carregarAplicacoes();
}
/* ADAPTADOR AUTOCOMPLETE EMPREENDIMENTO */
selecionarEmpreendimento(item: any) {
  const empreendimentoId = item?.id ?? null;
  this.onEmpreendimentoChange(empreendimentoId);
}
/* ADAPTADOR AUTOCOMPLETE INSUMO */
selecionarInsumo(item: any) {
  this.onInsumoChange(item?.id ?? null);

}
/*  ADAPTADOR AUTOCOMPLETE TROCA/REPOSIÇÃO */
selecionarTipoPrevAbast(item: any) {
  this.tipoPrevAbast = item?.id ?? null;
}
/* ADAPTADOR AUTOCOMPLETE APLICAÇÃO */
aplicacaoSelecionada: any = null;

selecionarAplicacao(item: any) {
  console.log("Selecionou aplicação:", item);
   this.aplicacaoSelecionada = item?.id ?? null;
  console.log("AplicacaoSelecionada:", this.aplicacaoSelecionada);
}
/* ADAPTADOR AUTOCOMPLETE MOTORISTA */
selecionarMotoristaOperador(item: any) {
  this.motoristaOperadorSelecionado = item;
}
/* ADAPTADOR AUTOCOMPLETE FRENTISTA */
selecionarColaboradorFrentista(item: any) {
  this.colaboradorFrentistaSelecionado = item?.id ?? null;
}
/* ADAPTADOR AUTOCOMPLETE BLOCO */
selecionarBloco(item: any) {
  this.blocoSelecionado = item?.id ?? null;
}
    onMotoristaOperadorChange(event: Event) {
      const value = (event as CustomEvent).detail?.value;
      this.motoristaOperadorSelecionado = value as typeof this.motoristaOperadorSelecionado;
      this.logPayloadPreview();
    }

    onColaboradorFrentistaChange(event: Event) {
      const value = (event as CustomEvent).detail?.value;
      this.colaboradorFrentistaSelecionado = String(value ?? '');
      this.logPayloadPreview();
    }

    onBlocoChange(event: Event) {
      const value = (event as CustomEvent).detail?.value;
      this.blocoSelecionado = String(value ?? '');
    }
  // Blocos para select
  blocos: BlocoDto[] = [];
  blocoSelecionado: string | null = null;

  // Colaboradores/Frentistas
  colaboradoresFrentista: ColaboradorFrentistaDto[] = [];
  colaboradorFrentistaSelecionado: string | null = null;

  // Motoristas/Operadores
  motoristasOperadores: MotoristaOperadorDto[] = [];
  motoristaOperadorSelecionado: string | null = null;

tipoPrevAbast: number | null = null;

tiposPrevAbast = [
  { id: 1, descricao: 'Troca' },
  { id: 2, descricao: 'Reposição' }
];
  //aplicacaoSelecionada: string | null = null;
  aplicacoes: any[] = [];
  aplicacaoHabilitada = false;
  insumos: any[] = [];
  insumoSelecionado: string | null = null;
  etapas: { id: string; descricao: string }[] = [];
  etapaSelecionada: string | null = null;
  empreendimentos: EmpreendimentoDto[] = [];
  empreendimentoSelecionado: string | null = null;
  data: string | null = null;
  bombas: { id: string; descricao: string }[] = [];
  equipamentos: EquipamentoDto[] = [];
  bombaSelecionada: string | null = null;
  equipamentoSelecionado: string | null = null;
  destinoSelecionado: string | null = null;
  bicoSelecionado: string | null = null;
  bicos: any[] = [];
  destinos: any[] = [];
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

  destinoTravado = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private popoverCtrl: PopoverController,
    private abastecimentoService: AbastecimentoService,
    private insumoService: InsumoService,
    private toastCtrl: ToastController
  )
  {
    // Captura os dados passados via state (só funciona no construtor)
    const navigation = this.router.getCurrentNavigation();
    this.dadosAbastecimento = navigation?.extras?.state?.['abastecimento'];
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
  this.carregarBombas();
  this.carregarMotoristasOperadores();
  this.carregarColaboradoresFrentista();
  this.carregarEquipamentos();

  if (!this.abastecimentoId) {
    const hoje = new Date();
    this.data = hoje.toISOString().split('T')[0];
  }
}
    limparData(event: Event) {
      event.stopPropagation();
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

    // LIMPA SEMPRE PRIMEIRO
    this.limparFormulario();

    if (id) {
      // ===============================
      //  MODO EDIÇÃO
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
                        .then(bicos => {
                        this.bicos = (bicos || []).map(b => ({
                          id: b.bicoId,
                          descricao: b.bicoDescricao
                        }));
                      })
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

                  if (empreendimentoId) {
                    promises.push(
                      this.abastecimentoService
                        .listarEtapas({
                          empreendimentoId: String(empreendimentoId),
                          pesquisa: '',
                          mostrarDI: true
                        })
                        .toPromise()
                        .then((etapas: any) => {

                          this.etapas = (etapas || []).map(e => ({
                            id: String(e.id),
                            descricao: e.descricao || e.nome
                          }));

                        })
                    );

                  }
                Promise.all(promises).then(() => {

                  this.preencherFormularioComDados(dados);

                  //carregar blocos apenas pelo empreendimento
                if (this.emprdCod) {
  this.carregarBlocosPorEmpreendimento(String(this.emprdCod));
}

                  if (this.equipamentoSelecionado && this.insumoSelecionado) {
                    this.carregarAplicacoes();
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

      this.abastecimentoId = null;

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

if (this.empreendimentoSelecionado) {
  this.onEmpreendimentoChange(this.empreendimentoSelecionado);
}
    } else {
      this.empreendimentoSelecionado = null;
    }
    // Bomba
const bombaRaw = this.getItemValue(dados, ['comboioBombaId', 'bombaId', 'idBomba']);
this.bombaSelecionada = (bombaRaw && bombaRaw !== guidZerado) ? bombaRaw : null;

/*IMPORTANTE: carregar dependências da bomba no modo edição */
if (this.bombaSelecionada) {

  // Carregar BICOS
this.abastecimentoService.listarBicos(this.bombaSelecionada).subscribe({
  next: (bicos: any[]) => {
    this.bicos = (bicos || []).map(b => ({
      id: b.bicoId,
      descricao: b.bicoDescricao
    }));
  },
  error: () => {
    this.bicos = [];
  }
});
  // Carregar DESTINOS
this.abastecimentoService.listarDestinos(this.bombaSelecionada).subscribe({
  next: (destinosApi) => {
      this.destinos = (destinosApi || []).map((d: any) => ({
        id: d.destino,
        descricao: d.destinoDesc,
        destinoTipo: d.destinoTipo,
        destinoId: d.destinoId,
        emprdId: d.emprdId,
        emprdCod: d.emprdCod
      }));


    if (this.equipamentoSelecionado) {
      this.onEquipamentoChange(this.equipamentoSelecionado);
    }

  },
  error: () => {
    this.destinos = [];
  },
});

//  CARREGAR INSUMOS (centralizado)
if (this.bombaSelecionada) {
  this.carregarInsumos(this.bombaSelecionada);
}
}
    // Etapa
    const etapaRaw = this.getItemValue(dados, ['etapaId', 'idEtapa', 'EtapaId']);
    this.etapaSelecionada = (etapaRaw && etapaRaw !== guidZerado) ? etapaRaw : null;
    // Bloco
    const blocoRaw = this.getItemValue(dados, ['blocoId', 'idBloco', 'BlocoId', 'blocoCod']);
    if (blocoRaw && blocoRaw !== guidZerado) {
      if (!this.blocos.find(b => String(b.id) === String(blocoRaw) || String((b as any).blocoCod) === String(blocoRaw))) {
        this.blocos = [
          ...this.blocos,
          { id: blocoRaw, descricao: dados.blocoDescricao }
        ];
        // ...removido log de warning...
      }
      this.blocoSelecionado = String(blocoRaw);
    } else {
      this.blocoSelecionado = null;

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
// Troca/Reposição
const tipo = this.getItemValue(dados, ['tipoPrevAbast']);

if (tipo === 'T') {
  this.tipoPrevAbast = 1;
} else if (tipo === 'R') {
  this.tipoPrevAbast = 2;
} else if (tipo !== undefined && tipo !== null) {
  this.tipoPrevAbast = Number(tipo);
} else {
  this.tipoPrevAbast = null;
}
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

  if (!empreendimentoId) {
    this.blocos = [];
    return;
  }

  this.abastecimentoService
    .listarBlocosProprio(empreendimentoId)
    .subscribe({
      next: (res: any[]) => {

        this.blocos = (res || []).map(b => ({
          id: b.id ?? b.unidadeId ?? b.blocoId,
          descricao: b.descricao ?? b.nome ?? b.nomeBloco
        }));

      },
      error: () => {
        this.blocos = [];
      }
    });
}
private testarEmpreendimentosComBlocos(): void {

  console.log("🔎 TESTANDO EMPREENDIMENTOS...");

  this.empreendimentos.forEach(emp => {

    this.abastecimentoService
      .listarBlocosProprio(emp.id as string)
      .subscribe((res: any) => {

        const lista = Array.isArray(res) ? res : [];

        if (lista.length > 0) {
          console.log("✅ TEM BLOCOS:", emp.descricao, emp.id, lista);
        } else {
          console.log("❌ SEM BLOCOS:", emp.descricao);
        }

      });

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

private carregarEmpreendimentoPorBomba(emprdId: string) {



  if (!emprdId) {
    this.empreendimentos = [];
    this.empreendimentoSelecionado = null;
    return;
  }

  this.abastecimentoService
    .listarEmpreendimentos(emprdId)
    .subscribe({
      next: (emps: any[]) => {

        this.empreendimentos = (emps || []).map(e => ({
          id: String(e.id),
          descricao: e.descricao || e.nome,
          emprdCod: Number(e.codigo)
        }));

        setTimeout(() => {
  this.testarEmpreendimentosComBlocos();
}, 500);

        console.log("Empreendimentos retorno API:", emps);

        // 🔥 NÃO seleciona automaticamente
        this.empreendimentoSelecionado = null;

      },
      error: () => {
        this.empreendimentos = [];
        this.empreendimentoSelecionado = null;
      }
    });
}
private carregarDestinos(bombaId: string) {

  this.abastecimentoService.listarDestinos(bombaId).subscribe({
    next: (destinosApi: any[]) => {

      this.destinos = (destinosApi || []).map(d => ({
        id: d.destino,
        descricao: d.destinoDesc,
        destinoTipo: d.destinoTipo,
        destinoId: d.destinoid
      }));

       this.aplicarRegraEquipamentoDestino();
    },
    error: () => {
      this.destinos = [];
      console.log("DESTINOS CARREGADOS:", this.destinos);
    },
  });
}


private aplicarRegraEquipamentoDestino() {

  if (!this.equipamentoSelecionado) return;
  if (!this.destinos?.length) return;

  const destinoEquip = this.destinos.find(d => {
    const tipo = String(d.destinoTipo || '')
      .trim()
      .toUpperCase();

    return tipo === 'M';
  });

  if (!destinoEquip) {
    console.log("⚠ Não encontrou destino tipo M");
    return;
  }

  console.log("✅ Destino encontrado:", destinoEquip);

  this.destinoSelecionado = destinoEquip.id;
}


private carregarInsumos(bombaId: string) {

  if (!bombaId) {
    this.insumos = [];
    return;
  }

  this.abastecimentoService
    .listarInsumosComboio(bombaId)
    .subscribe({
      next: (insumos: any[]) => {

        this.insumos = (insumos || []).map(i => ({
          id: i.insumoId,
          descricao: i.insumoDescr
        }));

      },
      error: () => {
        this.insumos = [];
      }
    });
}

private carregarUltimoNumeroBico() {

  console.log("Chamando ultimo numero bico");
  console.log("Bomba:", this.bombaSelecionada);
  console.log("Bico:", this.bicoSelecionado);

  if (!this.bombaSelecionada || !this.bicoSelecionado) {
    return;
  }

  this.abastecimentoService
    .consultarUltimoNumeroBico(
      this.bombaSelecionada,
      this.bicoSelecionado
    )
.subscribe({
  next: (retorno: any) => {
    console.log("RETORNO API:", retorno);

    this.numBombaInicial = retorno?.[0]?.numeracao ?? 0;
  },
  error: () => {
    console.error('Erro ao consultar último número do bico');
  }
});
}

onEmpreendimentoChange(value: string | null) {

  this.empreendimentoSelecionado = value ? String(value) : null;

  // 🔥 NOVO: capturar o emprdCod do empreendimento selecionado
  const encontrado = this.empreendimentos.find(
    e => String(e.id) === String(this.empreendimentoSelecionado)
  );

 this.emprdCod = encontrado?.emprdCod ?? null;

  console.log("Empreendimento selecionado:", this.empreendimentoSelecionado);
  console.log("emprdCod salvo:", this.emprdCod);

  // Limpa dependentes
  this.etapaSelecionada = null;
  this.etapas = [];

  this.blocos = [];
  this.blocoSelecionado = null;

  if (!this.empreendimentoSelecionado) {
    return;
  }

  // Carrega Etapas
  this.carregarEtapas();

  // 🔥 Agora vai enviar o emprdCod correto
if (this.empreendimentoSelecionado) {
  this.carregarBlocosPorEmpreendimento(this.empreendimentoSelecionado);
}
}

onEquipamentoChange(value: string | null) {

  this.equipamentoSelecionado = value ? String(value) : null;

  if (!this.equipamentoSelecionado) {
    return;
  }

  // 🔥 Se destinos já estiverem carregados, aplica agora
  if (this.destinos && this.destinos.length > 0) {
    this.aplicarRegraEquipamentoDestino();
  }
}


  // Método auxiliar para carregar etapas
private carregarEtapas() {

  if (!this.empreendimentoSelecionado) {
    this.etapas = [];
    return;
  }

  this.abastecimentoService
    .listarEtapas({
      empreendimentoId: String(this.empreendimentoSelecionado),
      pesquisa: '',
      mostrarDI: true
    })
    .subscribe({
      next: (response: any[]) => {

        this.etapas = (response || []).map(e => ({
          id: String(e.id),
          descricao: e.descricao
        }));

      },
      error: () => {
        this.etapas = [];
      }
    });
}
private carregarAplicacoes() {

  if (!this.equipamentoSelecionado || !this.insumoSelecionado) {
    this.aplicacoes = [];
    this.aplicacaoSelecionada = null;
    this.aplicacaoHabilitada = false;
    return;
  }

  this.abastecimentoService
    .consultarAplicacaoPrev(
      this.equipamentoSelecionado,
      this.insumoSelecionado
    )
    .subscribe({
      next: (res: any[]) => {

        this.aplicacoes = (res || []).map(a => ({
          id: a.aplicacaoId,
          descricao: a.aplicacaoDescr
        }));

        this.aplicacaoHabilitada = this.aplicacoes.length > 0;

        if (!this.aplicacaoHabilitada) {
          this.aplicacaoSelecionada = null;
        }
      },
      error: () => {
        this.aplicacoes = [];
        this.aplicacaoSelecionada = null;
        this.aplicacaoHabilitada = false;
      }
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
      hoje.setHours(23, 59, 59, 999);

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

// PADRONIZA LISTAS PARA O AUTOCOMPLETE
private padronizarLista(lista: any[], idField: string, descField: string) {
  return (lista || []).map(item => ({
    id: item?.[idField],
    descricao: item?.[descField]
  }));
}
  private carregarBombas() {
    this.abastecimentoService.listarBombas().subscribe({
      next: (bombas) => {
      this.bombas = this.padronizarLista(
        bombas,
        'bombaId',
        'bombaDescricao'
      );
      },
      error: () => {},
    });
  }

  private carregarBicos(bombaId: string) {

  if (!bombaId) {
    this.bicos = [];
    return;
  }

  this.abastecimentoService.listarBicos(bombaId).subscribe({
    next: (bicos: any[]) => {
      this.bicos = (bicos || []).map(b => ({
        id: b.bicoId,
        codigo: b.bicoCdg,
        descricao: b.bicoDescricao
      }));
    },
    error: () => {
      this.bicos = [];
    }
  });
}
private carregarEquipamentos() {
  this.abastecimentoService.listarEquipamentosMobile().subscribe({
    next: (eqps: any[]) => {
      this.equipamentos = eqps.map(e => ({
        id: e.id,
        descricao: e.descricao
      }));
    },
    error: () => {},
  });

}



onQuantidadeChange(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  this.quantidade = value ? Number(value) : null;
}

onNumBombaInicialChange(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  this.numBombaInicial = value ? Number(value) : null;
}

onNumBombaFinalChange(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  this.numBombaFinal = value ? Number(value) : null;
}
onHoraChange(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  this.horaAbastecimento = value || null;
}
onObservacaoChange(event: Event) {
  const value = (event.target as HTMLTextAreaElement).value;
  this.observacao = value || '';
}

onAplicacaoChange(event: any) {
  this.aplicacaoSelecionada = event?.id ?? null;
}
  confirmar() {

  const isEdicao = !!this.abastecimentoId;

  if (isEdicao && !this.abastecimentoId) {
    this.toast('Erro interno: ID do abastecimento não encontrado para edição!', 'danger');
    return;
  }

  if (!this.data) {
    this.toast(' Data obrigatória', 'warning');
    return;
  }

  const dataSelecionada = new Date(this.data);
  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);

  if (dataSelecionada > hoje) {
    this.toast('Data não pode ser futura!', 'warning');
    return;
  }

  if (!this.bombaSelecionada) {
    this.toast('Origem/Tanque obrigatória', 'warning');
    return;
  }

  if (!this.bicoSelecionado) {
    this.toast('Bico obrigatório', 'warning');
    return;
  }

  if (!this.destinoSelecionado) {
    this.toast('Destino obrigatório', 'warning');
    return;
  }

  if (!this.insumoSelecionado) {
    this.toast('Insumo obrigatório', 'warning');
    return;
  }

  if (this.quantidade == null || this.quantidade <= 0) {
    this.toast('Quantidade inválida', 'warning');
    return;
  }

  // ------------------ DATA FORMATADA ------------------

 // ------------------ DATA FORMATADA ------------------

// ------------------ DATA FORMATADA (SEM UTC) ------------------

const dataBase = this.data.split('T')[0]; // yyyy-MM-dd
const dataFormatada = `${dataBase}T00:00:00`;

  // ------------------ OPERADOR ------------------

  let operadorId: string | undefined;

  if (this.motoristaOperadorSelecionado) {
    if (typeof this.motoristaOperadorSelecionado === 'string') {
      operadorId = this.motoristaOperadorSelecionado;
    } else if (
      typeof this.motoristaOperadorSelecionado === 'object' &&
      'fornId' in this.motoristaOperadorSelecionado
    ) {
      operadorId = (this.motoristaOperadorSelecionado as any).fornId;
    }
  }

  // ------------------ DESTINO ------------------

  const destinoObj = (this.destinos ?? []).find(
    d => d.id === this.destinoSelecionado
  );

  if (!destinoObj) {
    this.toast('Destino inválido', 'warning');
    return;
  }

// ------------------ EMPREENDIMENTO ------------------

const idEmprdFinal: string | undefined =
  this.empreendimentoSelecionado || undefined;

// ------------------ BLOCO ------------------

const idBlocoFinal: string | undefined =
  this.blocoSelecionado || undefined;

console.log("SALVANDO IdEmprd:", idEmprdFinal);
console.log("SALVANDO IdBloco:", idBlocoFinal);

/*

if (!this.blocoSelecionado) {
  this.toast('Bloco é obrigatório para aplicação do insumo', 'warning');
  return;
}

*/


// backend está exigindo
if (!this.tipoPrevAbast) {
  this.toast('Troca / Reposição obrigatória', 'warning');
  return;
}



// ---------------- PARAMS ----------------

const params: Record<string, unknown> = {
  TpAbastecimento: 0,
  DataAbastecimento: dataFormatada,
  TpDestino: destinoObj.destinoTipo,
  IdTanqueOrigem: this.bombaSelecionada,
  IdBico: this.bicoSelecionado,
  IdInsumo: this.insumoSelecionado,
  QtdInsumo: Number(this.quantidade),
  Origem: 3,


TipoPrevAbast: this.tipoPrevAbast ?? undefined,

//IdBloco: this.blocoSelecionado,

  ...(destinoObj.destinoTipo === 'M' && {
    IdEquipamento: this.equipamentoSelecionado
  }),

  AplicacaoPrevId: this.aplicacaoSelecionada
};


  // ------------------ REGRA DESTINO ------------------

  if (destinoObj.destinoTipo === 'M') {
    // Equipamento
    params.IdEquipamento = this.equipamentoSelecionado;
  } else {
    // Tanque / Comboio / etc
    params.IdTanqueDestino = destinoObj.destinoId;
  }

  // Remove undefined
  Object.keys(params).forEach(
    key => params[key] === undefined && delete params[key]
  );

  // ------------------ ENVIO ------------------

  this.carregando = true;

  console.log("AplicacaoSelecionada:", this.aplicacaoSelecionada);

console.log("PAYLOAD FINAL:", params);

  this.abastecimentoService.gravarAbastecimento(params)
  .subscribe({
    next: (res) => {
      this.carregando = false;
      this.toast(
        'Abastecimento gravado! ID: ' +
        (typeof res === 'string' ? res.substring(0, 8) : 'OK'),
        'success'
      );

      setTimeout(() => {
        this.router.navigate(['/tabs/abastecimento-proprio-pesquisa']);
      }, 1500);
    },
    error: () => {
      this.carregando = false;
      this.toast(
        'Erro ao salvar abastecimento. Veja o console para detalhes.',
        'danger'
      );
    },
  });
}
}
