import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { OrdemServicoService } from '../../services/ordem-servico.service';

export interface OrdemServicoListaItem {
  osId?: string;
  osCod: string;
  osDescricao: string;
  equipCod: string;
  equipIndentificador: string;
    statusCod?: number; // ALTERAÇÃO 1 - adicionar statusCod
  statusDescricao: string;
}


@Component({
  standalone: false,
  selector: 'app-ordem-servico-pesquisa',
  templateUrl: './ordem-servico-pesquisa.page.html',
  styleUrls: ['./ordem-servico-pesquisa.page.scss'],
})
export class OrdemServicoPesquisaPage implements OnInit {
  listaOs: OrdemServicoListaItem[] = [];
  carregando = false;

    // 🔥 ALTERAÇÃO 2 - MAPA OFICIAL DE STATUS (PADRONIZAÇÃO FRONT)
  private statusMap: Record<number, string> = {
    1: 'Aberto',
    2: 'Em andamento',
    3: 'Concluído',
    4: 'Cancelado',
  };

  private isGuid(value: string): boolean {
    const v = (value || '').trim();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  }

  private parseDateOnly(value?: string | null): number | null {
    if (!value) return null;
    const str = String(value);
    try {
      const d = new Date(str);
      if (Number.isNaN(d.getTime())) return null;
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    } catch {
      return null;
    }
  }

  private aplicarFiltrosLocal(dados: any[], filtros: {



    numeroOs?: string;
    empreendimento?: string;
    equipamento?: string;
    causaIntervencao?: string;
    manutentor?: string;
    status?: string;
    dataAberturaInicial?: string | null;
    dataAberturaFinal?: string | null;
    dataConclusaoInicial?: string | null;
    dataConclusaoFinal?: string | null;
  }): any[] {
    let lista = Array.isArray(dados) ? [...dados] : [];

    const numeroRaw = (filtros.numeroOs || '').trim();
    if (numeroRaw) {
      const digits = (numeroRaw.match(/\d+/g) || []).join('');
      const texto = numeroRaw.replace(/\d+/g, '').trim().toLowerCase();

      if (digits) {
        lista = lista.filter(item => String(item?.osCod ?? item?.NumeroOs ?? '').includes(digits));
      }
      if (texto) {
        lista = lista.filter(item => String(item?.osDescricao ?? item?.Descricao ?? '').toLowerCase().includes(texto));
      }

    }

    // ===============================
    // 🔎 FILTRO EQUIPAMENTO
    // ===============================
    const equipamentoValor = (filtros.equipamento || '').trim();
    if (equipamentoValor) {
      if (this.isGuid(equipamentoValor)) {
        // Filtro por GUID (selecionado da lista)
        lista = lista.filter(item => {
          const equipId = String(item?.equipId ?? item?.equipamentoId ?? item?.EquipamentoId ?? '');
          return equipId === equipamentoValor;
        });
      } else {
        // Filtro por texto livre
        const equipamentoTxt = equipamentoValor.toLowerCase();
        lista = lista.filter(item => {
          const cod = String(item?.equipCod ?? '').toLowerCase();
          const ident = String(item?.equipIndentificador ?? '').toLowerCase();
          return cod.includes(equipamentoTxt) || ident.includes(equipamentoTxt);
        });
      }
    }
/*
    const empreendimentoTxt = (filtros.empreendimento || '').trim().toLowerCase();
    if (empreendimentoTxt && !this.isGuid(empreendimentoTxt)) {
      lista = lista.filter(item => {
        const codAbertura = String(item?.emprdAberturaCod ?? '').toLowerCase();
        const codInterv = String(item?.emprdintervencaoCod ?? '').toLowerCase();
        const idAbertura = String(item?.emprdAberturaId ?? '').toLowerCase();
        const idInterv = String(item?.emprdintervencaoId ?? '').toLowerCase();
        return (
          codAbertura.includes(empreendimentoTxt) ||
          codInterv.includes(empreendimentoTxt) ||
          idAbertura.includes(empreendimentoTxt) ||
          idInterv.includes(empreendimentoTxt)
        );
      });
    }
*/
// ===============================
// 🔎 FILTRO EMPREENDIMENTO
// ===============================
const empreendimentoValor = (filtros.empreendimento || '').trim();

if (empreendimentoValor) {
  lista = lista.filter(item => {
    return (
      String(item?.emprdAberturaId ?? '') === empreendimentoValor ||
      String(item?.emprdintervencaoId ?? '') === empreendimentoValor
    );
  });
}

    // ===============================
    // 🔎 FILTRO CAUSA INTERVENÇÃO
    // ===============================
    const causaValor = (filtros.causaIntervencao || '').trim();
    if (causaValor) {
      if (this.isGuid(causaValor)) {
        // Filtro por GUID (selecionado da lista)
        lista = lista.filter(item => {
          const causaId = String(item?.causasId ?? item?.causaIntervenId ?? item?.causaIntervencaoId ?? '');
          return causaId === causaValor;
        });
      } else {
        // Filtro por texto livre
        const causaTxt = causaValor.toLowerCase();
        lista = lista.filter(item => {
          const descr = String(item?.causasDescri ?? item?.obsCausas ?? '').toLowerCase();
          return descr.includes(causaTxt);
        });
      }
    }

    // ===============================
    // 🔎 FILTRO MANUTENTOR
    // ===============================
    const manutentorValor = (filtros.manutentor || '').trim();
    if (manutentorValor) {
      if (this.isGuid(manutentorValor)) {
        // Filtro por GUID (selecionado da lista)
        lista = lista.filter(item => {
          const manutentorId = String(item?.manutentorId ?? item?.manutentorResponsavelId ?? item?.fornId ?? '');
          return manutentorId === manutentorValor;
        });
      } else {
        // Filtro por texto livre
        const manutentorTxt = manutentorValor.toLowerCase();
        lista = lista.filter(item => {
          const nome = String(item?.manutentorNome ?? '').toLowerCase();
          const cpf = String(item?.manutentorCpfCnpg ?? '').toLowerCase();
          return nome.includes(manutentorTxt) || cpf.includes(manutentorTxt);
        });
      }
    }

    const statusRaw = (filtros.status || '').trim();
    if (statusRaw) {
      const statusNum = !Number.isNaN(Number(statusRaw)) ? Number(statusRaw) : null;
      lista = lista.filter(item => {
        if (statusNum !== null) return Number(item?.statusCod ?? -1) === statusNum;
        return String(item?.statusDescricao ?? '').toLowerCase().includes(statusRaw.toLowerCase());
      });
    }

    const abIni = this.parseDateOnly(filtros.dataAberturaInicial);
    const abFim = this.parseDateOnly(filtros.dataAberturaFinal);
    if (abIni !== null || abFim !== null) {
      lista = lista.filter(item => {
        const raw = item?.osDataAbertura ?? item?.DataAbertura;
        const itemDate = this.parseDateOnly(raw ? String(raw) : null);
        if (itemDate === null) return true;
        if (abIni !== null && itemDate < abIni) return false;
        if (abFim !== null && itemDate > abFim) return false;
        return true;
      });
    }

    const conIni = this.parseDateOnly(filtros.dataConclusaoInicial);
    const conFim = this.parseDateOnly(filtros.dataConclusaoFinal);
    if (conIni !== null || conFim !== null) {
      lista = lista.filter(item => {
        const raw = item?.osDataConclusao ?? item?.DataConclusao;
        const itemDate = this.parseDateOnly(raw ? String(raw) : null);
        if (itemDate === null) return true;
        if (conIni !== null && itemDate < conIni) return false;
        if (conFim !== null && itemDate > conFim) return false;
        return true;
      });
    }

    return lista;
  }

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private ordemService: OrdemServicoService
  ) {}

   ngOnInit() {

    // 🔥 ALTERAÇÃO 3 - mapItem ajustado
    const mapItem = (item: any): OrdemServicoListaItem => {

      const statusCod = Number(item?.statusCod ?? item?.Status ?? 0);

      return {
        osId: item?.OsId ?? item?.IdOs ?? item?.id ?? item?.osId ?? null,
        osCod: String(item?.osCod ?? item?.NumeroOs ?? item?.IdOs ?? ''),
        osDescricao: item?.osDescricao ?? item?.Descricao ?? '',
        equipCod: item?.equipCod ?? item?.EquipamentoId ?? '',
        equipIndentificador: item?.equipIndentificador ?? '',
        statusCod: statusCod,

        // 🔥 ALTERAÇÃO 4 - força exibir pelo mapa
        statusDescricao:
          this.statusMap[statusCod] ??
          item?.statusDescricao ??
          item?.StatusDescricao ??
          '',
      };
    };

    this.route.queryParamMap.subscribe((params) => {
      const highlightOs = params.get('highlightOs');

      const filtrosTela = {
        numeroOs: params.get('numeroOs') ?? '',
        empreendimento: params.get('empreendimento') ?? '',
        equipamento: params.get('equipamento') ?? '',
        causaIntervencao: params.get('causaIntervencao') ?? '',
        manutentor: params.get('manutentor') ?? '',
        status: params.get('status') ?? '',
        dataAberturaInicial: params.get('dataAberturaInicial'),
        dataAberturaFinal: params.get('dataAberturaFinal'),
        dataConclusaoInicial: params.get('dataConclusaoInicial'),
        dataConclusaoFinal: params.get('dataConclusaoFinal'),
      };

      // Backend geralmente filtra por IDs (GUID) e por alguns campos específicos.
      // Para inputs livres (ex.: "143 Iguana"), fazemos filtro local como fallback.
      const numeroDigits = ((filtrosTela.numeroOs || '').match(/\d+/g) || []).join('') || null;
      const empreendimentoTrim = (filtrosTela.empreendimento || '').trim();
      const equipamentoTrim = (filtrosTela.equipamento || '').trim();
      const causaTrim = (filtrosTela.causaIntervencao || '').trim();
      const manutentorTrim = (filtrosTela.manutentor || '').trim();

const filtrosApi = {
  osId: (numeroDigits && this.isGuid(numeroDigits)) ? numeroDigits : null,

  empreendimentoId:
    (empreendimentoTrim && this.isGuid(empreendimentoTrim))
      ? empreendimentoTrim
      : null,

  equipamentoId:
    (equipamentoTrim && this.isGuid(equipamentoTrim))
      ? equipamentoTrim
      : null,

  causaIntervencaoId:
    (causaTrim && this.isGuid(causaTrim))
      ? causaTrim
      : null,

  manutentorId:
    (manutentorTrim && this.isGuid(manutentorTrim))
      ? manutentorTrim
      : null,

  status: (filtrosTela.status || '').trim() || null,
  dataInicial: filtrosTela.dataAberturaInicial || null,
  dataFinal: filtrosTela.dataAberturaFinal || null,
};

      this.carregando = true;
      this.ordemService.consultarGeral(filtrosApi).subscribe({
        next: (listaApi: any[]) => {
  let listaFiltrada = this.aplicarFiltrosLocal(listaApi || [], filtrosTela);

  // ⭐ NOVO: se veio highlightOs, mostra só a OS criada
  if (highlightOs) {
    listaFiltrada = listaFiltrada.filter(os =>
      String(os.osCod ?? os.NumeroOs ?? '') === String(highlightOs)
    );
  }

  if (!highlightOs && listaFiltrada.length === 0) {
    this.carregando = false;
    this.router.navigate(['/tabs/ordem-servico'], {
      queryParams: {
        numeroOs: filtrosTela.numeroOs || '',
        empreendimento: filtrosTela.empreendimento || '',
        equipamento: filtrosTela.equipamento || '',
        causaIntervencao: filtrosTela.causaIntervencao || '',
        manutentor: filtrosTela.manutentor || '',
        status: filtrosTela.status || '',
        dataAberturaInicial: filtrosTela.dataAberturaInicial || '',
        dataAberturaFinal: filtrosTela.dataAberturaFinal || '',
        dataConclusaoInicial: filtrosTela.dataConclusaoInicial || '',
        dataConclusaoFinal: filtrosTela.dataConclusaoFinal || '',
        semResultado: '1',
      },
      replaceUrl: true,
    });
    return;
  }

  this.listaOs = listaFiltrada.map(mapItem);
  this.carregando = false;
},

        error: (err) => {
          console.error('Erro ao buscar OS na API:', err);
          this.listaOs = [];
          this.carregando = false;
        }
      });
    });
  }

  onBack() {
    this.router.navigate(['/tabs/ordem-servico']);
  }

verDetalhes(os: OrdemServicoListaItem) {

  const guid = os['osId'] || os['OsId'] || os['IdOs'] || os['id'];

  if (!guid || String(guid).length !== 36) {
    alert('GUID da OS não encontrado.');
    return;
  }

  this.router.navigate(['/tabs/ordem-servico-edicao'], {
    queryParams: { os: guid }
  });
}
}
