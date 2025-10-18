import { prisma } from "../db";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "../services/email.service";
import { signToken } from "../utils/jwt.utils";

/**
 * Register a new user
 * @param email - User's email address
 * @param password - User's password (will be hashed)
 * @returns Created user object and success message
 */
export async function registerUser(email: string, password: string) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "User with this email already exists",
        status: 400,
      };
    }

    // Hash password with bcryptjs
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user in database with ATTENDEE role
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "ATTENDEE", // Default role
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Send welcome email (async, don't wait for it)
    sendWelcomeEmail(email).catch((error) => {
      console.error("Failed to send welcome email:", error);
      // Don't fail registration if email fails
    });

    return {
      success: true,
      user: newUser,
      message: "User registered successfully",
      status: 201,
    };
  } catch (error) {
    console.error("Error registering user:", error);
    return {
      success: false,
      error: "Failed to register user",
      status: 500,
    };
  }
}

/**
 * Login user
 * @param email - User's email address
 * @param password - User's password
 * @returns User object if credentials are valid
 */
export async function loginUser(email: string, password: string) {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Check if user exists
    if (!user) {
      return {
        success: false,
        error: "Invalid email or password",
        status: 401,
      };
    }

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return {
        success: false,
        error: "Invalid email or password",
        status: 401,
      };
    }

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      success: true,
      token,
      user: userWithoutPassword,
      message: "Login successful",
      status: 200,
    };
  } catch (error) {
    console.error("Error logging in user:", error);
    return {
      success: false,
      error: "Failed to login",
      status: 500,
    };
  }
}
