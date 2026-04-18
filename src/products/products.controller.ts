import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

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
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    const product = await this.productsService.update(+id, updateProductDto);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string) {
    const product = await this.productsService.remove(+id);
    if (!product) throw new NotFoundException('Product not found');
    return { message: 'Product deleted successfully' };
  }

  @Post('reduce-stock')
  @UseGuards(AuthGuard) // Only logged in users can reduce stock via orders
  reduceStock(@Body() reduceStockDto: any) {
    return this.productsService.reduceStock(reduceStockDto);
  }
}