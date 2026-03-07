import { NextResponse } from "next/server";

import { getChatDateContext } from "@/lib/chat/date-context";

export async function GET() {
  return NextResponse.json(getChatDateContext());
}