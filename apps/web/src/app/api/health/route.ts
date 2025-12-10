/**
 * Next.js Web Health Check Endpoint
 * Simple health check for Docker/Coolify monitoring
 */

export async function GET() {
  return Response.json(
    {
      status: "healthy",
      service: "web",
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
    }
  );
}
