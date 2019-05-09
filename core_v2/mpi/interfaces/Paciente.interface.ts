import * as moment from 'moment';
import { Schema, Document, Types } from 'mongoose';
import { IFinanciador } from './Financiador.interface';
import { IParentesco } from './Parentesco.interface';
import { IContacto, IContactoDoc, IDireccion, IDireccionDoc } from '../../../shared/interface';

export interface ICarpetaEfector {
    organizacion: any;
    nroCarpeta: String;
}

export interface INota {
    fecha: Date | moment.Moment;
    nota: String;
    destacada: Boolean;
}

export interface IIdentificador {
    entidad: String;
    valor: String;
}

export interface IRelacion {
    relacion: IParentesco;
    referencia: Schema.Types.ObjectId;
    financiador: String;
    nombre: String;
    apellido: String;
    documento: String;
    foto: String;
}

export interface IPaciente {
    nombre: String;
    apellido: String;
    fechaNacimiento: Date | moment.Moment;
    sexo: String;
    genero: String;
    estado: String;
    documento?: String;
    identificadores?: IIdentificador[];
    certificadoRenaper?: String;
    cuil?: String;
    activo?: Boolean;
    alias?: String;
    fechaFallecimiento?: Date | moment.Moment;
    estadoCivil?: String;
    foto?: String;
    fotoMobile?: String;
    nacionalidad?: String;
    tipoIdentificacion?: String;
    numeroIdentificacion?: String;
    claveBlocking?: String[];
    entidadesValidadoras?: String[];
    reportarError?: Boolean;
    notaError?: String;
    carpetaEfectores?: ICarpetaEfector[];
    notas?: INota[];
    financiador?: IFinanciador[];
    relaciones?: IRelacion[];
    contacto?: IContacto[];
    direccion?: IDireccion[];
}

export interface IPacienteDoc extends Document, IPaciente {
    contacto?: Types.DocumentArray<IContactoDoc>;
    direccion?: Types.DocumentArray<IDireccionDoc>;

    /**
     * Chequea que algún elemento en fields sea un campo indexable en ElasticSearch
     * @param {Array} fields Array de elementos a verificar
     */
    sincroniza(fields: string[]): Boolean;
}
