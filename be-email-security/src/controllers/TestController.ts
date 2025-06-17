import { Request, Response } from "express";
import DomainModel from "../models/Domain";
import TestResultModel from "../models/TestResult";
import TestService from "../services/TestService";
import { TestType } from "../types";

class TestController {
  private domainModel = new DomainModel();
  private testResultModel = new TestResultModel();
  private testService = new TestService();

  async runTests(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { domainName, testTypes, sessionName } = req.body;
      const userId = req.user.userId;

      const domain = await this.domainModel.create(userId, domainName);
      const typesToRun = testTypes || [
        TestType.DMARC,
        TestType.SPF,
        TestType.DKIM,
        TestType.MAIL_SERVER,
      ];

      const session = await this.testResultModel.createSession(
        domain.id,
        userId,
        sessionName || `Test session for ${domainName}`
      );

      await this.testResultModel.updateSession(session.id, {
        totalTests: typesToRun.length,
      });

      this.testService.runDomainTests(
        session.id,
        domain.id,
        domainName,
        typesToRun,
        userId
      );

      res.status(202).json({
        success: true,
        data: {
          sessionId: session.id,
          domainId: domain.id,
          status: "PENDING",
          message: "Tests started successfully",
        },
      });
    } catch (error) {
      console.error("Run tests error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to start tests",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getUserSessions(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const sessions = await this.testResultModel.getSessionsByUserId(
        req.user.userId,
        limit
      );

      res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      console.error("Get user sessions error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch sessions",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getSessionById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { sessionId } = req.params;
      const session = await this.testResultModel.getSessionById(sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          message: "Session not found",
        });
        return;
      }

      if (session.userId !== req.user.userId) {
        res.status(403).json({
          success: false,
          message: "Access denied",
        });
        return;
      }

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      console.error("Get session error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch session",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getSessionResults(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { sessionId } = req.params;
      const session = await this.testResultModel.getSessionById(sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          message: "Session not found",
        });
        return;
      }

      if (session.userId !== req.user.userId) {
        res.status(403).json({
          success: false,
          message: "Access denied",
        });
        return;
      }

      const results = await this.testResultModel.getTestResultsBySessionId(
        sessionId
      );

      res.json({
        success: true,
        data: {
          session,
          results,
        },
      });
    } catch (error) {
      console.error("Get session results error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch session results",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async retryFailedTests(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { sessionId } = req.params;
      const session = await this.testResultModel.getSessionById(sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          message: "Session not found",
        });
        return;
      }

      if (session.userId !== req.user.userId) {
        res.status(403).json({
          success: false,
          message: "Access denied",
        });
        return;
      }

      const results = await this.testResultModel.getTestResultsBySessionId(
        sessionId
      );
      const failedTests = results.filter(
        (result) => result.status === "FAILED"
      );

      if (failedTests.length === 0) {
        res.status(400).json({
          success: false,
          message: "No failed tests to retry",
        });
        return;
      }

      const domain = await this.domainModel.findById(session.domainId);
      if (!domain) {
        res.status(404).json({
          success: false,
          message: "Domain not found",
        });
        return;
      }

      const failedTestTypes = failedTests.map((test) => test.testType);
      this.testService.runDomainTests(
        sessionId,
        domain.id,
        domain.domainName,
        failedTestTypes,
        req.user.userId
      );

      res.json({
        success: true,
        message: "Retrying failed tests",
        data: {
          retriedTests: failedTestTypes.length,
        },
      });
    } catch (error) {
      console.error("Retry failed tests error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retry tests",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

export default TestController;
