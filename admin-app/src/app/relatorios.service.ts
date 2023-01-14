import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RelatoriosService {

  private mostraInformacoesHeader = new BehaviorSubject<any>(true);
  public mostraInformacoesHeader$ = this.mostraInformacoesHeader.asObservable();

  public set mostraInfoHeaderVar(valor: boolean) {
    this.mostraInformacoesHeader.next(valor)
  }

  constructor() { }
}
