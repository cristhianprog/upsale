import { Component } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: 'modal-img.component.html',
  styleUrls: ['modal-img.component.css'],
})
export class ModalComponent {
  mostrar: boolean = false;

  toggle () {
    this.mostrar = !this.mostrar;
  }
}