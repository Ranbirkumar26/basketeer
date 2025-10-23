import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { basketId } = await req.json();

    if (!basketId) {
      throw new Error('Basket ID is required');
    }

    console.log('Sending threshold notification for basket:', basketId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch basket details
    const { data: basket, error: basketError } = await supabase
      .from('baskets')
      .select(`
        *,
        profiles!creator_id (
          full_name,
          email
        )
      `)
      .eq('id', basketId)
      .single();

    if (basketError || !basket) {
      throw new Error('Basket not found');
    }

    // Check if threshold is met
    if (basket.current_total < basket.threshold_amount) {
      return new Response(
        JSON.stringify({ success: false, message: 'Threshold not yet met' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Send email to basket creator
    const emailData = {
      from: 'Basketeer <onboarding@resend.dev>',
      to: [basket.profiles.email],
      subject: `🎉 Your ${basket.platform} basket has reached the threshold!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ff6b35 0%, #0ea59b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .stats { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .stat-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
              .footer { text-align: center; color: #888; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Threshold Reached!</h1>
              </div>
              <div class="content">
                <p>Hi ${basket.profiles.full_name},</p>
                <p>Great news! Your <strong>${basket.platform}</strong> basket has reached the minimum threshold and is ready to place the order!</p>
                
                <div class="stats">
                  <div class="stat-row">
                    <span>Platform:</span>
                    <strong>${basket.platform}</strong>
                  </div>
                  <div class="stat-row">
                    <span>Threshold Amount:</span>
                    <strong>₹${basket.threshold_amount}</strong>
                  </div>
                  <div class="stat-row">
                    <span>Current Total:</span>
                    <strong>₹${basket.current_total}</strong>
                  </div>
                  <div class="stat-row">
                    <span>Status:</span>
                    <strong style="color: #2ecc71;">✓ Ready to Order</strong>
                  </div>
                </div>

                <p>You can now close the basket and proceed to place your collaborative order!</p>
                
                <div style="text-align: center;">
                  <a href="${supabaseUrl.replace('https://pxeridbphoqeufjwdmhy.supabase.co', 'https://a98d822d-f37f-4a7d-bc43-5c5c730a7129.lovableproject.com')}/basket/${basketId}" class="button">
                    View Basket Details
                  </a>
                </div>

                <p style="color: #888; font-size: 14px; margin-top: 30px;">
                  <strong>Tip:</strong> Log in to your Basketeer account to close the basket and coordinate with your group for order placement.
                </p>
              </div>
              <div class="footer">
                <p>This is an automated notification from Basketeer</p>
                <p>Happy collaborative shopping! 🛒</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    const { error: emailError } = await resend.emails.send(emailData);

    if (emailError) {
      console.error('Error sending email:', emailError);
      throw emailError;
    }

    console.log('Email sent successfully to:', basket.profiles.email);

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-threshold-notification function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send notification';
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});