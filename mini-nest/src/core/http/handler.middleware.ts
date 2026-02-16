import {Request, Response, NextFunction} from "express";
import {ArgumentMetadata, Type} from "../types";
import {extractParams, get} from "../utils";
import {runPipes, getParamPipes} from "../decorators";
import {HttpException} from "../common";

const getHandlerArgs = async (Ctl: Function, handler: Function, req: Request, globalPipes: Array<Type>) => {
  const paramMeta: Array<ArgumentMetadata> = get('mini:params', Ctl) ?? [];
  const methodMeta: Array<ArgumentMetadata> = paramMeta
    .filter(m => m.name === handler.name);
  const sortedMeta = [...methodMeta].sort((a, b) => a.index - b.index);
  const args: any[] = [];
  for (const metadata of sortedMeta) {
    const extracted = extractParams(req, metadata.type);
    const argument = metadata.data ? extracted[metadata.data] : extracted;

    const paramPipes = getParamPipes(Ctl, handler.name, metadata.index);

    try {
      args[metadata.index] = await runPipes(Ctl, handler, argument, metadata, globalPipes, paramPipes);
    } catch (error: any) {
      throw error;
    }
  }

  return args;
}

export const HandlerMiddleware = (instance: Type, handler: Function, globalPipes: Array<Type>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const args = await getHandlerArgs(instance.constructor, handler, req, globalPipes);

      const result = await handler.apply(instance, args);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}