import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Warn if using default secret in production
if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  console.warn(
    "⚠️  WARNING: Using default JWT secret. Set JWT_SECRET environment variable!"
  );
}

/**
 * Payload interface for JWT tokens
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Sign a JWT token with user data
 * @param payload - User data to encode in token
 * @returns Signed JWT token string
 */
export function signToken(payload: JWTPayload): string {
  try {
    const token = jwt.sign(
      {
        ...payload,
        sub: payload.userId, // Standard JWT claim for user ID
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN as string,
        issuer: "event-management-app",
      }
    );

    return token;
  } catch (error) {
    console.error("Error signing JWT token:", error);
    throw new Error("Failed to sign token");
  }
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token string to verify
 * @returns Decoded token payload if valid
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "event-management-app",
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token has expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    } else {
      console.error("Error verifying JWT token:", error);
      throw new Error("Token verification failed");
    }
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value (e.g., "Bearer token123")
 * @returns Token string or null if not found
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}
