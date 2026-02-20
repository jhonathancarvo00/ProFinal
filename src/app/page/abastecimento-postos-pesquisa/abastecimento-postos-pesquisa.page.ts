import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbastecimentoService } from '../../services/abastecimento.service';
import { format, parseISO } from 'date-fns';

@Component({
  selector: 'app-abastecimento-postos-pesquisa',
  templateUrl: './abastecimento-postos-pesquisa.page.html',
  styleUrls: ['./abastecimento-postos-pesquisa.page.scss'],
  standalone: false
})
export class AbastecimentoPostosPesquisaPage implements OnInit {
  resultados: any[] = [];
  carregando = false;
  private filtrosAtuais: {
    fornecedor?: string;
    equipamento?: string;
    dataInicial?: string | null;
    dataFinal?: string | null;
    numVoucher?: string;
  } = {};

  formatarData(value?: string | null): string {
    if (!value) return '';
    try {
      return format(parseISO(value), 'dd/MM/yyyy');
    } catch {
      return String(value);
    }
  }

  fornecedorLabel(item: any): string {
    return (
      item?.fornecedorRazao ??
      item?.fornecedor ??
      item?.Fornecedor ??
      item?.fornecedorNome ??
      item?.fornNome ??
      ''
    );
  }

  equipamentoLabel(item: any): string {
    if (!item) return '';
    const ident = item.codequipamento ?? item.codEquipamento ?? item.identificador ?? item.placa ?? item.equipamento;
    const modelo = item.modelo ?? item.Modelo;
    if (ident && modelo) return `${ident} - ${modelo}`;
    return String(ident ?? modelo ?? '');
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private abastecimentoService: AbastecimentoService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
this.filtrosAtuais = {
  fornecedor: (params['fornecedorId'] ?? '')?.toString(),
  equipamento: (params['equipamentoId'] ?? '')?.toString(),
  dataInicial: (params['dataInicial'] ?? null) as string | null,
  dataFinal: (params['dataFinal'] ?? null) as string | null,
  numVoucher: (params['numVoucher'] ?? '')?.toString(),
};
      this.buscarAbastecimentos(this.filtrosAtuais);
    });
  }

  private isGuid(value: string): boolean {
    const v = (value || '').trim();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  }

  private parseDateOnly(value?: string | null): number | null {
    if (!value) return null;
    try {
      const d = parseISO(value);
      if (Number.isNaN(d.getTime())) return null;
      // normaliza para meia-noite
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    } catch {
      return null;
    }
  }

  private aplicarFiltrosLocal(dados: any[], filtros: {
    fornecedor?: string;
    equipamento?: string;
    dataInicial?: string | null;
    dataFinal?: string | null;
    numVoucher?: string;
  }): any[] {
    let lista = Array.isArray(dados) ? [...dados] : [];

    const fornecedorTxt = (filtros.fornecedor || '').trim().toLowerCase();
    if (fornecedorTxt && !this.isGuid(fornecedorTxt)) {
      lista = lista.filter(item => this.fornecedorLabel(item).toLowerCase().includes(fornecedorTxt));
    }

    const equipamentoTxt = (filtros.equipamento || '').trim().toLowerCase();
    if (equipamentoTxt && !this.isGuid(equipamentoTxt)) {
      lista = lista.filter(item => this.equipamentoLabel(item).toLowerCase().includes(equipamentoTxt));
    }

    const voucherTxt = (filtros.numVoucher || '').trim();
    if (voucherTxt) {
      lista = lista.filter(item => {
        const v = item?.numVoucher ?? item?.NumVoucher ?? item?.numeroVoucher ?? item?.NumeroVoucher ?? item?.voucher ?? item?.Voucher;
        return String(v ?? '').includes(voucherTxt);
      });
    }

    const di = this.parseDateOnly(filtros.dataInicial);
    const df = this.parseDateOnly(filtros.dataFinal);
    if (di !== null || df !== null) {
      lista = lista.filter(item => {
        const raw = item?.dataAbastecimento ?? item?.DataAbastecimento ?? item?.dataabastecimento ?? item?.data ?? item?.Data;
        const itemDate = this.parseDateOnly(raw ? String(raw) : null);
        if (itemDate === null) return true;
        if (di !== null && itemDate < di) return false;
        if (df !== null && itemDate > df) return false;
        return true;
      });
    }

    return lista;
  }

  buscarAbastecimentos(filtros: {
    fornecedor?: string;
    equipamento?: string;
    dataInicial?: string | null;
    dataFinal?: string | null;
    numVoucher?: string;
  }) {
    // Backend filtra por IDs (GUID). Para inputs livres (nome/código), aplicamos filtro local como fallback.
    const fornecedor = (filtros.fornecedor || '').trim();
    const equipamento = (filtros.equipamento || '').trim();
    const serverFiltros: any = {
      dataInicial: filtros.dataInicial || null,
      dataFinal: filtros.dataFinal || null,
      numVoucher: (filtros.numVoucher || '').trim() || null,
    };

    if (fornecedor && this.isGuid(fornecedor)) serverFiltros.fornecedorId = fornecedor;
    if (equipamento && this.isGuid(equipamento)) serverFiltros.equipamentoId = equipamento;

    this.carregando = true;
    this.abastecimentoService.consultarAbastecimentoPosto(serverFiltros)
      .subscribe({
        next: (dados) => {
          const lista = Array.isArray(dados) ? dados : [];
          this.resultados = this.aplicarFiltrosLocal(lista, filtros);
          this.carregando = false;
          if (Array.isArray(dados) && dados.length > 0) {
            // dados retornados com sucesso
          } else {
            // nenhum dado retornado
          }
        },
        error: (erro) => {
          this.carregando = false;
        }
      });
  }

  onBack() {
    this.router.navigate(['/tabs/abastecimento']);
  }

  verDetalhes(item?: any) {
    const abastecimentoId =
      item?.abastecimentoId ??
      item?.AbastecimentoId ??
      item?.idAbastecimento ??
      item?.IdAbastecimento ??
      item?.id ??
      item?.Id ??
      null;

    const idStr = abastecimentoId !== null && typeof abastecimentoId !== 'undefined' ? String(abastecimentoId) : null;

    this.router.navigate(
      idStr ? ['/tabs/abastecimento-postos-edicao', idStr] : ['/tabs/abastecimento-postos-edicao'],
      {
        state: { item, abastecimentoId: idStr }
      }
    );
  }
}
