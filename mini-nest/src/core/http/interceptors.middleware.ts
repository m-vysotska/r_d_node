import {Request, Response, NextFunction} from "express";
import {Type} from "../types";
import {getInterceptors} from "../decorators";
import {container} from "../container";
import {isClass} from "../utils";
import {NestInterceptor} from "../interfaces";
import {ExpressExecutionContext} from "../utils";

export const InterceptorsMiddleware = (
  Ctl: Type,
  handler: Function,
  globalInterceptors: Array<Type> = [],
  actualHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const interceptors = getInterceptors(handler, Ctl, globalInterceptors);
    
    if (interceptors.length === 0) {
      return actualHandler(req, res, next);
    }

    const ctx = new ExpressExecutionContext(Ctl, handler, req, res);
    
    let index = 0;
    const callNext = async (): Promise<any> => {
      if (index >= interceptors.length) {
        return actualHandler(req, res, next);
      }
      
      const InterceptorCtor = interceptors[index++];
      const interceptorInstance = isClass(InterceptorCtor) 
        ? container.resolve<NestInterceptor>(InterceptorCtor) 
        : InterceptorCtor;
      
      return interceptorInstance.intercept(ctx, callNext);
    };

    try {
      await callNext();
    } catch (error) {
      next(error);
    }
  };
};
