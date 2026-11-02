import { NextResponse } from "next/server";
import { getDatabase, saveDatabase } from "@/lib/serverDb";

export async function GET() {
  const db = await getDatabase();
  return NextResponse.json({ success: true, settings: db.settings });
}

export async function POST(req: Request) {
  try {
    const newSettings = await req.json();
    const db = await getDatabase();

    db.settings = { ...db.settings, ...newSettings };
    await saveDatabase(db);

    return NextResponse.json({ success: true, settings: db.settings });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
