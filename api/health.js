export default function health(request, response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("Allow", "GET, HEAD");
    return response.status(405).json({ error: "method_not_allowed" });
  }
  const commit = process.env.VERCEL_GIT_COMMIT_SHA;
  const payload = {
    service: "jarvis-platform", version: "0.1.0", status: "awaiting_migration",
    autonomous: false, commerce: false,
    deployment: {
      commit: /^[a-f0-9]{40}$/i.test(commit || "") ? commit.toLowerCase() : null,
      environment: ["production", "preview", "development"].includes(process.env.VERCEL_ENV)
        ? process.env.VERCEL_ENV : "unknown",
    },
  };
  if (request.method === "HEAD") return response.status(200).end();
  return response.status(200).json(payload);
}
