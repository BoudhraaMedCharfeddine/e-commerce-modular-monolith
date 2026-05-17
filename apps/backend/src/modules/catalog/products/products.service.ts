import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(@InjectRepository(Product) private repo: Repository<Product>) {}

  async create(dto: CreateProductDto): Promise<Product> {
    return this.repo.save(this.repo.create(dto));
  }

  async findAll(search?: string, categoryId?: string): Promise<Product[]> {
    const where: FindOptionsWhere<Product> = { isActive: true };
    if (categoryId) where.categoryId = categoryId;
    if (search) where.name = Like(`%${search}%`);
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: Partial<CreateProductDto>): Promise<Product> {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.update(id, { isActive: false });
  }

  async decrementStock(productId: string, quantity: number): Promise<void> {
    await this.repo.decrement({ id: productId }, 'stock', quantity);
  }

  async incrementStock(productId: string, quantity: number): Promise<void> {
    await this.repo.increment({ id: productId }, 'stock', quantity);
  }
}
