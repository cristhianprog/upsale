import { Component, OnInit } from "@angular/core";
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireStorage } from "@angular/fire/storage";
import { map, finalize } from "rxjs/operators";
import { Observable } from "rxjs";


@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
})
export class DashboardComponent implements OnInit {

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

  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth,
    private storage: AngularFireStorage
  ) {

  }

  ngOnInit() {
    // this.afAuth.signInAnonymously().then(() => {
      this.carregar()
    // })
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
          // if(url.state == 'success'){
          //   this.fb = url;
          //   this.config.logo = this.fb;
          // }
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
                this.config.banner = this.fb2;
              }
            });
          })
        )
        .subscribe(url => {
          if (url) {
            // if(url.state == 'success'){
            //   this.fb2 = url;
            //   this.config.banner = this.fb2;
            // }
            console.log(url);
          }
        });
    }
  

  carregar() {
    this.afs.firestore.collection('config').doc('config').get()
    .then((d) => {
      this.config = JSON.parse(JSON.stringify(d.data())) ;
      console.log('this.config :', this.config);
    })

    //Listar pedidos
    this.afs.firestore.collection('pedidos').orderBy('data', 'desc').get()
    .then((r) => {
      let pedidos = [];
      r.forEach((rr) => {
        let obj = rr.data();
        obj['id'] = rr.id;
        pedidos.push(obj);
      });

      this.pedidos = pedidos;
      console.log(this.pedidos)
    })
  }

  aceitar(id){
    this.afs.firestore.collection('pedidos').doc(id).update({status: 'preparando'})
    .then(() => {
      this.carregar()
    })
  }

  recusar(id){
    this.afs.firestore.collection('pedidos').doc(id).update({status: 'recusado'})
    .then(() => {
      this.carregar()
    })
  }

  saiuEntrega(id){
    this.afs.firestore.collection('pedidos').doc(id).update({status: 'saiu para entrega'})
    .then(() => {
      this.carregar()
    })
  }

  finalizado(id){
    this.afs.firestore.collection('pedidos').doc(id).update({status: 'entregue'})
    .then(() => {
      this.carregar()
    })
  }

  salvar(){
    this.afs.firestore.collection('config').doc('config').update(this.config)
    .then(()=> {
      this.snackbar();
    })
    console.log('this.config :', this.config);
  }

  snackbar() {
    // Get the snackbar DIV
    var x = document.getElementById("snackbar")

    // Add the "show" class to DIV
    x.className = "show";
    console.log('x.className :', x.className);

    // After 3 seconds, remove the show class from DIV
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
  }
}
