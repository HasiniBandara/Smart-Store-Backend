# Backend

npm install -g @nestjs/cli
nest --version

// Create Project
npx @nestjs/cli new smart-store-backend

choosed npm
cd smart-store-backend

// Install Required Packages
npm install @nestjs/config @nestjs/typeorm typeorm pg
npm install class-validator class-transformer

// Run Project
npm run start:dev

// connects to PostgreSQL
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -d smart_store_db -U postgres


npm init -y 
npm install --save-dev @types/pg
npx eslint db.ts --fix
npx ts-node testDb.ts
