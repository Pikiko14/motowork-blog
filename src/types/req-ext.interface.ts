import { Request } from "express";
import { User } from "./users.interface";
import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      files?: {
        [fieldname: string]: Express.Multer.File[]; // Definir correctamente el tipo para el índice
      };
    }
  }
}

export interface RequestExt extends Request {
  user?: JwtPayload | { id: string, scopes: string[] } | User | any;
  files?: any
  file?: Express.Multer.File;
}

export interface PaginationInterface {
  page: number;
  perPage: number;
  search: string | number;
  is_active?: boolean;
  type?: string;
  sortBy?: string;
  order?: string;
  fields?: string;
}