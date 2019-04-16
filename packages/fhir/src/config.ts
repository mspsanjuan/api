let DOMINIO = '';

export function initialize({ dominio }) {
    DOMINIO = dominio;
}

export function getDominio() {
    return DOMINIO;
}

export function makeUrl(resource, id = null) {
    let url = `${DOMINIO}/${resource}`;
    if (id) {
        url += `/${id}`;
    }
    return url;
}
