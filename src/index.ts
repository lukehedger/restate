import * as restate from "@restatedev/restate-sdk";

/**
 * Order Processing Workflow
 * 
 * This example demonstrates a durable execution workflow for processing orders.
 * The workflow includes multiple steps that can fail and retry automatically:
 * 1. Validate the order
 * 2. Process payment
 * 3. Reserve inventory
 * 4. Ship the order
 * 5. Send confirmation email
 * 
 * Each step is wrapped in ctx.run() which provides:
 * - Automatic retries on failure
 * - Exactly-once execution semantics
 * - State persistence across failures
 */

interface Order {
  orderId: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  totalAmount: number;
}

interface OrderResult {
  orderId: string;
  status: string;
  message: string;
  trackingNumber?: string;
}

// Helper function to simulate async operations
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Define the order processing workflow as a Restate service
const orderWorkflow = restate.service({
  name: "order-workflow",
  handlers: {
    // Main workflow handler
    async processOrder(ctx: restate.Context, order: Order): Promise<OrderResult> {
      console.log(`[${new Date().toISOString()}] Processing order: ${order.orderId}`);

      // Step 1: Validate order
      // ctx.run ensures this step is executed exactly once
      const isValid = await ctx.run("validate-order", async () => {
        console.log(`  ✓ Validating order ${order.orderId}...`);
        // Simulate validation logic
        if (order.items.length === 0) {
          throw new Error("Order has no items");
        }
        if (order.totalAmount <= 0) {
          throw new Error("Invalid order amount");
        }
        return true;
      });

      if (!isValid) {
        return {
          orderId: order.orderId,
          status: "failed",
          message: "Order validation failed",
        };
      }

      // Step 2: Process payment
      // If this fails and retries, the validation step won't re-execute
      const paymentId = await ctx.run("process-payment", async () => {
        console.log(`  ✓ Processing payment for order ${order.orderId}...`);
        // Simulate payment processing
        await sleep(1000);
        const paymentId = `PAY-${Date.now()}`;
        console.log(`    Payment processed: ${paymentId}`);
        return paymentId;
      });

      // Step 3: Reserve inventory
      await ctx.run("reserve-inventory", async () => {
        console.log(`  ✓ Reserving inventory for order ${order.orderId}...`);
        // Simulate inventory reservation
        await sleep(500);
        for (const item of order.items) {
          console.log(`    Reserved ${item.quantity}x ${item.productId}`);
        }
      });

      // Step 4: Ship the order
      const trackingNumber = await ctx.run("ship-order", async () => {
        console.log(`  ✓ Shipping order ${order.orderId}...`);
        // Simulate shipping
        await sleep(800);
        const trackingNumber = `TRACK-${Date.now()}`;
        console.log(`    Order shipped with tracking: ${trackingNumber}`);
        return trackingNumber;
      });

      // Step 5: Send confirmation email
      await ctx.run("send-confirmation", async () => {
        console.log(`  ✓ Sending confirmation email for order ${order.orderId}...`);
        // Simulate email sending
        await sleep(300);
        console.log(`    Confirmation email sent to customer ${order.customerId}`);
      });

      console.log(`[${new Date().toISOString()}] Order ${order.orderId} completed successfully!`);

      return {
        orderId: order.orderId,
        status: "completed",
        message: `Order processed successfully`,
        trackingNumber: trackingNumber,
      };
    },

    // Helper handler to check order status
    async getOrderStatus(ctx: restate.Context, orderId: string): Promise<string> {
      console.log(`Getting status for order: ${orderId}`);
      // In a real application, you would use ctx.get() to retrieve state
      return `Order ${orderId} status check - implement state storage for real tracking`;
    },
  },
});

// Create and start the Restate endpoint
restate
  .endpoint()
  .bind(orderWorkflow)
  .listen(9080);

console.log("🚀 Restate Order Workflow service started!");
console.log("📡 Listening on http://localhost:9080");
console.log("📦 Service registered: order-workflow");
console.log("\n" + "=".repeat(80));
console.log("NEXT STEPS:");
console.log("=".repeat(80));
console.log("\n1. This service endpoint needs to be registered with a Restate runtime.");
console.log("   Visit https://docs.restate.dev/get_started/quickstart to learn how to:");
console.log("   - Download and run the Restate runtime");
console.log("   - Register this service endpoint");
console.log("   - Invoke the workflow");
console.log("\n2. Quick Start Guide:");
console.log("   - Install Restate CLI: npm install -g @restatedev/restate");
console.log("   - Start Restate server: restate-server");
console.log("   - Register this endpoint: restate deployments register http://localhost:9080");
console.log('   - Invoke workflow: curl -X POST http://localhost:8080/order-workflow/processOrder \\');
console.log('       -H "Content-Type: application/json" \\');
console.log('       -d \'{"orderId":"ORD-001","customerId":"CUST-123",' +
  '"items":[{"productId":"PROD-A","quantity":2,"price":29.99}],"totalAmount":59.98}\'');
console.log("\n" + "=".repeat(80));
