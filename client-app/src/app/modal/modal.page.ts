import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalController, NavParams, ToastController } from '@ionic/angular';
import { FirebaseService } from '../../providers/firebase';
import { CarrinhoPage } from '../carrinho/carrinho.page';
import { Produto } from '../models/produto';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.page.html',
  styleUrls: ['./modal.page.scss'],
})
export class ModalPage implements OnInit {

  produto: Produto;
  novoProduto: Produto;
  quantidade = 1;
  obs: string = '';
  disabledAcompanhamento: boolean = false;

  constructor(
    public modalController: ModalController,
    public firebase: FirebaseService,
    private navParams: NavParams,
    public toastController: ToastController
  ) {}

  ngOnInit() {

    this.novoProduto = JSON.parse(JSON.stringify(this.navParams.get('produto')));
    // console.log('this.novoProduto :', this.novoProduto.id);

    this.firebase.produto(this.novoProduto.id).then((respProduto)=>{
      // console.log('respProduto :', respProduto);
      if(respProduto){
        this.produto = respProduto;
        this.novoProduto = JSON.parse(JSON.stringify(this.produto));
      }
      
    });
  }

  fechar() {
    this.modalController.dismiss();
  
  }

  async adicionarAoCarrinho() {
    //Validar se precisa selecionar uma opção
    if (this.novoProduto.variacoes.length > 0) {
      // console.log('this.novoProduto :', this.novoProduto);
      let itemChecked = false;
      this.novoProduto.variacoes.forEach(item => {
        if (item.checked) {
          itemChecked = true;
        }
      });

      if (itemChecked) {
        this.finalizarAdicao();
      }
      else {
        const toast = await this.toastController.create({
          message: 'Ops! Você precisa selecionar uma opção antes de continuar',
          duration: 2000
        });
        toast.present();
      }
    }

    else {
      this.finalizarAdicao()
    }


  }

  async finalizarAdicao() {
    this.novoProduto['quantidade'] = this.quantidade;
    this.novoProduto['obs'] = this.obs;
    this.firebase.carrinho.push(this.novoProduto);
    this.fechar();

    const toast = await this.toastController.create({
      message: this.produto.titulo + ' foi adicionado no seu carrinho!',
      duration: 2000,
      position: 'top'
    });
    toast.present();

    const modal = await this.modalController.create({
      component: CarrinhoPage,
    });
    return await modal.present();
  }

  adicionar() {
    this.quantidade = this.quantidade + 1
  }

  remover() {
    if (this.quantidade > 1) {
      this.quantidade = this.quantidade - 1
    }
  }

  deixarApenasUmMarcado(index) {
  // console.log('index :', index);
  // console.log('this.novoProduto.variacoes', this.novoProduto.variacoes)
    let i = 0;
    for (i; i < this.novoProduto.variacoes.length; i++) {
      if(i != index){
        this.novoProduto.variacoes[i].checked = false;
      }
    }
  }

  contarAcompSelecionados(){
    const qtdAcompanhamento = this.novoProduto.acompanhamentos.filter(ac => ac.checked === true).length;
    this.disabledAcompanhamento = qtdAcompanhamento >= this.novoProduto.qtdAcompanhamentos ? true : false;
   
  }


  recalcularTotal(i){
    if(this.novoProduto.adicionais[i].checked){
      this.novoProduto.preco = this.novoProduto.preco + this.produto.adicionais[i].preco
    }
    else {
      this.novoProduto.preco = this.novoProduto.preco - this.produto.adicionais[i].preco
    }
  }

}
