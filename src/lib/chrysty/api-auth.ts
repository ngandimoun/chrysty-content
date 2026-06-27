import type { NextResponse } from "next/server";

import {
  assertAuthenticatedRequest,
  respondPlatformAccessError,
} from "@/lib/chrysty/guard";

export async function requireApiAuth(
  request: Request,
): Promise<NextResponse | null> {
  try {
    await assertAuthenticatedRequest(request);
    return null;
  } catch (error) {
    return respondPlatformAccessError(error);
  }
}
