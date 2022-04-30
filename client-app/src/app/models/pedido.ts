import { Cliente } from "./cliente";
import { Itens } from "./itens";
import { Produto } from "./produto";

export class Pedido extends Produto{
    cliente: Array<Cliente> = [];
    itens: Array<Itens>;
    data: string = "";
    status: string = "";
    total: number = 0;
}
