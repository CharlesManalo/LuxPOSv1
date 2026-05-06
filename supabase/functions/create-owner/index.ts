import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify caller is an admin
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);

    if (!authHeader) throw new Error("No authorization header");

    console.log("SUPABASE_URL:", Deno.env.get("SUPABASE_URL"));
    console.log("SERVICE_KEY present:", !!Deno.env.get("SERVICE_ROLE_KEY"));

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!,
    );

    // Verify caller is admin
    const {
      data: { user },
      error: authErr,
    } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
    console.log("User from token:", user?.id, "Error:", authErr?.message);

    if (authErr || !user) throw new Error("Unauthorized");

    const { data: callerData, error: callerErr } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("auth_id", user.id)
      .single();

    console.log("Caller role:", callerData?.role, "Error:", callerErr?.message);

    // Return debug info instead of throwing
    if (callerData?.role !== "admin") {
      return new Response(
        JSON.stringify({
          error: "Only admins can create owners",
          debug: {
            userId: user?.id,
            role: callerData?.role,
            callerError: callerErr?.message,
            authError: authErr?.message,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { email, password, shopName, slug, logo_url } = await req.json();

    // 1. Create tenant
    const { data: tenant, error: tenantErr } = await supabaseAdmin
      .from("tenants")
      .insert({
        name: shopName,
        slug,
        logo_url: logo_url || null,
        owner_email: email,
        receipt_printing_enabled: true,
        receipt_config: {
          header_text: shopName,
          address: "",
          contact_number: "",
          footer_message: "Thank you!",
          paper_width: "80mm",
          show_cashier_name: true,
        },
      })
      .select()
      .single();

    if (tenantErr)
      throw new Error("Failed to create tenant: " + tenantErr.message);

    // 2. Create auth user (no email confirmation needed)
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // skip email confirmation
      });

    if (authError) {
      await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
      throw new Error("Failed to create auth user: " + authError.message);
    }

    // 3. Create public.users record
    const { data: newUser, error: userErr } = await supabaseAdmin
      .from("users")
      .insert({
        auth_id: authData.user.id,
        tenant_id: tenant.id,
        email,
        full_name: shopName,
        role: "owner",
        is_active: true,
      })
      .select()
      .single();

    if (userErr) {
      console.error("Failed to create user record:", userErr);
    }

    // 4. Link owner back to tenant
    await supabaseAdmin
      .from("tenants")
      .update({ owner_user_id: newUser?.id })
      .eq("id", tenant.id);

    return new Response(
      JSON.stringify({ success: true, tenant, user: authData.user }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
