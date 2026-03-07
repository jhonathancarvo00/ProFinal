import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { IonDatetime, PopoverController } from '@ionic/angular';
// Importe as funções de comparação do date-fns
import { parseISO, isSameMonth, isSameYear } from 'date-fns';

@Component({
  standalone: false,
  selector: 'app-calendar-popover',
  templateUrl: './calendar-popover.component.html',
  styleUrls: ['./calendar-popover.component.scss'],
})
export class CalendarPopoverComponent implements AfterViewInit {
  @ViewChild('datetime') datetime!: IonDatetime;

  // Guarda a data ativa mais recente. Começa como a data inicial.
  private activeDateValue: string | string[] | null | undefined;

  constructor(private popoverCtrl: PopoverController) { }

  /**
   * Guarda o valor inicial da data assim que o calendário aparece.
   */
  ngAfterViewInit() {
    setTimeout(() => {
      this.activeDateValue = this.datetime.value;
    }, 0);
  }

  /**
   * Esta função é chamada SEMPRE que um valor é definido no calendário,
   * seja por clicar num dia, ou por confirmar um novo mês/ano.
   */
  onDateChange(event: any) {
    const newDateISO = event.detail.value;

    // Se não houver uma data ativa anterior, não fazemos nada.
    if (!this.activeDateValue) {
      this.activeDateValue = newDateISO;
      return;
    }

    // Convertemos as strings de data para objetos Date para podermos compará-las.
    const newDate = parseISO(newDateISO);
    const oldDate = parseISO(this.activeDateValue as string);

    // A LÓGICA DEFINITIVA:
    // Verificamos se a nova data está no mesmo mês e ano da data anterior.
    if (isSameMonth(newDate, oldDate) && isSameYear(newDate, oldDate)) {
      // Se SIM, significa que o usuário só pode ter clicado em um DIA.
      // Esta é a ação de finalização.
      this.popoverCtrl.dismiss({ date: newDateISO });
    } else {
      // Se NÃO, significa que o usuário usou as setas ou o seletor
      // para navegar para um novo mês/ano.
      // Esta é uma ação de navegação, então NÃO fechamos o popover.
      // Em vez disso, atualizamos a data ativa para a nova data.
      this.activeDateValue = newDateISO;
    }
  }

  limparData() {
    this.popoverCtrl.dismiss({ date: null, cleared: true });
  }
}
