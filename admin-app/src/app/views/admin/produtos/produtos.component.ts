import { Component, OnInit } from "@angular/core";
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireStorage } from "@angular/fire/storage";
import { map, finalize } from "rxjs/operators";
import { Observable } from "rxjs";

@Component({
  selector: "app-produtos",
  templateUrl: "./produtos.component.html",
})
export class ProdutosComponent implements OnInit {
  produtos = [];
  novo: boolean = false;
  update: boolean = false;
  produto = {
    titulo: null,
    preco: null,
    adicionais: [],
    variacoes: [],
    acompanhamentos: [],
    qtdAcompanhamentos: null,
    imagem: null,
    categoria: null,
    descricao: null,
    serve: null
  }
  title = "cloudsSorage";
  selectedFile: File = null;
  fb;
  downloadURL: Observable<string>;
  opcional: string = null;
  acompanhamento: string = null;
  adicional = {
    titulo: null,
    preco: null
  };
  categorias = [];
  color;

  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth,
    private storage: AngularFireStorage
  ) { }

  ngOnInit(): void {
    // this.afAuth.signInAnonymously();

    console.log(' produtos :',  this.produtos);
    this.carregar()
  }

  //Upload de imagem
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
              this.produto.imagem = this.fb;
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

  carregar() {
    //Listar categorias
    this.afs.firestore.collection('categorias').get()
    .then((r) => {
      let categorias = [];
      r.forEach((rr) => {
        let obj = rr.data();
        obj['id'] = rr.id;
        categorias.push(obj);
      });

      this.categorias = categorias;
      // console.log(this.categorias);
    })

    //Listar produtos
    this.afs.firestore.collection('produtos').get()
      .then((r) => {
        let produtos = [];
        r.forEach((rr) => {
          let obj = rr.data();
          obj['id'] = rr.id;
          produtos.push(obj);
        });

        this.produtos = produtos;
        // console.log(this.produtos);
      })
  }

  //Adicionar acompanhamento
  addAcompanhamento() {
    if (this.acompanhamento != '') {
      this.produto.acompanhamentos.push({
        titulo: this.acompanhamento,
        checked: false
      });
      this.acompanhamento = '';
    }
  }

  removerAcompanhamento(i) {
    this.produto.acompanhamentos.splice(i, 1);
  }

  

  //Adicionar opcional
  addOpcional() {
    if (this.opcional != '') {
      this.produto.variacoes.push({
        titulo: this.opcional,
        checked: false
      });
      this.opcional = '';
    }
  }

  editar(id){
    this.update = true;
    this.afs.firestore.collection('produtos').doc(id).get()
      .then((d) => {
        this.produto = JSON.parse(JSON.stringify(d.data())) ;
        this.produto['id'] = id;
  
      })
    }

  excluir(id) {
    if (confirm("Deseja realemnte excluir esse produto?") == true) {
      this.afs.firestore.collection('produtos').doc(id).delete()
        .then(() => {
          this.carregar()
        })
    }
  }

  removerOpcional(i) {
    this.produto.variacoes.splice(i, 1);
  }

  back() {
    this.novo = false; 
    this.update = false;
    this.clearProduto();
  }

  //Adicionar adicional
  addAdicional() {
    if (this.adicional.titulo != '' && this.adicional.preco > 0) {
      this.produto.adicionais.push({
        titulo: this.adicional.titulo,
        preco: this.adicional.preco,
        checked: false
      });
      this.adicional.preco = '';
      this.adicional.titulo = '';
    }else{

      if(this.adicional.titulo != '')
        alert('Informe um preço para adicionar o item');
      else
       alert('Informe um nome para adicionar o item');

    }
  }

  removerAdicional(i) {
    this.produto.adicionais.splice(i, 1);
  }

  clearProduto() {
    this.produto = {
      titulo: null,
      preco: null,
      adicionais: [],
      variacoes: [],
      acompanhamentos: [],
      qtdAcompanhamentos: null,
      imagem: null,
      categoria: null,
      descricao: null,
      serve: null,
    }
  }
  

  salvar() {
    if (this.produto.titulo &&  
      this.produto.preco && this.produto.categoria && this.novo) {

      this.afs.firestore.collection('produtos').add(this.produto)
        .then(() => {
          this.carregar();
          this.novo = false;
          this.clearProduto()
          this.snackbar();
        })
    }else if (this.produto.titulo &&
        this.produto.preco && this.produto.categoria && this.update) {
      this.afs.firestore.collection('produtos').doc(this.produto['id']).update(this.produto)
        .then(()=>{
          this.update = false;
          this.carregar();
          this.clearProduto();
          this.snackbar();

      })

    }
    else {
      let produto = this.produto;
      let obrigatorios = ['titulo', 'preco', 'categoria'];
      let mostrouAlerta:boolean = false;
   
      Object.keys(this.produto).forEach(function(item){
        if(!produto[item] && obrigatorios.includes(item) && !mostrouAlerta){
          if(item == "titulo")
            item = "nome";

          alert('Por favor, preencha o campo ' + item.toUpperCase());
          mostrouAlerta = true;
          return;
        }
        
       });
      
    }
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
