import type { NextApiRequest, NextApiResponse } from "next";
import { getSmartAccountAddress, deploySmartAccount, accountExists, getAddressFromEmail } from "@/lib/smartAccount";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }

    // Get the deterministic address for this email
    const ownerAddress = getAddressFromEmail(email);
    const accountAddress = await getSmartAccountAddress(email);

    // Check if account already exists
    const exists = await accountExists(accountAddress);

    return res.status(200).json({
      success: true,
      data: {
        accountAddress,
        ownerAddress,
        exists,
        message: exists
          ? "Account already exists"
          : "Account address generated. Deploy on first transaction.",
      },
    });
  } catch (error) {
    console.error("Error creating account:", error);
    return res.status(500).json({
      error: "Failed to create account",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
