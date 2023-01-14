import { Component, OnInit } from "@angular/core";
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireStorage } from "@angular/fire/storage";
import { map, finalize } from "rxjs/operators";
import { Observable } from "rxjs";
import { RelatoriosService } from "src/app/relatorios.service";

@Component({
  selector: "app-categorias",
  templateUrl: "./categorias.component.html",
})
export class CategoriasComponent implements OnInit {
  categorias = [];
  novo: boolean = false;
  update: boolean = false;
  categoria = {
    titulo: null
  }
  color;


  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth,
    private storage: AngularFireStorage,
    private relatoriosService: RelatoriosService
  ) {
    this.relatoriosService.mostraInfoHeaderVar = false;

  }

  ngOnInit(): void {
    // this.afAuth.signInAnonymously();
    this.carregar()
  }

  newCategory(){
    this.novo = true;
    this.clearCategory();
  }

  clearCategory() {
    this.categoria = {
      titulo: null
    }
  }

  back() {
    this.novo = false;
    this.update = false;
    this.clearCategory();
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
  }

  excluir(id){
    if (confirm("Deseja realemnte excluir essa categoria?") == true) {
			this.afs.firestore.collection('categorias').doc(id).delete()
      .then(() => {
        this.carregar()
      })
		}
  }

  editar(id){
  this.update = true;
  this.afs.firestore.collection('categorias').doc(id).get()
    .then((d) => {
      let category = JSON.parse(JSON.stringify(d.data())) ;
      category.id = id;
      this.categoria = category;

    })
  }

  salvar() {
    if (this.categoria.titulo && this.novo) {
      this.categorias = [];
      this.afs.firestore.collection('categorias').add(this.categoria)
        .then(() => {
          this.novo = false;
          this.carregar()
          this.clearCategory();
          this.snackbar();

        })
    }else if (this.categoria.titulo && this.update){
      this.afs.firestore.collection('categorias').doc(this.categoria['id']).update(this.categoria)
        .then(()=>{
          this.update = false;
          this.carregar();
          this.clearCategory();
          this.snackbar();

        })
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
