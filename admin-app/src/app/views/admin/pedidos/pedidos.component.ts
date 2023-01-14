import { Component, OnInit } from "@angular/core";
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireStorage } from "@angular/fire/storage";
import { map, finalize } from "rxjs/operators";
import { Observable } from "rxjs";
import { ApiService } from '../../../api.service';
import { RelatoriosService } from "src/app/relatorios.service";
// import * as printJS from 'print-js';
// import printJS from "print-js"
@Component({
  selector: "app-pedidos",
  templateUrl: "./pedidos.component.html",
})
export class PedidosComponent implements OnInit {

 resumoPedido: any;

  pedidos = [];
  config = {
    nome: null,
    whatsapp: null,
    color: null,
    logo: null,
    banner: null,
  };
  downloadURL: Observable<string>;
  selectedFile: File = null;
  fb;
  downloadURL2: Observable<string>;
  selectedFile2: File = null;
  fb2;
  filterValid = [];
  eventDate: string = '';
  eventTotal: string = '';
  eventOrder: string = '';
  eventDelivery: string = '';
  eventPayment: string = '';
  eventStatus: string = '';
  urlImagemPix: string = '';

  private dataHoje = new Date().getFullYear().toString() + '-' + this.adicionaZero(new Date().getMonth()+1) + '-' + this.adicionaZero(new Date().getDate());
  public vDataInicial: string = this.dataHoje + ' 00:00';
  public vDataFinal: string = this.dataHoje + ' 23:59';

  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth,
    private api: ApiService,
    private storage: AngularFireStorage,
    private relatoriosService: RelatoriosService
  ) {
    this.relatoriosService.mostraInfoHeaderVar = true;

  }

  //Upload do logo
  onFileSelected(event) {
    var n = Date.now();
    const file = event.target.files[0];
    const filePath = `imagens/${n}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(`imagens/${n}`, file);
    task
      .snapshotChanges()
      .pipe(
        finalize(() => {
          this.downloadURL = fileRef.getDownloadURL();
          this.downloadURL.subscribe(url => {
            //Salva a URL gerada para o arquivo
            if (url) {
              this.fb = url;
              this.config.logo = this.fb;
            }
          });
        })
      )
      .subscribe(url => {
        if (url) {
          console.log(url);
        }
      });
  }

  adicionaZero(numero){
    if (numero <= 9)
        return "0" + numero;
    else
        return numero;
  }

  //Upload do banner
  onFileSelected2(event) {
    var n = Date.now();
    const file = event.target.files[0];
    const filePath = `imagens/${n}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(`imagens/${n}`, file);
    task
      .snapshotChanges()
      .pipe(
        finalize(() => {
          this.downloadURL2 = fileRef.getDownloadURL();
          this.downloadURL2.subscribe(url => {
            //Salva a URL gerada para o arquivo
            if (url) {
              this.fb2 = url;
              this.config.banner = this.fb;
            }
          });
        })
      )
      .subscribe(url => {
        if (url) {
          console.log(url);
        }
      });
  }


  async carregar(): Promise<void> {

    return new Promise<void>((resolve) => {
      this.afs.firestore.collection('config').doc('config').get()
        .then((d) => {
          this.config = JSON.parse(JSON.stringify(d.data()));
      });

      //Listar pedidos em tempo real
      this.afs.collection('pedidos', ref => ref.orderBy('data', 'desc')).snapshotChanges().subscribe((r) => {

          let pedidos = [];

          r.forEach(async (rr) => {
            let item = rr.payload.doc.data()
            item['id'] = rr.payload.doc.id;
            pedidos.push(item);

          })

          this.api.pedidos = pedidos;
          this.pedidos = pedidos;
          this.filtrar('','')
          resolve()

      });
    })


  }

  ngOnInit() {

    this.carregar().then(()=>{
      this.filtrar('', 'data')
    });

  }

  async filtrar(event: string, valid: string) {

    new Date(this.api.pedidos[0].data.toDate())
    console.log('new Date(this.api.pedidos[0].data.toString()) :', this.api.pedidos[0].data.toDate());

    switch (valid) {
      case 'data':
        //Verifica as data inicial e final
        if(new Date(this.vDataInicial).toString().indexOf('Invalid Date') >= 0 || new Date(this.vDataInicial).toString() == ""){
          alert('Preencha a Data Inicial');
          return;
        }
        else if(new Date(this.vDataFinal).toString().indexOf('Invalid Date') >= 0 || new Date(this.vDataFinal).toString() == ""){
          alert('Preencha a Data Final');
          return;
        }
        else if (this.vDataFinal < this.vDataInicial){
          alert('Data Final precisa se MAIOR que a Data Inicial');
          return;
        }

        this.eventDate = this.vDataInicial ? this.vDataInicial : this.vDataFinal ? this.vDataInicial : '';

        break;
      case 'total':
        this.eventTotal = event ? event.toString().toUpperCase() : '';
        break;
      case 'order':
        this.eventOrder = event;
        break;
      case 'delivery':
        this.eventDelivery = event ? event.toString().toUpperCase() : '';
        break;
      case 'payment':
        this.eventPayment = event ? event.toString().toUpperCase() : '';
        break;
      case 'status':
        this.eventStatus = event ? event.toString().toUpperCase() : '';
        break;

      default:
        return;
    }

    //verifica se nao tem mais filtro
    if(this.eventDate.length == 0 && this.eventTotal.length == 0 &&  this.eventDelivery.length == 0 &&
       this.eventPayment.length == 0 && this.eventStatus.length == 0){

      this.carregar();
    }else{

      //filtra todos os campos em cada um
      this.pedidos = this.api.pedidos.filter(a =>
        //filter date
        (new Date(a.data.toDate()) >= new Date(this.vDataInicial) &&  new Date(a.data.toDate()) <= new Date(this.vDataFinal))&&
        //filter total
        (a.total.toString().toUpperCase().indexOf(this.eventTotal ? this.eventTotal : '') >= 0) &&
        //filter delivery
        ( a.cliente.bairro?.toUpperCase().indexOf(this.eventDelivery ? this.eventDelivery : '') >= 0 ||
          a.cliente.cep?.toUpperCase().indexOf(this.eventDelivery ? this.eventDelivery : '') >= 0 ||
          a.cliente.cidade?.toUpperCase().indexOf(this.eventDelivery ? this.eventDelivery : '') >= 0 ||
          a.cliente.complemento?.toUpperCase().indexOf(this.eventDelivery ? this.eventDelivery : '') >= 0 ||
          a.cliente.nome?.toUpperCase().indexOf(this.eventDelivery ? this.eventDelivery : '') >= 0 ||
          a.cliente.numero?.toUpperCase().indexOf(this.eventDelivery ? this.eventDelivery : '') >= 0 ||
          a.cliente.observacao?.toUpperCase().indexOf(this.eventDelivery ? this.eventDelivery : '') >= 0 ||
          a.cliente.rua?.toUpperCase().indexOf(this.eventDelivery ? this.eventDelivery : '') >= 0 ||
          a.cliente.celular?.toUpperCase().indexOf(this.eventDelivery ? this.eventDelivery : '') >= 0 ) &&
        //filter payment
        ( a.cliente.bandeira?.toUpperCase().indexOf(this.eventPayment ? this.eventPayment : '') >= 0 ||
          a.cliente.pagamento?.toUpperCase().indexOf(this.eventPayment ? this.eventPayment : '') >= 0 ) &&
        //filter status
          a.status?.toUpperCase().indexOf(this.eventStatus ? this.eventStatus : '') >= 0

      );
    }
  }

  limparFiltros() {
    this.eventDate = '';
    this.vDataInicial = this.dataHoje + ' 00:00';
    this.vDataFinal = this.dataHoje + ' 23:59';
    this.eventTotal = '';
    this.eventDelivery = '';
    this.eventPayment = '';
    this.eventStatus = '';

    this.filtrar('', 'data')
    // this.carregar();

  }

  aceitar(id) {
    this.afs.firestore.collection('pedidos').doc(id).update({ status: 'preparando' })
      .then(() => {
        this.carregar();
      })
  }

  recusar(id) {
    this.afs.firestore.collection('pedidos').doc(id).update({ status: 'recusado' })
      .then(() => {
        this.carregar();
      })
  }

  saiuEntrega(id) {
    this.afs.firestore.collection('pedidos').doc(id).update({ status: 'saiu para entrega' })
      .then(() => {
        this.carregar();
      })
  }

  finalizado(id) {
    this.afs.firestore.collection('pedidos').doc(id).update({ status: 'entregue' })
      .then(() => {
        this.carregar();
      })
  }

  salvar() {
    this.afs.firestore.collection('config').doc('config').update(this.config)
  }

 imprimirResumo(pedido, componentID){
    this.resumoPedido = pedido;

    setTimeout(() => {
      const printContent = document.getElementById(componentID);
      const WindowPrt = window.open('', '', 'left=0,top=0,width=900,height=900,toolbar=0,scrollbars=0,status=0');
      WindowPrt.document.write(printContent.innerHTML);
      WindowPrt.document.close();
      WindowPrt.focus();
      WindowPrt.print();
      WindowPrt.close();
    }, 300);

  }
}
