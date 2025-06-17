import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import UserModel from "../models/User";
import { LoginRequest, RegisterRequest, AuthResponse } from "../types";

class AuthController {
  private userModel = new UserModel();

  async register(req: Request, res: Response): Promise<void> {
    try {
      const userData: RegisterRequest = req.body;

      // Check if user already exists
      const existingUser = await this.userModel.findByEmail(userData.email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: "User already exists with this email",
        });
        return;
      }

      // Create new user
      const user = await this.userModel.create(userData);

      // Generate JWT token
      const token = this.generateToken(user.id, user.email);

      const response: AuthResponse = {
        success: true,
        token,
        user,
        message: "User registered successfully",
      };

      res.status(201).json(response);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Registration failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      // Find user by email
      const userWithPassword = await this.userModel.findByEmail(email);
      if (!userWithPassword) {
        res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
        return;
      }

      // Verify password
      const isValidPassword = await this.userModel.verifyPassword(
        password,
        userWithPassword.passwordHash
      );
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
        return;
      }

      // Update last login
      await this.userModel.updateLastLogin(userWithPassword.id);

      // Generate JWT token
      const token = this.generateToken(
        userWithPassword.id,
        userWithPassword.email
      );

      // Remove password hash from response
      const { passwordHash, ...user } = userWithPassword;

      const response: AuthResponse = {
        success: true,
        token,
        user,
        message: "Login successful",
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Login failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const user = await this.userModel.findById(req.user.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get user profile",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Invalid token",
        });
        return;
      }

      const user = await this.userModel.findById(req.user.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { valid: true, user },
      });
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(500).json({
        success: false,
        message: "Token verification failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private generateToken(userId: string, email: string): string {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "24h";

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined");
    }

    return jwt.sign(
      { userId, email },
      jwtSecret
      //   {
      //   expiresIn: jwtExpiresIn as string,
      // }
    );
  }
}

export default AuthController;
