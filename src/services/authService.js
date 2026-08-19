import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const createToken = (id, role) => jwt.sign({ id, role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const hashPassword = async (password) => bcrypt.hash(password, 10);

export const comparePassword = async (password, hashedPassword) => bcrypt.compare(password, hashedPassword);
