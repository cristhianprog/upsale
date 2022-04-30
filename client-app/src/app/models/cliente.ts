import { TipoPagamento } from "./pagamentos";

export class Cliente {
    bairro: string = "";
    cep: string = "";
    cidade: string = "";
    complemento: string = "";
    nome: string = "";
    numero: string = "";
    pagamentos: Array<[]> = [
        JSON.parse(JSON.stringify(new TipoPagamento(false, 'Dinheiro'))),
        JSON.parse(JSON.stringify(new TipoPagamento(false, 'Débito'))),
        JSON.parse(JSON.stringify(new TipoPagamento(false, 'Crédito')))
    ];
    pagamento: string;
    bandeira: string;
    rua: string = "";
    troco: string = "";
}
