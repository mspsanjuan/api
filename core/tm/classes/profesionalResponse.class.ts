import { IProfesionalResponse } from '../interfaces/interfaceProfesional';

export class ProfesionalBasicResponse implements IProfesionalResponse {
    id: string;
    nombre?: string;
    apellido?: string;
    sexo?: string;
    documento?: string;
    nacionalidad?: string;
    profesiones?: string;
    constructor(profesional) {
        this.id = profesional.id;
        this.nombre = profesional.nombre;
        this.apellido = profesional.apellido;
        this.sexo = profesional.sexo;
        this.documento = profesional.documento;
        this.nacionalidad = profesional.nacionalidad;
        this.profesiones = profesional.profesiones;
    }
}
