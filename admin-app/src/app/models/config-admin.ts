import { Bairro } from "./bairro";
import { Endereco } from "./endereco"

export class ConfiguracaoAdministracao {
    nome: string = "";
    whatsapp: string = "";
    color: string = "";
    logo: string = "";
    banner: string = "";
    bairros: Array<Bairro>;
    pix: string = "";
    endereco: Object = new Endereco();     

}