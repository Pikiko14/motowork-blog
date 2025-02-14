import mongoose from "mongoose";

export enum UserRole {
  ADMIN = "admin",
  CLIENT = "client",
  EMPLOYEE = "employee",
}

export interface User {
  username: string;
  password: string;
  id?: string;
  _id?: string;
  email: string;
  parent?: string;
  role?: UserRole;
  scopes?: string[];
  is_active?: boolean;
  recovery_token?: string;
  profile_pictury?: string;
  name: string | undefined;
  token?: string | undefined;
  last_name: string | undefined;
  confirmation_token?: string | null;
  phone: string;
  document: string;
  review: number;
  remember?: boolean;
}
