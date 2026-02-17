export const extractParams = (Req, type) => {
    switch (type) {
        case 'body':
            return Req.body;
        case 'query':
            return Req.query;
        case 'param':
            return Req.params;
        case 'header':
            return Req.headers;
        case 'cookie':
            return Req.cookies;
        case 'file':
            return Req.file;
        case 'files':
            return Req.files;
        default:
            throw new Error(`Unknown param type: ${type}`);
    }
};
