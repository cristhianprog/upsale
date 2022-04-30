import { Component, OnInit } from "@angular/core";
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireStorage } from "@angular/fire/storage";
import { map, finalize } from "rxjs/operators";
import { Observable } from "rxjs";
import { ApiService } from '../../../api.service';



@Component({
  selector: "app-pedidos",
  templateUrl: "./pedidos.component.html",
})
export class PedidosComponent implements OnInit {

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
  newDate: string;
  filterValid = [];
  eventDate: string = '';
  eventTotal: string = ''; 
  eventOrder: string = '';
  eventDelivery: string = '';
  eventPayment: string = '';
  eventStatus: string = '';

  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth,
    private api: ApiService,
    private storage: AngularFireStorage
  ) {

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


  async carregar() {
 
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
      
    });
  }

  ngOnInit() {
    // this.afAuth.signInAnonymously().then(() => {
    this.carregar();
    // })
  }

  async filtrar(event: string, valid: string) {
  console.log('valid :', valid);

    switch (valid) {
      case 'date':
        this.eventDate = event ? event + "T00:00:00" : '';          
        this.newDate = this.eventDate ? new Date(this.eventDate).toString().substr(0, 15) : '';
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
      console.log('this.api.pedidos :', this.api.pedidos);

      //filtra todos os campos em cada um 
      this.pedidos = this.api.pedidos.filter(a => 
        //filter date
        (a.data.toDate().toString().substr(0, 15).indexOf(this.newDate ? this.newDate : '') >= 0 )&&
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
          a.cliente.telefone?.toUpperCase().indexOf(this.eventDelivery ? this.eventDelivery : '') >= 0 ) &&
        //filter payment
        ( a.cliente.bandeira?.toUpperCase().indexOf(this.eventPayment ? this.eventPayment : '') >= 0 || 
          a.cliente.pagamento?.toUpperCase().indexOf(this.eventPayment ? this.eventPayment : '') >= 0 ) &&
        // //filter status
        a.status?.toUpperCase().indexOf(this.eventStatus ? this.eventStatus : '') >= 0

      );
    }
  }

  limparFiltros() {
    this.eventDate = '';
    this.newDate = '';
    this.eventTotal = '';
    this.eventDelivery = '';
    this.eventPayment = '';
    this.eventStatus = '';
    var dateControl = document.querySelector("#date");
    dateControl['value'] = '';
    this.carregar();

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
}
