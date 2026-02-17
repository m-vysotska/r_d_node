import { extractParams, get } from "../utils";
import { runPipes, getParamPipes } from "../decorators";
class PipeError extends Error {
    constructor(message) {
        super(message);
        this.name = "PipeError";
    }
}
const getHandlerArgs = async (Ctl, handler, req, globalPipes) => {
    const paramMeta = get('mini:params', Ctl) ?? [];
    const methodMeta = paramMeta
        .filter(m => m.name === handler.name);
    const sortedMeta = [...methodMeta].sort((a, b) => a.index - b.index);
    const args = [];
    for (const metadata of sortedMeta) {
        const extracted = extractParams(req, metadata.type);
        const argument = metadata.data ? extracted[metadata.data] : extracted;
        const paramPipes = getParamPipes(Ctl, handler.name, metadata.index);
        try {
            args[metadata.index] = await runPipes(Ctl, handler, argument, metadata, globalPipes, paramPipes);
        }
        catch (error) {
            throw new PipeError(`Pipe error for: ${error.message}`);
        }
    }
    return args;
};
export const HandlerMiddleware = (instance, handler, globalPipes) => {
    return async (req, res) => {
        const args = await getHandlerArgs(instance.constructor, handler, req, globalPipes);
        const result = await handler.apply(instance, args);
        res.json(result);
    };
};
