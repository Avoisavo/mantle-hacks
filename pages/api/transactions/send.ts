import type { NextApiRequest, NextApiResponse } from "next";
import { sendTransaction, getAccountBalance } from "@/lib/smartAccount";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { from, to, amount } = req.body;

    // Validate inputs
    if (!from || !to || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(from) || !/^0x[a-fA-F0-9]{40}$/.test(to)) {
      return res.status(400).json({ error: "Invalid address format" });
    }

    // Convert amount to wei
    const value = BigInt(Math.floor(parseFloat(amount) * 1e18));

    // Check balance
    const balance = await getAccountBalance(from as `0x${string}`);
    if (balance < value) {
      return res.status(400).json({
        error: "Insufficient balance",
        balance: balance.toString(),
        required: value.toString(),
      });
    }

    // Send transaction
    const txHash = await sendTransaction(from as `0x${string}`, to as `0x${string}`, value);

    return res.status(200).json({
      success: true,
      data: {
        transactionHash: txHash,
        from,
        to,
        amount: value.toString(),
        message: "Transaction sent successfully",
      },
    });
  } catch (error) {
    console.error("Error sending transaction:", error);
    return res.status(500).json({
      error: "Failed to send transaction",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
