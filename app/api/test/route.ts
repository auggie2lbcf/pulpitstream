import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/logger"; // our logger import

export async function GET(req: NextRequest) {

  logger.info(`GET /api/gethome ${req}`);

  return NextResponse.json({
    message: "success",
    status: 200,
  });
}