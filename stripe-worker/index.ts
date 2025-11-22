export interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_PRICE_ID: string;
  APP_ORIGIN: string; // e.g. https://dailyrebuild.com
}

const STRIPE_API = "https://api.stripe.com/v1";

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(env.APP_ORIGIN),
      });
    }

    if (url.pathname === "/create-checkout-session" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const successUrl = body.successUrl || `${env.APP_ORIGIN}/caleya/success`;
      const cancelUrl = body.cancelUrl || `${env.APP_ORIGIN}/caleya`;

      const form = new URLSearchParams();
      form.set("mode", "subscription");
      form.set("success_url", successUrl + "?session_id={CHECKOUT_SESSION_ID}");
      form.set("cancel_url", cancelUrl);
      form.append("line_items[0][price]", env.STRIPE_PRICE_ID);
      form.append("line_items[0][quantity]", "1");
      form.set("allow_promotion_codes", "true");

      const stripeRes = await fetch(`${STRIPE_API}/checkout/sessions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });

      const data = await stripeRes.json();
      return json({ url: data.url }, env);
    }

    return new Response("Not found", { status: 404, headers: corsHeaders(env.APP_ORIGIN) });
  },
};

function json(data: any, env: Env) {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(env.APP_ORIGIN),
    },
  });
}

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };
}
