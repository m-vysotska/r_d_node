import { HttpException } from "../common";
import { container } from "../container";
import { isClass } from "../utils";
export const FiltersMiddleware = (Ctl, handler, filters) => {
    return (err, req, res, _next) => {
        if (err instanceof HttpException) {
            return res.status(err.status).json({ error: err.message });
        }
        if (filters.length > 0) {
            for (const FilterCtor of filters) {
                try {
                    const filterInstance = isClass(FilterCtor)
                        ? container.resolve(FilterCtor)
                        : FilterCtor;
                    if (filterInstance && typeof filterInstance.catch === 'function') {
                        filterInstance.catch(err, req, res);
                        return;
                    }
                }
                catch (e) {
                }
            }
        }
        err.stack = undefined;
        const status = err.status || 500;
        res.status(status).json({ error: err.message || 'Server error' });
    };
};
