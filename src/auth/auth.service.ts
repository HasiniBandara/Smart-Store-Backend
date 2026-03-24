import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { DatabaseService } from '../database/database.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private db: DatabaseService) {}

  async register(dto: RegisterDto) {
    const { name, email, password, role } = dto;

    // Check if user exists
    const userExists = await this.db.query('SELECT * FROM users WHERE email=$1', [email]);
    if (userExists.rows.length > 0) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, email, hashedPassword, role || 'customer'],
    );

    return newUser.rows[0];
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const userResult = await this.db.query('SELECT * FROM users WHERE email=$1', [email]);
    if (userResult.rows.length === 0) {
      throw new BadRequestException('Invalid credentials');
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new BadRequestException('Invalid credentials');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'supersecret',
      { expiresIn: '1h' },
    );

    return { token };
  }
}