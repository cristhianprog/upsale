import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireStorage } from "@angular/fire/storage";
import { map, finalize } from "rxjs/operators";
import { Observable } from "rxjs";
import { ConfiguracaoAdministracao } from "src/app/models/config-admin";
import { HttpClient } from '@angular/common/http';
import { bairrosPorCidades } from "src/assets/cep/bairrosPorCidades";
import { Bairro } from "src/app/models/bairro";
import { Endereco } from "src/app/models/endereco";


@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html"
})

export class DashboardComponent implements OnInit {

  pedidos = [];
  config: ConfiguracaoAdministracao = new ConfiguracaoAdministracao;
  configOriginal: ConfiguracaoAdministracao = new ConfiguracaoAdministracao;
  // config = {
  //   nome: null,
  //   whatsapp: null,
  //   color: null,
  //   logo: null,
  //   banner: null,
  //   bairros: [],
  //   endereco: {
  //     cep: "",
  //     rua: "",
  //     bairro: "",
  //     cidade: "",
  //     estado: "",
  //     numero: ""
  //   } 
  // };
  downloadURL: Observable<string>;
  selectedFile: File = null;
  fb;
  downloadURL2: Observable<string>;
  selectedFile2: File = null;
  fb2;
  erroBairos: boolean = false;
  bairros: Array<Bairro>;

  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
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
      let dataConfig = d.data();
      if(!dataConfig.endereco){
        dataConfig.endereco = new Endereco();
      }
      this.config = Object.assign({}, new ConfiguracaoAdministracao , JSON.parse(JSON.stringify(dataConfig)));
      this.configOriginal = JSON.parse(JSON.stringify(dataConfig));
      this.carregaBairros();
          
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
    })
  }
  
  carregaBairros(){

    if(!this.config.bairros){
      if(bairrosPorCidades[this.config.endereco['cidade']]){
        this.bairros = bairrosPorCidades[this.config.endereco['cidade']]
        this.erroBairos = false;
        this.cdr.detectChanges()

      }else{
        this.erroBairos = true;
      }
    }else{
      if(this.config.endereco['cep'] === this.configOriginal.endereco['cep']){
        this.bairros = this.configOriginal.bairros;
        this.erroBairos = false;

      }else{
        if(bairrosPorCidades[this.config.endereco['cidade']]){
          this.bairros = bairrosPorCidades[this.config.endereco['cidade']]
          this.erroBairos = false;
          this.cdr.detectChanges()
  
        }else{
          this.erroBairos = true;
        }
      }

    }
  }

  alteraBairrosGratis(): Promise<void>{
    console.log('this.bairros :', this.bairros);

    return new Promise<void>((resolve) => {
      this.bairros.forEach((bairro, idx) => {
        if(bairro.valor){
          if(bairro.valor.indexOf('.') !== -1){
            this.bairros[idx].valor = bairro.valor.replace(".",",");
          }
        }else{
          this.bairros[idx].valor = "0";
        }
      })
      this.config['bairros'] = this.bairros;
      resolve(null);
    });
  
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
    this.alteraBairrosGratis().then(resp => {
      this.afs.firestore.collection('config').doc('config').update(this.config)
      .then(()=> {
        this.snackbar();
      })
     
    });
   
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

  calcularCep(event){
    const cep = event.replace(/[-]/g,"");
    if(cep.length >= 8){
      this.http.get('https://viacep.com.br/ws/' + cep + '/json/').subscribe((r) => {
        this.config.endereco['bairro'] = r['bairro'];
        this.config.endereco['rua'] = r['logradouro'];
        this.config.endereco['cidade'] = r['localidade'];
        this.config.endereco['estado'] = r['uf'];
        this.carregaBairros();
      })
    }else{
      this.carregaBairros();
    }
  }
}
