import { Component, OnInit } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { Subscription } from "rxjs";
import { RelatoriosService } from "src/app/relatorios.service";
import { PedidosCard } from "src/app/models/pedidos-card";
import { PedidosStatus } from "src/app/models/pedidos-status";


@Component({
  selector: "app-header-stats",
  styleUrls: ['./header-stats.component.css'],
  templateUrl: "./header-stats.component.html",
})
export class HeaderStatsComponent implements OnInit {

  public mostraInfos:boolean = true;
  // public pedidos: any = []

  public pedidosSaiu: PedidosCard = new PedidosCard;
  public pedidosHoje: PedidosCard = new PedidosCard;
  public pedidosEntregues: PedidosCard = new PedidosCard;
  public pedidosAguardando: PedidosCard = new PedidosCard;
  public pedidosPreparando: PedidosCard = new PedidosCard;
  public pedidosRecusados: PedidosCard = new PedidosCard;

  private dataHoje = new Date().getFullYear().toString() + '-' + this.adicionaZero(new Date().getMonth()+1) + '-' + this.adicionaZero(new Date().getDate());
  public vDataInicial: string = this.dataHoje + ' 00:00';
  public vDataFinal: string = this.dataHoje + ' 23:59';

  private subscriptions = new Subscription();

  constructor(
    private relatoriosService: RelatoriosService,
    private afs: AngularFirestore
  ) {

    this.subscriptions
    .add(
      this.relatoriosService.mostraInformacoesHeader$.subscribe(resp => this.mostraInfos = resp)
    );

  }

  ngOnInit(): void {

    this.buscaPedidosHoje();

    this.consutaPorSatus();

  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  consutaPorSatus(){
    let statusArray = ['aguardando', 'preparando', 'saiu para entrega', 'entregue', 'recusado'];

    statusArray.forEach(status => {
      this.buscaPorStatus(status);
    });
  }

  adicionaZero(numero){
    if (numero <= 9)
        return "0" + numero;
    else
        return numero;
  }

  buscaPedidosHoje(): void{
    const hInicial = new Date(this.vDataInicial);
    const hFinal = new Date(this.vDataFinal);

    //Listar pedidos em tempo real
    this.afs.collection('pedidos', ref => ref.where('data', '>=', hInicial).where('data', '<=', hFinal)).snapshotChanges().subscribe(async (r) => {

      let pedidos = [];

      r.forEach(async (rr) => {
        let item = rr.payload.doc.data()
        item['id'] = rr.payload.doc.id;

        if(item['status'] !== PedidosStatus.recusado){
          pedidos.push(item);
        }

      });
      console.log('pedidos :', pedidos);
      let valoresArray = []
      valoresArray = await pedidos?.map(resp => resp.total);

      const valor = valoresArray.length <= 0 ? 0 : valoresArray?.reduce(function(soma, i) {
        return soma + i;
      });

      this.pedidosHoje.valor = valor
      this.pedidosHoje.quantidade = pedidos.length;

    });
  }

  buscaPorStatus(status:string): void{
    const hInicial = new Date(this.vDataInicial);
    const hFinal = new Date(this.vDataFinal);

    //Listar satatus de todos os pedidos em tempo real
    this.afs.collection('pedidos', ref => ref.where('status', '==', status)).snapshotChanges().subscribe(async (r) => {

      let pedidos = [];

      r.forEach(async (rr) => {
        let item = rr.payload.doc.data()
        item['id'] = rr.payload.doc.id;
        pedidos.push(item);

      })

      switch (status) {
        case 'aguardando':
          const valorAguardando = await this.somaValores(pedidos);

          this.pedidosAguardando.quantidade = pedidos.length;
          this.pedidosAguardando.valor = valorAguardando;

          break;
        case 'preparando':
          const valorPreparando = await this.somaValores(pedidos);

          this.pedidosPreparando.quantidade = pedidos.length;
          this.pedidosPreparando.valor = valorPreparando;

          break;
        case 'saiu para entrega':
          const valorSaiu = await this.somaValores(pedidos);

          this.pedidosSaiu.quantidade = pedidos.length;
          this.pedidosSaiu.valor = valorSaiu;

          break;
        case 'entregue':
          let filtroPedidosEntregues = pedidos.filter(ped => ped.data.toDate() >= hInicial && ped.data.toDate() <= hFinal)

          const valorEntregues = await this.somaValores(filtroPedidosEntregues);

          this.pedidosEntregues.quantidade = filtroPedidosEntregues.length;
          this.pedidosEntregues.valor = valorEntregues

          break;
        case 'recusado':
          let filtroPedidosRecusados = pedidos.filter(ped => ped.data.toDate() >= hInicial && ped.data.toDate() <= hFinal);

          const valorRecusados = await this.somaValores(filtroPedidosRecusados);

          this.pedidosRecusados.quantidade = filtroPedidosRecusados.length;
          this.pedidosRecusados.valor = valorRecusados;

          break;
        default:
          break;
      }

    });
  }

  async somaValores(arrayPedidos){

    let valoresArray = []
    valoresArray = arrayPedidos?.map(resp => resp.total);

    const valor = valoresArray.length <= 0 ? 0 : await valoresArray?.reduce(function(soma, i) {
      return soma + i;
    });

    return valor;
  }

}
