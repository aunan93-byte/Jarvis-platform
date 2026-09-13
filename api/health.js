export default function health(request, response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    return response.status(405).json({ error: "method_not_allowed" });
  }
  const payload = { service: "jarvis-platform", version: "0.1.0", status: "awaiting_migration", autonomous: false, commerce: false };
  if (request.method === "HEAD") return response.status(200).end();
  return response.status(200).json(payload);
}
