import {
    Client
} from 'elasticsearch';
import * as configPrivate from '../config.private';

export class ElasticSync {
    private connElastic;
    private INDEX = 'andes';
    private TYPE = 'paciente';

    constructor() {
        this.connElastic = new Client({
            host: configPrivate.hosts.elastic_main,
        });
    }

    public async sync(paciente) {
        const nuevoPac = JSON.parse(JSON.stringify(paciente));
        delete nuevoPac._id;
        delete nuevoPac.relaciones;
        delete nuevoPac.direccion;
        return await this._sync(paciente._id.toString(), nuevoPac);
    }

    private async _sync(id, data) {
        let body = await this.search({
            q: '_id:' + id
        });
        try {
            const hits = body.hits.hits;
            if (hits.length > 0) {
                return this.update(id, data);
            } else {
                return this.create(id, data);
            }
        } catch (error) {
            // tslint:disable-next-line:no-console
            console.error(error);
            return false;
        }
    }

    public async search(query) {
        let searchObj = {};
        if (query.q) {
            searchObj = query;
            searchObj['index'] = this.INDEX;
        } else {
            searchObj = {
                index: this.INDEX,
                body: query
            };
        }
        try {
            return await this.connElastic.search(searchObj);
        } catch (error) {
            // tslint:disable-next-line:no-console
            console.error(error);
            return false;
        }
    }

    public searchMultipleFields(query) {
        let searchObj = {};
        if (query) {
            let must = [];
            const terms = {};

            for (let key in query) {
                const match = {};
                if (key === 'claveBlocking') {
                    terms[key] = query[key].map(s => s.toLowerCase());
                    must.push({ terms });
                } else {
                    match[key] = query[key];
                    must.push({ match });
                }
            }
            searchObj = {
                index: this.INDEX,
                size: 1000,
                body: {
                    query: {
                        bool: {
                            must
                        }
                    }
                }
            };
        }
        return this.connElastic.search(searchObj);
    }

    public async create(id, data) {
        try {
            return await this.connElastic.create({
                index: this.INDEX,
                type: this.TYPE,
                id,
                body: data,
                refresh: true
            });
        } catch (error) {
            // tslint:disable-next-line:no-console
            console.error(error);
            return false;
        }
    }

    public async update(id, data) {
        try {
            await this.delete(id);
            return await this.create(id, data);
        } catch (error) {
            // tslint:disable-next-line:no-console
            console.error(error);
            return false;
        }
    }

    public delete(id) {
        return new Promise((resolve, reject) => {
            this.connElastic.delete({
                index: this.INDEX,
                type: this.TYPE,
                refresh: true,
                id
            }, (error, response) => {
                if (error) {
                    reject(error);
                }
                resolve(true);
            });
        });
    }

    public async scroll(scrollCfg) {
        return await this.connElastic.scroll(scrollCfg);
    }

    public async searchScroll() {
        return await this.connElastic.search({
            index: this.INDEX,
            type: this.TYPE,
            scroll: '1m',
            size: '100',
            body: {
                query: {
                    match_all: {}
                },
                _source: false
            }
        });
    }
}
