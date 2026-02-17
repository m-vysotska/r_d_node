import { getInterceptors } from "../decorators";
import { container } from "../container";
import { isClass } from "../utils";
import { ExpressExecutionContext } from "../utils";
export const InterceptorsMiddleware = (Ctl, handler, globalInterceptors = [], actualHandler) => {
    return async (req, res, next) => {
        const interceptors = getInterceptors(handler, Ctl, globalInterceptors);
        if (interceptors.length === 0) {
            return actualHandler(req, res, next);
        }
        const ctx = new ExpressExecutionContext(Ctl, handler, req, res);
        let index = 0;
        const callNext = async () => {
            if (index >= interceptors.length) {
                return actualHandler(req, res, next);
            }
            const InterceptorCtor = interceptors[index++];
            const interceptorInstance = isClass(InterceptorCtor)
                ? container.resolve(InterceptorCtor)
                : InterceptorCtor;
            return interceptorInstance.intercept(ctx, callNext);
        };
        try {
            await callNext();
        }
        catch (error) {
            next(error);
        }
    };
};
