import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CarrinhoPageRoutingModule } from './carrinho-routing.module';

import { CarrinhoPage } from './carrinho.page';
import {NgxMaskIonicModule} from 'ngx-mask-ionic';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NgxMaskIonicModule,
    CarrinhoPageRoutingModule
  ],
  declarations: [CarrinhoPage]
})
export class CarrinhoPageModule {}
