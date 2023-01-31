import {AfterViewInit, Component, OnInit, Input, ViewChild, ElementRef} from "@angular/core";
import {MatSort, Sort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {LiveAnnouncer} from '@angular/cdk/a11y';
import { AngularFirestore } from "@angular/fire/firestore";

import { FireSQL } from 'firesql';
import 'firebase/firestore';


export interface PeriodicElement {
  nome: string;
  quantidade: number;
  valorTotal: number;
  porcentagem: number;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {nome: 'aguardando', quantidade: 1, valorTotal: 1.0079, porcentagem: 0},
  {nome: 'saiu para entrega', quantidade: 1, valorTotal: 1.0079, porcentagem: 0},
  {nome: 'entregue', quantidade: 1, valorTotal: 1.0079, porcentagem: 0},
  {nome: 'preparando', quantidade: 1, valorTotal: 1.0079, porcentagem: 0},
  {nome: 'recusado', quantidade: 1, valorTotal: 1.0079, porcentagem: 0},

];

@Component({
  selector: "app-relatorio-pedidos-status",
  styleUrls: ['./relatorio-pedidos-status.component.css'],
  templateUrl: "./relatorio-pedidos-status.component.html",
})


export class RelatorioPedidosStatusComponent implements OnInit, AfterViewInit {

  @Input()
  get color(): string {
    return this._color;
  }
  set color(color: string) {
    this._color = color !== "light" && color !== "dark" ? "light" : color;
  }
  private _color = "light";

  private dataHoje = new Date().getFullYear().toString() + '-' + this.adicionaZero(new Date().getMonth()+1) + '-' + this.adicionaZero(new Date().getDate());
  public vDataInicial: string = this.dataHoje + ' 00:00';
  public vDataFinal: string = this.dataHoje + ' 23:59';

  private pedidos = [];
  fireSQL;

  @ViewChild('inputDataInicial')
  inputDataInicial: ElementRef<HTMLInputElement>;

  @ViewChild('inputDataFinal')
    inputDataFinal: ElementRef<HTMLInputElement>;


  displayedColumns: string[] = ['nome', 'quantidade', 'valorTotal', 'porcentagem'];
  dataSource = new MatTableDataSource(ELEMENT_DATA);


  @ViewChild(MatSort) sort: MatSort;


  constructor(
    private _liveAnnouncer: LiveAnnouncer,
    private afs: AngularFirestore,
    ) {
      this.fireSQL = new FireSQL(afs.firestore);
    }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.iniciaDatas();
    this.dataSource.sort = this.sort;

  }

  alteraSort(sortState: Sort): void {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  consultaPedidos(dataInicial, dataFinal): void{
    const hInicial = new Date(dataInicial);
    const hFinal = new Date(dataFinal);

    const arrayStatus = ['recusado', 'saiu para entrega', 'entregue', 'aguardando', 'preparando']
    let totalStatus = 0;
    this.pedidos = []

    //soemente para pegar o total de pedidos
    this.afs.firestore.collection('pedidos').where('data', '>=', hInicial).where('data', '<=', hFinal).orderBy('data').get()
    .then((r) => {
      r.forEach((rr) => {
        let obj = rr.data();
        obj['id'] = rr.id;
        this.pedidos.push(obj);
      });
      totalStatus = this.pedidos.length

      arrayStatus.forEach(status => {
        let quantidade = 0;
        let valorTotal = 0;

        this.pedidos.forEach(pedido => {
          if(pedido.status == status){
            quantidade = quantidade + 1
            valorTotal = valorTotal + pedido.total;
          }
        });

        ELEMENT_DATA.forEach((elemento, index) => {
          if(elemento.nome == status){
            ELEMENT_DATA[index].quantidade = quantidade;
            ELEMENT_DATA[index].valorTotal = valorTotal;
            ELEMENT_DATA[index].porcentagem = (quantidade / totalStatus);
          }
        });
      });

    });
  }

  iniciaDatas(): void{
    const dataHoje = new Date();

    const dataFormatada = dataHoje.getFullYear().toString() + '-' + this.adicionaZero(dataHoje.getMonth()+1) + '-' + this.adicionaZero(dataHoje.getDate())
    const dataFormatadaInicial= dataFormatada + ' 00:00:00'
    const dataFormatadaFinal = dataFormatada + ' 23:59:00'

    //Faz a primeira consulta
    this.consultaPedidos(dataFormatadaInicial, dataFormatadaFinal);
  }

  adicionaZero(numero){
    if (numero <= 9)
        return "0" + numero;
    else
        return numero;
  }

  buscar(): void{

    console.log('this.vDataInicial :', this.vDataInicial);
    console.log('this.vDataFinal :', this.vDataFinal);

    //Verifica as data inicial e final
    if(this.vDataInicial.toString().indexOf('NaN') >= 0 || this.vDataInicial.toString() == ""){
      alert('Preencha a Data Inicial');
      return;
    }
    else if(this.vDataFinal.toString().indexOf('NaN') >= 0 || this.vDataFinal.toString() == ""){
      alert('Preencha a Data Final');
      return;
    }
    else if (this.vDataFinal < this.vDataInicial){
      alert('Data Final precisa se MAIOR que a Data Inicial');
      return;
    }

    this.consultaPedidos(this.vDataInicial, this.vDataFinal)

  }
}
