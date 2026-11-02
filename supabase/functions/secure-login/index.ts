import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigin = "https://recountix.github.io";
const corsHeaders = (_origin: string | null) => ({
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
  "Content-Type": "application/json",
});
const json = (body: Record<string, unknown>, status = 200, origin: string | null = null) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
async function digest(value: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ error: "Authentication service is not configured." }, 500, origin);
  const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const adminClient = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let body: { action?: string; username?: string; password?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400, origin); }

  if (body.action === "check-session") {
    const header = req.headers.get("authorization") || "";
    const token = header.replace(/^Bearer\s+/i, "");
    if (!token || token === header) return json({ active: false, error: "Session required." }, 401, origin);
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData.user) return json({ active: false, error: "Session expired. Please sign in again." }, 401, origin);
    const { data: access, error: accessError } = await adminClient.from("user_access").select("is_active").eq("user_id", authData.user.id).maybeSingle();
    if (accessError) return json({ active: false, error: "Unable to verify account status." }, 503, origin);
    if (!access?.is_active) return json({ active: false, error: "This account is inactive." }, 403, origin);
    return json({ active: true }, 200, origin);
  }

  const username = (body.username || "").trim();
  const password = body.password || "";
  if (body.action && body.action !== "login") return json({ error: "Unsupported action." }, 400, origin);
  if (!username || username.length > 80 || !password || password.length > 1024) return json({ error: "Enter your username and password." }, 400, origin);
  const ip = req.headers.get("cf-connecting-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  const usernameKey = await digest("username:" + username.toLowerCase());
  const ipKey = await digest("ip:" + ip);
  const gate = async (key: string, action: string, limit: number) => {
    const { data, error } = await adminClient.rpc("login_attempt_gate", { p_attempt_key: key, p_action: action, p_limit: limit });
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  };
  try {
    const [userGate, ipGate] = await Promise.all([gate(usernameKey, "check", 5), gate(ipKey, "check", 20)]);
    if (!userGate?.allowed || !ipGate?.allowed) {
      const lock = userGate?.locked_until || ipGate?.locked_until;
      const seconds = lock ? Math.max(1, Math.ceil((new Date(lock).getTime() - Date.now()) / 1000)) : 900;
      return json({ error: "Too many failed attempts. Try again after the temporary lockout.", retry_after: seconds }, 429, origin);
    }
    const { data: account, error: accountError } = await adminClient.from("user_access").select("user_id,is_active").ilike("username", username).maybeSingle();
    if (accountError) return json({ error: "Login service temporarily unavailable." }, 503, origin);
    if (!account) {
      await Promise.all([gate(usernameKey, "failure", 5), gate(ipKey, "failure", 20)]);
      return json({ error: "Incorrect username or password." }, 401, origin);
    }
    if (!account.is_active) return json({ error: "This account is inactive. Contact the administrator." }, 403, origin);
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(account.user_id);
    const email = userData?.user?.email;
    if (userError || !email) return json({ error: "Login account is not configured. Contact the administrator." }, 503, origin);
    const bannedUntil = userData.user?.banned_until;
    if (bannedUntil && new Date(bannedUntil).getTime() > Date.now()) return json({ error: "This account is temporarily disabled." }, 403, origin);
    const { data: signedIn, error: signInError } = await authClient.auth.signInWithPassword({ email, password });
    if (signInError || !signedIn.session) {
      await Promise.all([gate(usernameKey, "failure", 5), gate(ipKey, "failure", 20)]);
      return json({ error: "Incorrect username or password." }, 401, origin);
    }
    await Promise.all([gate(usernameKey, "success", 5), gate(ipKey, "success", 20)]);
    return json({ session: signedIn.session }, 200, origin);
  } catch (_error) {
    return json({ error: "Login service temporarily unavailable. Please try again." }, 503, origin);
  }
});