import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';  
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,  // Auth module imported 
    ProductsModule,  // Products module imported
  ],
})
export class AppModule {}
