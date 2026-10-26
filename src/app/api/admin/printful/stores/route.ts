import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { getPrintfulSettings, printfulRequest } from "@/lib/printful";

export const runtime = "nodejs";

async function authorized() {
  return isValidAdminSession((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
}

type PrintfulStore = {
  id: number;
  name?: string;
  type?: string;
};

export async function POST(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json().catch(() => null) as { token?: string } | null;
  const current = await getPrintfulSettings();
  const token = body?.token?.trim() || current?.token || "";
  if (!token) return Response.json({ error: "Enter your Printful private token first." }, { status: 400 });

  try {
    const stores = await printfulRequest<PrintfulStore[]>(
      "/stores",
      {},
      {
        token,
        storeId: "",
        autoConfirm: current?.autoConfirm === true,
        webhookSecret: "",
      },
    );

    return Response.json({
      stores: (stores || []).map((store) => ({
        id: String(store.id),
        name: store.name || `Store ${store.id}`,
        type: store.type || "",
      })),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Your Printful stores could not be loaded." },
      { status: 400 },
    );
  }
}
