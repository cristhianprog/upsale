import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { RelatoriosService } from "src/app/relatorios.service";

@Component({
  selector: "app-relatorios",
  templateUrl: "./relatorios.component.html",
})
export class RelatoriosComponent implements OnInit {

  constructor( private relatoriosService: RelatoriosService ) {

    //Mostra as informaçoes no header
    this.relatoriosService.mostraInfoHeaderVar = true;



  }

  ngOnInit(): void {



  }

  teste(value){

    console.log(' teste:', value);
  }
}
