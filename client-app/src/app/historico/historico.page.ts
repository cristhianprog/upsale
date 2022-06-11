import { Component, OnDestroy, OnInit } from '@angular/core';
import { FirebaseService } from '../../providers/firebase';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-historico',
  templateUrl: './historico.page.html',
  styleUrls: ['./historico.page.scss'],
})
export class HistoricoPage implements OnInit, OnDestroy {

  pedidos = [];
  intervalo: any;

  constructor(
    public firebase: FirebaseService,
    public modalController: ModalController
  ) { }

  fechar() {
    this.modalController.dismiss();
  }

  async ngOnInit() {
    //Recuperar detalhes dos pedidos
    this.ataulizarPedido();

    // this.intervalo = setInterval(() => {
    //   this.ataulizarPedido();
    // }, 5000);

        
  }

  ngOnDestroy(){
      clearInterval(this.intervalo);
  }

  ataulizarPedido(){
    let newPedidos = [];

    let items = JSON.parse(localStorage.getItem('historicoPedidos'));
    if (items) {
      var proms = [];
      items.forEach(async item => {
        var promise = this.firebase.pedido(item)
        
        promise.then((r) => {
          if(r){
            r.idProduto = item;
            newPedidos.push(r)
          }
        
        });

        proms.push(promise);

      });

      Promise.all(proms)
      .then(() => {
        // valores são lançados apenas quando todos os promises são resolvidos
        this.pedidos = newPedidos;

      });
    }
  }
}
