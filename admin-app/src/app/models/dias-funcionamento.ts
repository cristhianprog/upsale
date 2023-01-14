import { HorariosFuncionamento } from "./horarios-funcionamento";

const horarios = JSON.stringify(new HorariosFuncionamento());

export class DiasFuncionamento {
    domingo: Object = JSON.parse(horarios);
    segunda: Object = JSON.parse(horarios);
    terca: Object = JSON.parse(horarios);
    quarta: Object = JSON.parse(horarios);
    quinta: Object = JSON.parse(horarios);
    sexta: Object = JSON.parse(horarios);
    sabado: Object = JSON.parse(horarios);

}
