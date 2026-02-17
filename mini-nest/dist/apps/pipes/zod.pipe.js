import { ZodError } from 'zod';
import { BadRequestException } from "../../core/common";
export class ZodValidationPipe {
    schema;
    constructor(schema) {
        this.schema = schema;
    }
    transform(value, meta) {
        try {
            return this.schema.parse(value);
        }
        catch (err) {
            if (err instanceof ZodError) {
                const messages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                throw new BadRequestException(`Validation failed for ${meta.type}${meta.data ? ` (${meta.data})` : ''}: ${messages}`);
            }
            throw new BadRequestException(`Validation failed for ${meta.type}${meta.data ? ` (${meta.data})` : ''}`);
        }
    }
}
