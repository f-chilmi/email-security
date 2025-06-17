import { Request, Response } from "express";
import DomainModel from "../models/Domain";
import TestResultModel from "../models/TestResult";

class DomainController {
  private domainModel = new DomainModel();
  private testResultModel = new TestResultModel();

  // async getUserDomains(req: Request, res: Response): Promise<void> {
  //   try {
  //     if (!req.user) {
  //       res.status(401).json({
  //         success: false,
  //         message: "User not authenticated",
  //       });
  //       return;
  //     }

  //     const domains = await this.domainModel.findByUserId(req.user.userId);

  //     res.json({
  //       success: true,
  //       data: domains,
  //     });
  //   } catch (error) {
  //     console.error("Get user domains error:", error);
  //     res.status(500).json({
  //       success: false,
  //       message: "Failed to fetch domains",
  //       error: error instanceof Error ? error.message : "Unknown error",
  //     });
  //   }
  // }

  async getUserDomains(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const result = await this.domainModel.findAllDomainByUserId(
        req.user.userId
      );

      // Group results by domain
      const domainsMap = new Map();

      result.rows.forEach((row: any) => {
        const domainId = row.id;

        if (!domainsMap.has(domainId)) {
          domainsMap.set(domainId, {
            id: row.id,
            userId: row.user_id,
            domainName: row.domain_name,
            isActive: row.is_active,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            latestTest: row.overall_score
              ? {
                  overallScore: row.overall_score,
                  status: row.session_status,
                  lastTestDate: row.last_test_date,
                  tests: [],
                }
              : null,
          });
        }

        // Add individual test results
        if (row.test_type && domainsMap.get(domainId).latestTest) {
          domainsMap.get(domainId).latestTest.tests.push({
            testType: row.test_type,
            score: row.score,
            status: row.test_status,
          });
        }
      });

      const domains = Array.from(domainsMap.values());

      res.json({
        success: true,
        data: domains,
      });
    } catch (error) {
      console.error("Get user domains error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch domains",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async addDomain(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { domainName } = req.body;
      const domain = await this.domainModel.create(req.user.userId, domainName);

      res.status(201).json({
        success: true,
        data: domain,
        message: "Domain added successfully",
      });
    } catch (error) {
      console.error("Add domain error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add domain",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getDomainById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { id } = req.params;
      const domain = await this.domainModel.findById(id);

      if (!domain) {
        res.status(404).json({
          success: false,
          message: "Domain not found",
        });
        return;
      }

      if (domain.userId !== req.user.userId) {
        res.status(403).json({
          success: false,
          message: "Access denied",
        });
        return;
      }

      res.json({
        success: true,
        data: domain,
      });
    } catch (error) {
      console.error("Get domain error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch domain",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async deleteDomain(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { id } = req.params;
      const deleted = await this.domainModel.delete(id, req.user.userId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Domain not found or access denied",
        });
        return;
      }

      res.json({
        success: true,
        message: "Domain deleted successfully",
      });
    } catch (error) {
      console.error("Delete domain error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete domain",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async getDomainTests(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { id } = req.params;
      const domain = await this.domainModel.findById(id);

      if (!domain || domain.userId !== req.user.userId) {
        res.status(404).json({
          success: false,
          message: "Domain not found or access denied",
        });
        return;
      }

      const sessions = await this.testResultModel.getSessionsByUserId(
        req.user.userId
      );
      const domainSessions = sessions.filter(
        (session) => session.domainId === id
      );

      res.json({
        success: true,
        data: domainSessions,
      });
    } catch (error) {
      console.error("Get domain tests error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch domain tests",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

export default DomainController;
