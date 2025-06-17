export interface DMARCData {
  isConfigured: boolean;
  policy?: string;
  subdomainPolicy?: string;
  percentage?: number;
  reportingEmails?: string[];
  record?: string;
  error?: string;
}

export interface SPFData {
  isValid: boolean;
  record?: string;
  mechanisms?: string[];
  includesCount?: number;
  dnsLookupCount?: number;
  error?: string;
}

export interface DKIMData {
  isValid: boolean;
  selector?: string;
  record?: string;
  keyLength?: number;
  algorithm?: string;
  error?: string;
}

export interface MailServerData {
  mxRecords: string[];
  echoTest: {
    success: boolean;
    responseTime?: number;
    errorMessage?: string;
  };
}

export type TestResultData = DMARCData | SPFData | DKIMData | MailServerData;

export interface TestResult {
  id: string;
  testType: "DMARC" | "SPF" | "DKIM" | "MAIL_SERVER";
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  score?: number;
  recommendations?: string[];
  resultData?: TestResultData;
  errorMessage?: string;
}

export interface TestSession {
  id: string;
  sessionName: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  totalTests: number;
  completedTests: number;
  overallScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TestResultsProps {
  session: TestSession;
  results: TestResult[];
}
