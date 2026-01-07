import type { NextApiRequest, NextApiResponse } from "next";
import { getAccountBalance } from "@/lib/smartAccount";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { address } = req.query;

    if (!address || typeof address !== "string") {
      return res.status(400).json({ error: "Address is required" });
    }

    const balance = await getAccountBalance(address as `0x${string}`);

    return res.status(200).json({
      success: true,
      data: {
        address,
        balance: balance.toString(),
        balanceInMNT: Number(balance) / 1e18,
      },
    });
  } catch (error) {
    console.error("Error fetching balance:", error);
    return res.status(500).json({
      error: "Failed to fetch balance",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
