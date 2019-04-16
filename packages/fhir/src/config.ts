let DOMINIO = '';

export function initialize({ dominio }) {
    dominio = dominio;
}

export function getDominio() {
    return DOMINIO;
}

export function makeUrl(resource, id = null) {
    let url = `${DOMINIO}/${resource}`;
    if (id) {
        url += `/${id}`;
    }
}
