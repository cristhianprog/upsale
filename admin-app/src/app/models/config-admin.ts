import { Obj } from "@popperjs/core";
import { Bairro } from "./bairro";
import { DiasFuncionamento } from "./dias-funcionamento";
import { Endereco } from "./endereco"

const diasFunc = JSON.stringify(new DiasFuncionamento());
export class ConfiguracaoAdministracao {
    nome: string = "";
    whatsapp: string = "";
    color: string = "";
    logo: string = "";
    banner: string = "";
    bairros: Array<Bairro>;
    pix: string = "";
    endereco: Object = new Endereco();
    funcionamento: Object = JSON.parse(diasFunc);
}
