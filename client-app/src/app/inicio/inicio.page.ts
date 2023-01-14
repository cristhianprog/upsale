import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../providers/firebase';
import { LoadingController, ModalController } from '@ionic/angular';
import { ModalPage } from '../modal/modal.page'
import { diasSemana } from '../models/dias-semana';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
})
export class InicioPage implements OnInit {

  loaded: boolean = false;
  categorias = [];
  funcionamento: any;
  lojaAberta: boolean = false;

  constructor(
    public firebase: FirebaseService,
    public loadingController: LoadingController,
    public modalController: ModalController
  ) { }

  async ngOnInit() {
    const loading = await this.loadingController.create({
      message: 'Carregando...',
    });
    await loading.present();

    //Inicilizar e recuperar configs
    this.firebase.iniciar().then(async () => {
      await loading.dismiss();
      this.loaded = true;
    });

    //Inicilizar e recuperar configs
    this.firebase.config

    //Carregar categorias
    this.firebase.categorias()
      .then(async (data) => {
        this.categorias = data;
        let i = 0;
        for (i; i < this.categorias.length; i++) {
         let produtos = await this.firebase.produtosPorCategoria(this.categorias[i]['id']);
          //ordena produtos
          produtos.sort(function (a, b) {
            if (a.posicao > b.posicao) {
              return 1;
            }
            if (a.posicao < b.posicao) {
              return -1;
            }
            // a must be equal to b
            return 0;
          });
         this.categorias[i]['produtos'] = produtos;

        }
        console.log('this.categorias :', this.categorias);

        this.funcionamento = this.firebase.config.funcionamento;
        console.log('this.funcionamento :', this.funcionamento);
        this.verificaFuncionamentoLoja();

      })
  }

  verificaFuncionamentoLoja(){
    const diaNumero = new Date().getDay();
    const dataAgora = new Date();

    const diaNome = diasSemana[diaNumero];
    const horariosDia = this.funcionamento[diaNome]

    let dataInicial = new Date();
    let dataFinal = new Date();


    //Hora 1    
    const hora1InicialArray = horariosDia.hora1.horaInicio.split(':');
    dataInicial.setHours(hora1InicialArray[0], hora1InicialArray[1], 0);

    const hora1FinalArray = horariosDia.hora1.horaFinal.split(':');
    dataFinal.setHours(hora1FinalArray[0], hora1FinalArray[1], 0);

    if(dataAgora.getTime() > dataInicial.getTime() && dataAgora.getTime() < dataFinal.getTime()){
      this.lojaAberta = true
    }

    //Hora 2
    const hora2InicialArray = horariosDia.hora2.horaInicio.split(':');
    dataInicial.setHours(hora2InicialArray[0], hora2InicialArray[1], 0);

    const hora2FinalArray = horariosDia.hora2.horaFinal.split(':');
    dataFinal.setHours(hora2FinalArray[0], hora2FinalArray[1], 0);

    if(dataAgora.getTime() > dataInicial.getTime() && dataAgora.getTime() < dataFinal.getTime()){
      this.lojaAberta = true
    }

    //Hora 3
    const hora3InicialArray = horariosDia.hora3.horaInicio.split(':');
    dataInicial.setHours(hora3InicialArray[0], hora3InicialArray[1], 0);

    const hora3FinalArray = horariosDia.hora3.horaFinal.split(':');
    dataFinal.setHours(hora3FinalArray[0], hora3FinalArray[1], 0);

    if(dataAgora.getTime() > dataInicial.getTime() && dataAgora.getTime() < dataFinal.getTime()){
      this.lojaAberta = true
    }

    //Hora 4
    const hora4InicialArray = horariosDia.hora4.horaInicio.split(':');
    dataInicial.setHours(hora4InicialArray[0], hora4InicialArray[1], 0);

    const hora4FinalArray = horariosDia.hora4.horaFinal.split(':');
    dataFinal.setHours(hora4FinalArray[0], hora4FinalArray[1], 0);

    if(dataAgora.getTime() > dataInicial.getTime() && dataAgora.getTime() < dataFinal.getTime()){
      this.lojaAberta = true
    }


  }

  async detalhesDoProduto(p) {
    const modal = await this.modalController.create({
      component: ModalPage,
      componentProps: {
        "produto": p
      }
    });
    return await modal.present();
  }

}
