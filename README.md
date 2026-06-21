# 🚀 Trepa — The Self-Funding Intent Engine on Sui

> **Turn financial goals into on-chain actions.**
>
> Trepa is an AI-powered intent engine that allows users to interact with DeFi using plain English instead of complex blockchain operations. Simply describe what you want to achieve, and Trepa translates your intent into secure, executable Sui transactions while protecting you with intelligent risk analysis and transparent execution previews.

🌐 **Live Demo:** https://trepa-sui.vercel.app/

---

# 🌟 Vision

Today's DeFi experience is broken for most users.

To earn yield, stake assets, or manage a portfolio, users must understand:

* Liquidity pools
* Swaps
* Routing
* Slippage
* Yield strategies
* Transaction construction

At the same time, AI agents face another challenge: they continuously consume resources until they eventually run out of funds.

Trepa reimagines both problems.

Instead of learning DeFi mechanics, users simply describe their financial goals in natural language. Trepa handles the complexity, generates the necessary transactions, evaluates risks, and executes safely after user approval.

Beyond execution, Trepa introduces a sustainable treasury model where generated value can be reinvested to support future autonomous operations.

---

# 💡 What Makes Trepa Different?

Most AI-powered crypto assistants stop at answering questions.

Most DeFi applications require users to understand every technical detail.

Trepa bridges the gap.

### Traditional DeFi

```text
Choose Protocol
↓
Choose Pool
↓
Calculate Risks
↓
Build Transaction
↓
Sign Transaction
```

### Trepa

```text
"I want to invest 100 USDC conservatively"
↓
Trepa Understands Intent
↓
Trepa Builds Strategy
↓
Trepa Analyzes Risk
↓
Trepa Generates PTB
↓
You Approve
↓
Execution on Sui
```

---

# 🏗️ Core Features

## 🧠 AI Intent Engine

Users communicate using natural language.

Examples:

```text
Stake my SUI
```

```text
Convert 50 USDC into SUI
```

```text
Earn yield on my stablecoins
```

Trepa extracts:

* Goal
* Asset
* Amount
* Risk profile

and converts the request into a structured execution plan.

---

## ⚡ Sui PTB Generation

Trepa compiles user intent into Sui Programmable Transaction Blocks (PTBs).

This enables:

* Multi-step transactions
* Atomic execution
* Transparent transaction planning

Users receive a clear preview before any action is taken.

Example:

```text
Execution Plan

1. Swap 100 USDC → SUI
2. Stake SUI
3. Create Yield Position

Expected Yield: 6.2% APR
```

---

## 🛡️ Guardian Risk Engine

A core requirement of an Intent Engine is protecting users before execution.

Trepa's Guardian Layer evaluates every strategy before signing.

### Current Risk Checks

#### Slippage & Price Impact

```text
Warning:
This trade may lose 5.4% due to price impact.
```

#### Pool Liquidity

```text
Warning:
The selected pool has limited liquidity and may result in poor execution.
```

#### Treasury Budget Validation

```text
Warning:
Available treasury yield is insufficient for this action.
```

Users receive human-readable warnings instead of technical blockchain jargon.

---

## 👀 Human-Readable Transaction Preview

Before execution, Trepa translates blockchain operations into plain English.

Users see:

```text
Swap 100 USDC into SUI

Stake the resulting SUI

Estimated APR: 6.2%

Risk Score: Medium
```

Not raw contract calls.

Not opaque transaction data.

Just understandable actions.

---

## 🔒 User Approval First

Trepa never executes financial actions without explicit user approval.

Every transaction follows:

```text
Intent
↓
Risk Analysis
↓
PTB Preview
↓
User Confirmation
↓
Execution
```

This ensures users remain in control while benefiting from AI assistance.

---

## 💰 Self-Funding Treasury

Most AI agents continuously spend money.

Trepa introduces a different model.

Treasury assets are separated into:

### Principal

Protected capital that cannot be spent.

### Yield

Generated value that can be used for future agent operations.

```text
Principal: Protected

Yield: Spendable
```

This creates the foundation for sustainable autonomous agents.

---

## 🧾 Verifiable Receipts

Every action performed by Trepa generates a receipt containing:

* User Intent
* Generated PTB
* Risk Analysis
* Execution Status
* Timestamp

Creating a transparent and auditable history of agent actions.

---

# 🏛️ System Architecture

```text
User Intent
     ↓
Intent Parser
     ↓
Strategy Planner
     ↓
Guardian Risk Engine
     ↓
PTB Generator
     ↓
Execution Preview
     ↓
User Approval
     ↓
Sui Execution
     ↓
Treasury Update
     ↓
Receipt Generation
```

---

# ⚙️ Tech Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

## Blockchain

* Sui
* Move
* Sui TypeScript SDK

## AI

* OpenAI / OpenRouter Compatible Models

## Storage

* Walrus (planned)

## Security

* Seal (planned)
* zkLogin (planned)

---

# 🚀 Getting Started

## Prerequisites

Before running Trepa locally, ensure you have:

* Node.js v18+
* npm
* A Sui-compatible wallet
* Testnet SUI tokens

---

## Install Slush Wallet

Trepa interacts with Sui through a wallet connection.

Install Slush Wallet and create a wallet account.

After wallet creation:

* Switch to Sui Testnet
* Save your recovery phrase securely

---

## Get Testnet SUI

To execute transactions, request free testnet SUI from the Sui Faucet:

https://faucet.sui.io/

Wait for the tokens to arrive in your wallet before testing the application.

---

## Clone the Repository

```bash
git clone https://github.com/mokayaj857/trepa_sui.git
cd trepa_sui
```

---

## Install Dependencies

```bash
npm install
```

---

## Run the Development Server

```bash
npm run dev
```

Application will be available at:

```text
http://localhost:8000
```

---

# 🧪 Example User Flows

## Swap Tokens

Input:

```text
Swap 100 USDC to SUI
```

Trepa:

* Generates PTB
* Checks slippage
* Checks liquidity
* Shows execution preview
* Executes after approval

---

## Stake SUI

Input:

```text
Stake my SUI
```

Trepa:

* Generates staking PTB
* Displays expected rewards
* Executes after approval

---

## Lend Stablecoins

Input:

```text
Earn yield on my USDC
```

Trepa:

* Selects lending strategy
* Evaluates risk
* Creates lending transaction
* Executes after approval

---

# 🛣️ Roadmap

## Phase 1

* Intent Parsing
* PTB Generation
* Guardian Layer
* Swap Support
* Staking Support
* Lending Support

## Phase 2

* Treasury Automation
* Yield Tracking
* Receipt Storage
* Multi-step Strategies

## Phase 3

* Walrus Integration
* Seal Encryption
* zkLogin
* Autonomous Treasury Operations

## Phase 4

* Multi-Agent Coordination
* Self-Funding Research Agents
* Treasury Optimization
* Governance Monitoring

---

# 🎯 Why Sui?

Trepa is designed around Sui-native capabilities.

### Move Objects

Treasury management and policy enforcement.

### Programmable Transaction Blocks (PTBs)

Complex intent execution in a single transaction flow.

### zkLogin

Web2-style onboarding.

### Walrus

Decentralized storage for reports and receipts.

### Seal

Encrypted data management.

Together, these primitives make Sui an ideal foundation for AI-powered financial agents.

---

# 📜 License

MIT License

---

# 🔥 Tagline

**Trepa transforms financial intent into secure execution—and execution into sustainable autonomy.**
