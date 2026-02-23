import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AbastecimentoService,
  AbastecimentoConsulta,
} from '../../services/abastecimento.service';

@Component({
  standalone: false,
  selector: 'app-abastecimento-proprio-pesquisa',
  templateUrl: './abastecimento-proprio-pesquisa.page.html',
  styleUrls: ['./abastecimento-proprio-pesquisa.page.scss'],
})
export class AbastecimentoProprioPesquisaPage implements OnInit {
  // lista que será exibida na tela (vinda da API)
  lista: AbastecimentoConsulta[] = [];

  // só pra você saber se está carregando
  carregando = false;

  // Armazena os filtros atuais
  private filtrosAtuais: any = {};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private abastecimentoService: AbastecimentoService
  ) {}

  ngOnInit() {
    // pega os filtros enviados pela tela anterior
    this.route.queryParams.subscribe((params) => {
      this.filtrosAtuais = {
        origemTanque: params['origemTanque'] || undefined,
        equipamento: params['equipamento'] || undefined,
        dataInicial: params['dataInicial'] || undefined,
        dataFinal: params['dataFinal'] || undefined,
      };

      this.buscarAbastecimentos(this.filtrosAtuais);
    });
  }

  // Executa sempre que a página fica visível (ao voltar da edição)
  ionViewWillEnter() {
    this.buscarAbastecimentos(this.filtrosAtuais);
  }

  private buscarAbastecimentos(filtros: {
    origemTanque?: string;
    equipamento?: string;
    dataInicial?: string | null;
    dataFinal?: string | null;
  }) {
    this.carregando = true;

    // Padronização dos filtros
    const origemTanqueTrim = (filtros.origemTanque || '').trim();
    const equipamentoTrim = (filtros.equipamento || '').trim();
    const filtrosApi: any = {
      origemTanque: origemTanqueTrim || null,
      equipamento: equipamentoTrim || null,
      dataInicial: filtros.dataInicial || null,
      dataFinal: filtros.dataFinal || null,
    };

    this.abastecimentoService
      .consultarAbastecimentoProprio(filtrosApi)
      .subscribe({
        next: (dados) => {
          let lista = Array.isArray(dados) ? dados : [];
          // Filtro local por data
          if (filtrosApi.dataInicial || filtrosApi.dataFinal) {
            lista = lista.filter(item => {
              const dataItem = item.dataAbastecimento || item.data || item.dataHora || '';
              if (!dataItem) return false;
              const dataItemDate = new Date(dataItem);
              let ok = true;
              if (filtrosApi.dataInicial) {
                const dataInicialDate = new Date(filtrosApi.dataInicial);
                ok = ok && (dataItemDate >= dataInicialDate);
              }
              if (filtrosApi.dataFinal) {
                const dataFinalDate = new Date(filtrosApi.dataFinal);
                ok = ok && (dataItemDate <= dataFinalDate);
              }
              return ok;
            });
          }
          this.lista = lista;
          this.carregando = false;
        },
        error: (erro) => {
          // Pode adicionar tratamento de erro customizado aqui se quiser
          this.carregando = false;
        },
      });
  }

  onBack() {
    // volta pra tela principal de Abastecimento
    this.router.navigate(['/tabs/abastecimento']);
  }

  verDetalhes(item: any) {
    // Navega para edição passando o id como parâmetro de rota
    this.router.navigate(['/tabs/abastecimento-proprio-edicao', item.abastecimentoId]);
  }
}



