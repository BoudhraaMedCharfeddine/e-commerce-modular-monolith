import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';

export class CreateReviewDto {
  productId: string;
  rating: number;
  comment?: string;
}

@Injectable()
export class ReviewsService {
  constructor(@InjectRepository(Review) private repo: Repository<Review>) {}

  async create(userId: string, dto: CreateReviewDto): Promise<Review> {
    const existing = await this.repo.findOne({ where: { userId, productId: dto.productId } });
    if (existing) throw new ConflictException('You already reviewed this product');
    return this.repo.save(this.repo.create({ ...dto, userId }));
  }

  async findByProduct(productId: string): Promise<{ reviews: Review[]; averageRating: number }> {
    const reviews = await this.repo.find({
      where: { productId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    return { reviews, averageRating: Math.round(avg * 10) / 10 };
  }

  async findByUser(userId: string): Promise<Review[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }
}
