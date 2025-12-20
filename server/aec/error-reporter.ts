/**
 * AEC Error Reporter - API endpoint for client-side error reporting
 */

import { Request, Response } from "express";
import { detectError } from "./sentinel-layer";

export async function handleErrorReport(req: Request, res: Response) {
  try {
    const {
      errorType,
      severity,
      message,
      stackTrace,
      source,
      endpoint,
      userContext,
    } = req.body;

    // Validate required fields
    if (!errorType || !message) {
      return res.status(400).json({
        error: "Missing required fields: errorType, message",
      });
    }

    // Log the error to AEC system
    const errorId = await detectError({
      errorType,
      severity: severity || "medium",
      message,
      stackTrace,
      source: source || "client-side",
      endpoint,
      userContext,
    });

    res.json({
      success: true,
      errorId,
    });
  } catch (error: any) {
    console.error("[AEC Error Reporter] Failed to process error report:", error);
    res.status(500).json({
      error: "Failed to process error report",
      message: error.message,
    });
  }
}
