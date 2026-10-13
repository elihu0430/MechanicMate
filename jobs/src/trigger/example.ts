import { task, wait } from "@trigger.dev/sdk";

export const helloWorldTask = task({
  id: "hello-world",
  run: async (payload: { message?: string }) => {
    const greeting = payload.message ?? "Hello from Trigger.dev in MechanicMate!";
    console.log("Task executed with payload:", payload);

    // Durable wait for 5 seconds
    await wait.for({ seconds: 5 });

    return {
      status: "success",
      message: greeting,
      timestamp: new Date().toISOString(),
    };
  },
});
