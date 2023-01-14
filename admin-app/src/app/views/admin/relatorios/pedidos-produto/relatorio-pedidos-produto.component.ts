import { Component, OnInit, Input, ViewChild, ElementRef } from "@angular/core";

@Component({
  selector: "app-relatorio-pedidos-produto",
  templateUrl: "./relatorio-pedidos-produto.component.html",
})
export class RelatorioPedidosProdutoComponent implements OnInit {
  @Input()
  get color(): string {
    return this._color;
  }
  set color(color: string) {
    this._color = color !== "light" && color !== "dark" ? "light" : color;
  }
  private _color = "light";

  @ViewChild('inputDataInicial')
  inputDataInicial: ElementRef<HTMLInputElement>;

  @ViewChild('inputDataFinal')
    inputDataFinal: ElementRef<HTMLInputElement>;

  constructor() {}

  ngOnInit(): void {}

  clickTeste(){
    console.log('this.inputDataInicial :', this.inputDataInicial.nativeElement.value);
    console.log('this.inputDataFinal :', this.inputDataFinal.nativeElement.value);

  }
}
