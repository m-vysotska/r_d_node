import { runGuards } from "../decorators";
export const GuardsMiddleware = (Ctl, handler, globalGuards = []) => async (req, res, next) => {
    const guardResult = await runGuards(Ctl, handler, req, res, globalGuards);
    if (typeof guardResult !== 'string') {
        return next();
    }
    res.status(403).json({ message: `Forbidden by ${guardResult}` });
};
