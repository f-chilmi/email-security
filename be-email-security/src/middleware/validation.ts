import { Request, Response, NextFunction } from "express";
import { body, validationResult, ValidationChain } from "express-validator";

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
    return;
  }
  next();
};

export const validateLogin: ValidationChain[] = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

export const validateRegister: ValidationChain[] = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  body("firstName")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("First name must be between 1 and 100 characters")
    .trim(),
  body("lastName")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Last name must be between 1 and 100 characters")
    .trim(),
  body("organization")
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage("Organization must be between 1 and 255 characters")
    .trim(),
];

export const validateDomain: ValidationChain[] = [
  body("domainName")
    .matches(
      /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/
    )
    .withMessage("Please provide a valid domain name")
    .isLength({ min: 3, max: 255 })
    .withMessage("Domain name must be between 3 and 255 characters")
    .toLowerCase(),
];

export const validateTestRequest: ValidationChain[] = [
  body("domainName")
    .matches(
      /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/
    )
    .withMessage("Please provide a valid domain name")
    .isLength({ min: 3, max: 255 })
    .withMessage("Domain name must be between 3 and 255 characters")
    .toLowerCase(),
  body("testTypes")
    .optional()
    .isArray()
    .withMessage("Test types must be an array")
    .custom((value) => {
      const validTypes = ["DMARC", "SPF", "DKIM", "MAIL_SERVER"];
      if (value && value.length > 0) {
        for (const type of value) {
          if (!validTypes.includes(type)) {
            throw new Error(
              `Invalid test type: ${type}. Valid types are: ${validTypes.join(
                ", "
              )}`
            );
          }
        }
      }
      return true;
    }),
  body("sessionName")
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage("Session name must be between 1 and 255 characters")
    .trim(),
];

export const validateUUID = (paramName: string): ValidationChain => {
  return body(paramName)
    .isUUID()
    .withMessage(`${paramName} must be a valid UUID`);
};

export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Remove any potential XSS attempts from string fields
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === "string") {
      return obj.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        ""
      );
    }
    if (typeof obj === "object" && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitizeObject(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  next();
};
