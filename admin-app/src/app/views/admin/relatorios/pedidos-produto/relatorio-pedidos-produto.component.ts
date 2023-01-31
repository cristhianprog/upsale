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

let ELEMENT_DATA: PeriodicElement[] = [];
@Component({
  selector: "app-relatorio-pedidos-produto",
  styleUrls: ['./relatorio-pedidos-produto.component.css'],
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

    let arrayProdutosFiltro = [];
    let totalProdutos = 0;

    this.pedidos = []

    //somente para pegar o total de pedidos
    this.afs.firestore.collection('pedidos').where('data', '>=', hInicial).where('data', '<=', hFinal).orderBy('data').get()
    .then((r) => {
      r.forEach((rr) => {
        let obj = rr.data();
        obj['id'] = rr.id;
        this.pedidos.push(obj);
      });

      this.pedidos.forEach(pedido => {
        pedido.itens.forEach(item => {
          arrayProdutosFiltro.push({id: item.id, nome: item.titulo, quantidade: 1, valorTotal: item.preco, porcentagem:0});
        });
      })

      let arrayQuantidadeProdutos = [];
      let arrayValoresProdutos = [];

      //constroi um array com a quantidade de cada produto
      for(var produto of arrayProdutosFiltro){
        if(arrayQuantidadeProdutos[produto.id]){
          arrayQuantidadeProdutos[produto.id] = arrayQuantidadeProdutos[produto.id] + 1;
          arrayValoresProdutos[produto.id] = arrayValoresProdutos[produto.id] + produto.valorTotal
        }else{
          arrayQuantidadeProdutos[produto.id] = 1;
          arrayValoresProdutos[produto.id] = produto.valorTotal
        }
      }

      //insere a quantidade e valores
      arrayProdutosFiltro.forEach((produto, idx) => {
        arrayProdutosFiltro[idx].quantidade = arrayQuantidadeProdutos[produto.id];
        arrayProdutosFiltro[idx].valorTotal = arrayValoresProdutos[produto.id];
      })

      //remove os objetos repetidos
      arrayProdutosFiltro = arrayProdutosFiltro.filter(function (a) {
        return !this[JSON.stringify(a)] && (this[JSON.stringify(a)] = true);
      }, Object.create(null))


      //pega a quantidade total de produtos vendidos
      for(var i =0; i < arrayProdutosFiltro.length;i++){
        totalProdutos+=arrayProdutosFiltro[i].quantidade;
      }

      //insere a quantidade e valores
      arrayProdutosFiltro.forEach((produto, idx) => {
        arrayProdutosFiltro[idx].porcentagem = produto.quantidade / totalProdutos;
      })

      //atualiza as tabelas
      ELEMENT_DATA = arrayProdutosFiltro;
      this.dataSource = new MatTableDataSource(ELEMENT_DATA);
      this.dataSource.sort = this.sort;


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
