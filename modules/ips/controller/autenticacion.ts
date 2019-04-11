import * as configPrivate from '../../../config.private';
import * as jwt from 'jsonwebtoken';

export class AutenticacionFederador {

    /**
     *  TTL JWT Token
     *  @var expiresIn {number}
     *
     * @memberOf Auth
     */

    static expiresIn = 60 * 15 * 1000;  /* 15 min */
    static issuer = 'http://neuquen.gob.ar';
    static audience = 'www.bussalud.gov.ar/auth/v1';
    static subject = '202910';

    /**
        * Genera un token del federador
        *
        */
    static generacionTokenAut(): any {
        // Crea el token con los datos de sesión
        const token = {
            jti: 'qwertyuiopasdfghjklzxcvbnm123456',
            name: 'Subsecretaria de salud',
            role: 'Desarrollador',
            ident: 'www.bussalud.gov.ar/usuarios|20182'
        };
        let t = jwt.sign(token, configPrivate.auth.jwtKey, { expiresIn: this.expiresIn, issuer: this.issuer, audience: this.audience, subject: this.subject });
        console.log(t);
        return t;
    }

}

