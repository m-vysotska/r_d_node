import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { ProductsService } from '../products/products.service';
import { Product } from '../entities/product.entity';

@Injectable({ scope: Scope.REQUEST })
export class ProductLoader {
  private readonly loader: DataLoader<string, Product>;

  constructor(private readonly productsService: ProductsService) {
    this.loader = new DataLoader<string, Product>(
      async (productIds: readonly string[]) => {
        const products = await this.productsService.findByIds([...productIds]);
        const productMap = new Map(products.map(p => [p.id, p]));
        return productIds.map(id => {
          const product = productMap.get(id);
          if (!product) {
            return new Error(`Product with id ${id} not found`);
          }
          return product;
        });
      },
    );
  }

  load(id: string): Promise<Product> {
    return this.loader.load(id);
  }
}
