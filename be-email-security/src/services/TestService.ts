import { spawn } from "child_process";
import path from "path";
import TestResultModel from "../models/TestResult";
import { wsManager } from "../server";
import { TestType, TestStatus } from "../types";

class TestService {
  private testResultModel = new TestResultModel();

  async runDomainTests(
    sessionId: string,
    domainId: string,
    domainName: string,
    testTypes: TestType[],
    userId: string
  ): Promise<void> {
    try {
      await this.testResultModel.updateSession(sessionId, {
        status: TestStatus.RUNNING,
      });

      const results = [];

      for (const testType of testTypes) {
        try {
          const testResult = await this.testResultModel.createTestResult(
            sessionId,
            domainId,
            testType
          );

          await this.testResultModel.updateTestResult(testResult.id, {
            status: TestStatus.RUNNING,
          });

          wsManager.broadcastTestProgress(userId, {
            sessionId,
            domainName,
            totalTests: testTypes.length,
            completedTests: results.length,
            currentTest: testType,
            status: TestStatus.RUNNING,
            results: results,
          });

          const result = await this.runSingleTest(testType, domainName);

          await this.testResultModel.updateTestResult(testResult.id, {
            status: TestStatus.COMPLETED,
            resultData: result.data,
            score: result.score,
            recommendations: result.recommendations,
            completedAt: new Date(),
          });

          results.push({
            ...testResult,
            status: TestStatus.COMPLETED,
            resultData: result.data,
            score: result.score,
            recommendations: result.recommendations,
          });
        } catch (error) {
          console.error(
            `Test ${testType} failed for domain ${domainName}:`,
            error
          );

          const testResult = await this.testResultModel.createTestResult(
            sessionId,
            domainId,
            testType
          );

          await this.testResultModel.updateTestResult(testResult.id, {
            status: TestStatus.FAILED,
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
            completedAt: new Date(),
          });

          results.push({
            ...testResult,
            status: TestStatus.FAILED,
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      const completedTests = results.filter(
        (r) => r.status === TestStatus.COMPLETED
      );
      const overallScore =
        completedTests.length > 0
          ? Math.round(
              completedTests.reduce((sum, test) => sum + (test.score || 0), 0) /
                completedTests.length
            )
          : 0;

      await this.testResultModel.updateSession(sessionId, {
        status: TestStatus.COMPLETED,
        completedTests: results.length,
        overallScore,
      });

      wsManager.broadcastTestComplete(userId, sessionId, {
        sessionId,
        domainName,
        totalTests: testTypes.length,
        completedTests: results.length,
        overallScore,
        status: TestStatus.COMPLETED,
        results,
      });
    } catch (error) {
      console.error("Domain tests failed:", error);

      await this.testResultModel.updateSession(sessionId, {
        status: TestStatus.FAILED,
      });

      wsManager.broadcastTestError(
        userId,
        sessionId,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  private async runSingleTest(
    testType: TestType,
    domainName: string
  ): Promise<{
    data: any;
    score: number;
    recommendations: string[];
  }> {
    const pythonScriptPath = path.join(
      __dirname,
      "../python",
      "email_tests.py"
    );
    const venvPython = path.join(
      __dirname,
      "../python",
      "venv",
      "bin",
      "python3"
    );

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(venvPython, [
        pythonScriptPath,
        testType.toLowerCase(),
        domainName,
      ]);

      let stdout = "";
      let stderr = "";

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse test result: ${error}`));
        }
      });

      pythonProcess.on("error", (error) => {
        reject(new Error(`Failed to start Python script: ${error.message}`));
      });

      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error("Test timeout"));
      }, 30000);
    });
  }
}

export default TestService;
