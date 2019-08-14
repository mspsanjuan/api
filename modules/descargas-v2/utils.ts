export function streamToBase64(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => {
            chunks.push(chunk);
        });
        stream.on('end', () => {
            let result = Buffer.concat(chunks);
            return resolve(result.toString('base64'));
        });
        stream.on('error', (err) => {
            return reject(err);
        });
    });
}

export function ucaseFirst(titulo: string) {
    return titulo[0].toLocaleUpperCase() + titulo.slice(1).toLocaleLowerCase();
}
