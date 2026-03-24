import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ReduceStockDto } from './dto/reduce-stock.dto';

@Injectable()
export class ProductsService {
    constructor(private readonly db: DatabaseService) {}
    
  async findAll() {
    const result = await this.db.query(`
      SELECT p.id, p.name, p.price, p.stock, c.name AS category
      FROM products p
      JOIN categories c ON p.category_id = c.id
    `);
    return result.rows;
  }

  async findOne(id: number) {
    const result = await this.db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }

  async create(createProductDto: CreateProductDto) {
    const { name, description, price, stock, category_id } = createProductDto;
    const result = await this.db.query(
      'INSERT INTO products (name, description, price, stock, category_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, description, price, stock, category_id],
    );
    return result.rows[0];
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { name, description, price, stock, category_id } = updateProductDto;
    const result = await this.db.query(
      `UPDATE products
       SET name=$1, description=$2, price=$3, stock=$4, category_id=$5
       WHERE id=$6
       RETURNING *`,
      [name, description, price, stock, category_id, id],
    );
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }

  async remove(id: number) {
    const result = await this.db.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [id],
    );
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }

  async reduceStock(reduceStockDto: ReduceStockDto) {
    const { items } = reduceStockDto;
    for (const item of items) {
      await this.db.query(
        `UPDATE products
         SET stock = stock - $1
         WHERE id = $2`,
        [item.quantity, item.id],
      );
    }
    return { message: 'Stock updated successfully' };
  }
}