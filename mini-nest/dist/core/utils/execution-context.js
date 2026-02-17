/** Реалізація для Express-раутів */
export class ExpressExecutionContext {
    targetClass;
    targetHandler;
    req;
    res;
    constructor(targetClass, targetHandler, req, res) {
        this.targetClass = targetClass;
        this.targetHandler = targetHandler;
        this.req = req;
        this.res = res;
    }
    getClass() {
        return this.targetClass;
    }
    getHandler() {
        return this.targetHandler;
    }
    switchToHttp() {
        return {
            getRequest: () => this.req,
            getResponse: () => this.res,
        };
    }
}
