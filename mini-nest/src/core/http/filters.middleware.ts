import {Type} from "../types";
import {ErrorRequestHandler} from "express";
import {HttpException} from "../common";
import {container} from "../container";
import {isClass} from "../utils";

export interface ExceptionFilter {
  catch(exception: HttpException, req: any, res: any): void;
}

export const FiltersMiddleware = (Ctl: Type, handler: Function, filters: Array<Type>): ErrorRequestHandler => {
  return (err, req, res, _next) => {
    if (err instanceof HttpException) {
      return res.status(err.status).json({ error: err.message });
    }
    
    if (filters.length > 0) {
      for (const FilterCtor of filters) {
        try {
          const filterInstance: ExceptionFilter = isClass(FilterCtor) 
            ? container.resolve<ExceptionFilter>(FilterCtor) 
            : (FilterCtor as unknown as ExceptionFilter);
          
          if (filterInstance && typeof filterInstance.catch === 'function') {
            filterInstance.catch(err as HttpException, req, res);
            return;
          }
        } catch (e) {
        }
      }
    }
    
    err.stack = undefined;
    const status = (err as Error & { status: number }).status || 500;
    res.status(status).json({error: err.message || 'Server error'});
  }
}