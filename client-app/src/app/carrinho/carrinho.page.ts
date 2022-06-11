import { Component, OnInit } from '@angular/core';
import { ModalController, ToastController, AlertController, LoadingController } from '@ionic/angular';
import { FirebaseService } from '../../providers/firebase'
import { HttpClient } from '@angular/common/http';
import { Cliente } from '../models/cliente';
import { map, finalize } from "rxjs/operators";
import { AngularFirestore } from '@angular/fire/firestore';
import { ConfigTaxa } from '../models/configTaxa';
import { AngularFireStorage } from "@angular/fire/storage";
import { Observable } from 'rxjs';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

@Component({
  selector: 'app-carrinho',
  templateUrl: './carrinho.page.html',
  styleUrls: ['./carrinho.page.scss'],
})
export class CarrinhoPage implements OnInit {

  total = 0;
  step = 0;
  cliente: Cliente = new Cliente;
  config;
  bairrosEntrega: Array<any>;
  startPosition: any;
  originPosition: string;
  destinationPosition: string;
  valorTaxa: number = 0;
  configTaxa: ConfigTaxa = new ConfigTaxa;
  veirificaTaxa: any;
  downloadURL: Observable<string>;
  fbUrlImagem;
  comprovanteImagem: any;
  
  constructor(
    public modalController: ModalController,
    public firebase: FirebaseService,
    public toastController: ToastController,
    public alertController: AlertController,
    private http: HttpClient,
    private storage: AngularFireStorage,
    private afs: AngularFirestore,
    public loadingController: LoadingController
  ) { 

    //Total
    this.firebase.carrinho.forEach((item) => {
      this.total = this.total + (item.preco * item.quantidade);
    })

    this.afs.firestore.collection('config').doc('config').get().then((r) => {
      //Atribuir a variavel global (para recuperarmos de outras paginas)
      
      this.config = r.data();

      if(!this.config.pix?.length){
        let arrayPagamentos = this.cliente.pagamentos.filter(p => p['titulo'] !== "Pix");
        this.cliente.pagamentos = arrayPagamentos;

      }
     
     
    })
  }

  ngOnInit() {
    
  }

  deixarApenasUmMarcado(index) {
    let i = 0;
    for (i; i < this.cliente.pagamentos.length; i++) {
      if(i != index){
        this.cliente.pagamentos[i]['checked'] = false;
        
      }else{
        this.cliente.pagamentos[i]['checked'] = true;
        this.cliente.pagamento = this.cliente.pagamentos[i]['titulo']
      }
    }
  }
  
  fechar() {
    if(this.step > 0){
      this.step = 0;
    }
    else {
      this.modalController.dismiss();
    }
  }

  async remover(i) {
    const alert = await this.alertController.create({
      header: 'Quer mesmo remover esse item?',
      message: 'Essa ação não pode ser desfeita.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
          }
        }, {
          text: 'Remover',
          handler: () => {
            this.firebase.carrinho.splice(i, 1);

            //Atualizar total
            this.firebase.carrinho.forEach((item) => {
              this.total = this.total + (item.preco * item.quantidade) + this.valorTaxa;
            })
          }
        }
      ]
    });

    await alert.present();
  }

  finalizar(){
    this.step = 1;
  }

  calcularCep(event): void{
    const cep = event.replace(/[-]/g,"");
    if(cep.length >= 8){
      this.http.get('https://viacep.com.br/ws/' + this.cliente.cep + '/json/').subscribe((r) => {
        this.cliente.bairro = r['bairro'];
        this.cliente.rua = r['logradouro'];
        this.cliente.cidade = r['localidade'];
        this.cliente.estado = r['uf'];
        this.calcularTaxaEntrega();
      })
    }
  }

  calcularTaxaEntrega(): void{
    let bairroTaxaEntrega = this.config.bairros.filter(b => b.nome === this.cliente.bairro && b.checked);

    if(bairroTaxaEntrega.length ){
      if(this.valorTaxa !== +bairroTaxaEntrega[0].valor || this.valorTaxa === 0){     
        if(+bairroTaxaEntrega[0].valor > 0){
          //se for cobrado a taxa
          this.valorTaxa = +bairroTaxaEntrega[0].valor;
          this.total = this.total + this.valorTaxa;
          this.veirificaTaxa = this.configTaxa.TaxaDeEntrga;
        }else{
          //se for entrega gratis
          this.total = this.total - this.valorTaxa;
          this.valorTaxa = +bairroTaxaEntrega[0].valor;
          this.veirificaTaxa = this.configTaxa.entrgaGratis;
        }
        
      }
           
    }else{
      //se nao possuir cobertura
      this.total = this.total - this.valorTaxa;
      this.valorTaxa = 0;
      this.veirificaTaxa = this.configTaxa.naoPossuiCobertura;
    }
  }

  copiaTexto(){
    var dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = this.config.pix;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);

    this.toasAlert('Chave pix copiada!')
    
  }

  async toasAlert(mensagem){
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 2000
    });
    toast.present();
  }

  salvaImage(event, dateNowId): Promise<any>{
    const file = event.target.files[0];
    const filePath = `imagens/comprovantes-pix/${dateNowId}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(`imagens/comprovantes-pix/${dateNowId}`, file);
    return new Promise<void>((resolve) => {
       task
      .snapshotChanges()
      .pipe(
        finalize(() => {
          this.downloadURL = fileRef.getDownloadURL();
          this.downloadURL.subscribe(url => {
            //Salva a URL gerada para o arquivo
            if (url) {
              this.fbUrlImagem = url;
              //this.config.logo = this.fb;
              resolve(null)
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
    })
  }

  //Finalizar pedido
  async enviar(){

    let validaPagamento: boolean = false;
    let validaBandeira: boolean = true;
    let validaComprovantePix: boolean = true;
    let validaCelular: boolean = true;

    const pagamentoSelec = this.cliente.pagamentos.filter(pag => pag['checked'] === true);

    //verifica se selecionou uma forma de pagamento
    if(pagamentoSelec.length > 0){
      validaPagamento = true;

      //verifica se a bandeira é obrigatoria
      if((pagamentoSelec[0]['titulo'] === "Débito" || pagamentoSelec[0]['titulo'] === "Crédito") && this.cliente.bandeira === ""){
        validaBandeira = false;

      }else{
        validaBandeira = true;
        
      }

      //verifica se inseriu uma imagem
      if(pagamentoSelec[0]['titulo'] === "Pix" && (!this.comprovanteImagem || !this.comprovanteImagem.target?.files[0])){
        validaComprovantePix = false;
      }

    }else{
      validaPagamento = false;
      validaBandeira = true;
      validaComprovantePix = true;
    }

    if(this.cliente.celular.length < 15){
      validaCelular = false;
    }

    if(this.cliente.nome && this.cliente.cep && this.cliente.numero && validaCelular && this.veirificaTaxa.id != 1 && validaPagamento && validaBandeira && validaComprovantePix){
      
      const dateNowId = this.cliente.celular.replace(/[^\w\s]/gi, '').replace(" ", "") + '-' + Date.now();

      if(pagamentoSelec[0]['titulo'] === "Pix"){
        const alert = await this.alertController.create({
          header: 'Carregando comprovante...'
        });
    
        await alert.present();
        //insere a imagem no Storage
        await this.salvaImage(this.comprovanteImagem, dateNowId).then(()=> {
          //remove alerta quando terminar de carregar a imagem
          alert.remove();
        });
      }

      const alert = await this.alertController.create({
        header: 'Deseja finalizar o pedido?',
        message: 'O estabelecimento receberá sua solicitação.',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            handler: () => {
            }
          }, {
            text: 'Fazer pedido',
            handler: async () => {
              const loading = await this.loadingController.create({
                message: 'Finalizando...',
              });
              await loading.present();

              let pedido = {
                cliente: JSON.parse(JSON.stringify(this.cliente)), // TODO: verificar por que nao aceita o tipo Cliente
                itens: this.firebase.carrinho,
                status: 'aguardando',
                data: new Date(),
                total: this.total,
                taxaDeEntrega: this.valorTaxa,
                comprovantePix: this.fbUrlImagem ? this.fbUrlImagem : ""

              };
              //Enviar para o firebase
              this.firebase.pedir(pedido)
              .then(async (id) => {
            
                //Adicionar no localstorage
                let historicoPedidos = JSON.parse(localStorage.getItem('historicoPedidos'));
                if(!historicoPedidos) {
                  historicoPedidos = [];
                  historicoPedidos.push(id);
                  localStorage.setItem('historicoPedidos', JSON.stringify(historicoPedidos));
                }
                else {
                  historicoPedidos.push(id);
                  localStorage.setItem('historicoPedidos', JSON.stringify(historicoPedidos));
                }

                const toast = await this.toastController.create({
                  message: 'Tudo certo! Você pode acompanhar tudo na aba Meus Pedidos',
                  duration: 2000
                });
                toast.present();
            
                //Voltar para home
                await loading.dismiss();
                this.firebase.carrinho = []
                this.step = 0;
                this.fechar();
              })
              .catch(async () => {
                await loading.dismiss();

                const alert = await this.alertController.create({
                  header: 'Ops!',
                  message: 'Algo deu errado. Por favor, tente novamente.',
                  buttons: [
                    {
                      text: 'Voltar',
                      role: 'cancel',
                      handler: () => {
                      }
                    }
                  ]
                });
            
                await alert.present();
              })
              
            }
          }
        ]
      });
  
      await alert.present();

    }
    else {
      let msgTexto = 'Por favor, preencha todos os campos.';

      if(!this.cliente.nome){//mensagem para preencher nome
        msgTexto = "Por favor, preencha o Nome.";

      }else if(!validaCelular){//mensagem para preencher telefone
        msgTexto = 'Por favor, preencha o Celular.';

      }else if(this.veirificaTaxa?.id === 1 || !this.cliente.cep){//mensagem para preencher cep valido
        msgTexto = 'Por favor, preencha um CEP com cobertura de entrega.';

      }else if(!this.cliente.numero){// mensagem para selecionar pagamento
        msgTexto = 'Por favor, Por favor, preencha o Número.';

      }else if(!validaPagamento){// mensagem para selecionar pagamento
        msgTexto = 'Por favor, selecione uma forma de pagamento.';

      }else if(!validaBandeira){// mensagem para preecher cartao
        msgTexto = 'Por favor, preencha a bandeira do cartão.';

      }else if(!validaComprovantePix){//menagem comprovante nao inserido
        msgTexto = 'Por favor, insira o comporvante do pagamento por Pix.';
      }

      const alert = await this.alertController.create({
        header: 'Ops!',
        message: msgTexto,
        buttons: [
          {
            text: 'Entendi',
            role: 'cancel',
            handler: () => {
            }
          }
        ]
      });
  
      await alert.present();
    }
  }
}
