import { Component, OnInit } from "@angular/core";
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router'; 
import firebase from 'firebase/app'

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
})
export class LoginComponent implements OnInit {

  usuario = {
    email: null,
    senha: null
  }

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router
  ) {

  }

  ngOnInit(): void {
  }

  fazerLogin() {
    console.log(this.usuario)
    //Logar no autentication
    this.afAuth.signInWithEmailAndPassword(this.usuario.email, this.usuario.senha).then(() => {
      this.afAuth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
      console.log('logado')

      //Verificar se está cadastrado como admin
      this.afs.firestore.collection('admins').where('email', '==', this.usuario.email)
        .get()
        .then((r) => {
        console.log('r :', r);
          let array = [];
          r.forEach((rr) => {
            array.push(rr.data());
          });
          
          if (array.length > 0) {
            

            //Acesso liberado
            this.router.navigate(['admin/dashboard']);
          }
          else {
            // TODO: Arrumar para bloquear acesso
            this.router.navigate(['admin/dashboard']);
            //alert('Ops! Acesso não liberado00000');
          }
        })
    })
    .catch((err) => {
    console.log('err :', err);

      let msgError = '';

      if(err.code === "auth/user-not-found"){
        msgError = "Usuário não encontrado!";

      }else if(err.code === "auth/wrong-password"){
        msgError = "Senha incorreta!";

      }else{
        msgError = "Ops! Algo deu errado!"
      }

      alert(msgError);

    })
  }
}
