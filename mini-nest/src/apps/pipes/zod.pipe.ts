import { ZodSchema, ZodError } from 'zod';
import {ArgumentMetadata} from "../../core/types";
import {PipeTransform} from "../../core/decorators";
import {BadRequestException} from "../../core/common";

export class ZodValidationPipe implements PipeTransform<any, any> {
  constructor(
    private readonly schema: ZodSchema
  ) {}

  transform(value: unknown, meta: ArgumentMetadata) {
    try {
      return this.schema.parse(value);
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw new BadRequestException(
          `Validation failed for ${meta.type}${meta.data ? ` (${meta.data})` : ''}: ${messages}`
        );
      }
      throw new BadRequestException(
        `Validation failed for ${meta.type}${meta.data ? ` (${meta.data})` : ''}`
      );
    }
  }
}