export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organization?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Domain {
  id: string;
  userId: string;
  domainName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum TestType {
  DMARC = "DMARC",
  SPF = "SPF",
  DKIM = "DKIM",
  MAIL_SERVER = "MAIL_SERVER",
}

export enum TestStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface TestResult {
  id: string;
  domainId: string;
  sessionId?: string;
  testType: TestType;
  status: TestStatus;
  resultData?: any;
  errorMessage?: string;
  score?: number;
  recommendations?: string[];
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface TestSession {
  id: string;
  domainId: string;
  userId: string;
  sessionName?: string;
  status: TestStatus;
  totalTests: number;
  completedTests: number;
  overallScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organization?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: Omit<User, "passwordHash">;
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface DomainTestRequest {
  domainName: string;
  testTypes?: TestType[];
  sessionName?: string;
}

export interface TestProgress {
  sessionId: string;
  domainName: string;
  totalTests: number;
  completedTests: number;
  currentTest?: TestType;
  status: TestStatus;
  results: TestResult[];
}

export interface DMARCResult {
  policy: string;
  subdomainPolicy?: string;
  percentage?: number;
  reportingEmails: string[];
  isConfigured: boolean;
  recommendations: string[];
}

export interface SPFResult {
  record: string;
  mechanisms: string[];
  isValid: boolean;
  includesCount: number;
  dnsLookupCount: number;
  recommendations: string[];
}

export interface DKIMResult {
  selector: string;
  isValid: boolean;
  keyLength?: number;
  algorithm?: string;
  recommendations: string[];
}

export interface MailServerResult {
  mxRecords: string[];
  echoTest: {
    success: boolean;
    responseTime?: number;
    errorMessage?: string;
  };
  recommendations: string[];
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}
