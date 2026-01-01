Here’s a rough user flow (what the judge sees) and then the implementation plan (what you actually build) for Sumsub KYC + Mantle Sepolia (5003) + MetaMask + your backend.

⸻

Rough user flow (end-to-end)

0) Connect wallet (Mantle Sepolia)
	1.	User opens your React app.
	2.	Click Connect MetaMask.
	3.	App prompts to switch/add Mantle Sepolia (chainId 5003 / 0x138b, RPC https://rpc.sepolia.mantle.xyz, explorer https://explorer.sepolia.mantle.xyz).  ￼

1) Start KYC
	4.	User clicks Verify Identity.
	5.	App asks user to sign a message like:
Link wallet 0xABC... to KYC session <nonce>
	•	This proves wallet ownership (so nobody can KYC someone else’s wallet).
	6.	Frontend calls your backend: POST /kyc/start with { wallet, signature }.

2) Complete KYC in Sumsub UI
	7.	Backend returns either:
	•	a WebSDK accessToken (for embedded flow), or
	•	a hosted external WebSDK link (opens a new tab).  ￼
	8.	User completes the flow (for hackathon demo: you can keep it lightweight using Sandbox simulation—see below).

3) Approval happens → game unlocks
	9.	Sumsub sends your backend a webhook event applicantReviewed with the result (reviewResult.reviewAnswer = GREEN or RED).  ￼
	10.	If GREEN:

	•	Backend writes one Mantle tx: KycRegistry.setApproved(wallet, true)
	•	Frontend polls GET /kyc/status (or listens via websocket) and flips UI to Verified ✅.

	11.	User can now enter rooms / buy RWA tokens / mint whatever you gate behind KYC.

Hackathon demo mode (no passports, no face scans for judges)
	•	You add a “Simulate Approve” button (admin/dev only).
	•	Backend calls Sumsub “simulate review response in Sandbox” → you still receive the same applicantReviewed webhook.  ￼

⸻

Implementation plan: how Sumsub plugs into the rest of your project

A) Decide your “userId” strategy (important)

Use one stable identifier across your system:
	•	Option 1 (simplest): externalUserId = walletAddress
Works great for your current plan (MetaMask-first).
	•	Option 2: externalUserId = zkLoginUserId, and store { zkUserId ↔ walletAddress } in DB
Useful if you want social login identity + allow wallet changes later.

Sumsub’s WebSDK also expects a meaningful userId/identifier for sessions (not random, except in testing).  ￼

⸻

B) Backend APIs you implement (minimal set)

1) POST /kyc/start
Responsibilities:
	1.	Verify the wallet signature (EIP-191 personal_sign) to prove user controls that wallet.
	2.	Create or fetch a Sumsub applicant:
	•	createApplicant(externalUserId)  ￼
	3.	Start a WebSDK session by either:
	•	generating an access token for WebSDK  ￼
	•	OR generating a hosted external WebSDK link (easier for React MVP)  ￼
	4.	Store in DB: { wallet, externalUserId, applicantId, status=PENDING }
	5.	Return { url } or { accessToken }.

Tip: for hackathons, the hosted external link is often the fastest.

2) GET /kyc/status?wallet=0x...
Returns:
	•	NOT_STARTED | PENDING | APPROVED | REJECTED | BLOCKED
	•	plus updatedAt

Frontend uses this to show the “KYC Gate” status.

3) POST /webhooks/sumsub
Responsibilities:
	1.	Verify webhook authenticity using Sumsub’s x-payload-digest and raw request bytes (HMAC with algorithm from x-payload-digest-alg).  ￼
	2.	Parse event. If it’s applicantReviewed:
	•	read reviewResult.reviewAnswer (GREEN/RED)  ￼
	3.	Update DB status for the corresponding externalUserId.
	4.	If GREEN: call Mantle contract to mark wallet approved.

4) (Demo helper) POST /kyc/simulate
	•	Backend calls Sumsub “simulate review response in Sandbox” with GREEN or RED.  ￼
	•	This triggers the normal webhook path so your Mantle tx still happens.

⸻

C) Smart contract piece (Mantle Sepolia 5003)

Deploy a tiny registry:
	•	mapping(address => bool) approved
	•	setApproved(address,bool) only callable by your backend signer (“attestor”)

Then any gated contract does:
	•	require(kycRegistry.approved(msg.sender), "KYC required");

This keeps on-chain data privacy-safe (no PII, just eligibility).

⸻

D) Frontend integration (React)

Flow:
	1.	connectWallet() + switchChain(5003)
	2.	signMessage("Link wallet...nonce...")
	3.	call POST /kyc/start
	4.	redirect to returned Sumsub hosted URL (or mount WebSDK using returned accessToken)
	5.	poll GET /kyc/status

Sumsub provides a WebSDK “get started” flow (generate access token on server; React package exists).  ￼

⸻

E) Webhook verification (what you must do correctly)

Sumsub’s guidance is explicit: compute digest from the raw bytes of the request body and compare to x-payload-digest, using the algo in x-payload-digest-alg.  ￼

Implementation detail in Node/Express:
	•	use express.raw({ type: '*/*' }) on that route
	•	compute HMAC over req.body (Buffer)
	•	reject if mismatch

Also make your webhook handler idempotent (dedupe by event id if they include one, or hash the payload).

⸻

How this fits your hackathon requirements
	•	GameFi + Social: KYC becomes a “gate” before RWA ownership.
	•	Consumer RWA/yield logic: you can honestly say “KYC is required for RWA features” and show it working.
	•	Mantle integration: the approval is enforced on-chain on Mantle Sepolia (5003), not just a backend flag.
	•	Compliance declaration: you can disclose “regulated asset flow requires KYC; demo uses sandbox; no PII stored on-chain.”

