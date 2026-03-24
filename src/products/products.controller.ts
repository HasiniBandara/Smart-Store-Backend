import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ReduceStockDto } from './dto/reduce-stock.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findOne(+id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    const product = await this.productsService.update(+id, updateProductDto);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const product = await this.productsService.remove(+id);
    if (!product) throw new NotFoundException('Product not found');
    return { message: 'Product deleted successfully' };
  }

  @Post('reduce-stock')
  async reduceStock(@Body() reduceStockDto: ReduceStockDto) {
    return this.productsService.reduceStock(reduceStockDto);
  }
}