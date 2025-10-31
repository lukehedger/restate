# Restate Durable Execution Workflow Example

A simple example demonstrating how to use [Restate](https://restate.dev) to create a durable execution workflow. This example implements an order processing workflow that showcases Restate's ability to handle failures, retries, and maintain execution state across service restarts.

## What is Restate?

Restate is a durable execution platform that makes distributed applications reliable and scalable. It provides:

- **Durable Execution**: Your code execution state is persisted automatically
- **Automatic Retries**: Failed operations are retried automatically  
- **Exactly-Once Semantics**: Each step runs exactly once, even with retries
- **Consistency**: Strong consistency guarantees for your workflows
- **Observability**: Built-in tracing and logging

## The Example Workflow

This example implements an order processing workflow with the following steps:

1. **Validate Order** - Ensures the order is valid
2. **Process Payment** - Handles payment processing
3. **Reserve Inventory** - Reserves items from inventory
4. **Ship Order** - Initiates shipping and generates tracking number
5. **Send Confirmation** - Sends confirmation email to customer

Each step is wrapped in `ctx.run()` which makes it durable - if a failure occurs, Restate will automatically retry from the last successful step without re-executing completed steps.

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

Install the project dependencies:

```bash
npm install
```

## Project Structure

```
.
├── src/
│   └── index.ts          # Main workflow implementation
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Running the Example

### Step 1: Build the Service

```bash
npm run build
```

This compiles the TypeScript code to JavaScript in the `dist/` directory.

### Step 2: Start the Service Endpoint

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The service endpoint will start on port 9080. You should see output like:

```
🚀 Restate Order Workflow service started!
📡 Listening on http://localhost:9080
📦 Service registered: order-workflow
```

### Step 3: Set Up Restate Runtime (Required)

To actually invoke the workflow, you need a Restate runtime server. The service endpoint you started is **not** the runtime - it's your application code that will be called by Restate.

#### Install Restate CLI

```bash
npm install -g @restatedev/restate
```

#### Start Restate Server

In a new terminal:

```bash
npx @restatedev/restate-server
```

This starts the Restate runtime on port 8080 (default).

#### Register Your Service Endpoint

In another terminal:

```bash
npx restate deployments register http://localhost:9080
```

This tells the Restate runtime where to find your service.

### Step 4: Invoke the Workflow

Now you can invoke your workflow through the Restate runtime:

```bash
curl -X POST http://localhost:8080/order-workflow/processOrder \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-001",
    "customerId": "CUST-123",
    "items": [
      {
        "productId": "PROD-A",
        "quantity": 2,
        "price": 29.99
      }
    ],
    "totalAmount": 59.98
  }'
```

You should see output in your service terminal showing each step being executed:

```
[2025-01-01T12:00:00.000Z] Processing order: ORD-001
  ✓ Validating order ORD-001...
  ✓ Processing payment for order ORD-001...
    Payment processed: PAY-1234567890
  ✓ Reserving inventory for order ORD-001...
    Reserved 2x PROD-A
  ✓ Shipping order ORD-001...
    Order shipped with tracking: TRACK-1234567890
  ✓ Sending confirmation email for order ORD-001...
    Confirmation email sent to customer CUST-123
[2025-01-01T12:00:05.000Z] Order ORD-001 completed successfully!
```

## Key Restate Concepts Demonstrated

### 1. Durable Execution with `ctx.run()`

Each step in the workflow is wrapped in `ctx.run()`:

```typescript
const paymentId = await ctx.run("process-payment", async () => {
  // Payment processing logic
  return paymentId;
});
```

This ensures that:
- The step is executed exactly once
- If the service crashes after this step, it won't be re-executed on retry
- Failed steps are automatically retried
- Each step has a unique name for idempotency

### 2. Service Definition

The workflow is defined as a Restate service:

```typescript
const orderWorkflow = restate.service({
  name: "order-workflow",
  handlers: {
    async processOrder(ctx: restate.Context, order: Order): Promise<OrderResult> {
      // Workflow logic
    }
  }
});
```

### 3. Automatic State Management

Restate automatically:
- Persists execution state after each `ctx.run()` call
- Handles retries on failures
- Ensures exactly-once execution
- Maintains consistency across failures and restarts

## Testing Failure Recovery

To see Restate's durability in action:

1. Start processing an order
2. Kill the service endpoint (Ctrl+C) during execution
3. Restart the service endpoint (`npm start`)
4. Restate will automatically resume from the last completed step

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Your Client   │────────>│  Restate Runtime │────────>│ Service Endpoint│
│  (curl/app)     │         │   (port 8080)    │         │  (port 9080)    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │  Durable State   │
                            │   (persisted)    │
                            └──────────────────┘
```

1. Clients call the Restate runtime (port 8080)
2. Restate invokes your service endpoint (port 9080)
3. Restate persists state after each `ctx.run()` call
4. On failures, Restate retries from the last successful state

## Next Steps

To learn more about Restate:

- [Official Documentation](https://docs.restate.dev)
- [Restate SDK for TypeScript](https://github.com/restatedev/sdk-typescript)
- [TypeScript Quickstart](https://docs.restate.dev/get_started/quickstart?sdk=ts)
- [More Examples](https://github.com/restatedev/examples)
- [Key Concepts](https://docs.restate.dev/concepts/durable_execution)

## Customizing the Example

You can extend this example by:

- Adding more workflow steps
- Implementing real payment/shipping integrations
- Using `ctx.set()` and `ctx.get()` for state management
- Adding error handling and compensating transactions
- Implementing workflow cancellation
- Adding timeouts with `ctx.sleep()`

## License

MIT