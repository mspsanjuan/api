import { logAgendaCache } from '../core/log/schemas/logAgendaSipsCache';
/**
 * @deprecated
 * [DEPRECATED]
 */
export class LoggerAgendaCache {

    public static logAgenda(agendaId, msg, callback?): any {
        const newLogAgenda = new logAgendaCache({
            agenda: agendaId,
            error: msg,
            createdAt: new Date(),
        });
        newLogAgenda.save(callback);
        return newLogAgenda;
    }
}
