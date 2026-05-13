import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/alerts
 * Returns subscriptions renewing within the next 5 days for the logged-in user.
 * Each alert includes type: 'today' | 'tomorrow' | 'upcoming'
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const in5Days = new Date(today);
    in5Days.setDate(in5Days.getDate() + 5);

    // Fetch subs renewing in the next 5 days from Supabase
    const { data, error } = await supabase
      .from("subscriptions")
      .select("id, service_name, amount, billing_cycle, renewal_date, status")
      .eq("user_id", session.user.id)
      .neq("status", "paused")
      .gte("renewal_date", today.toISOString().split("T")[0])
      .lte("renewal_date", in5Days.toISOString().split("T")[0])
      .order("renewal_date", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const alerts = (data || []).map((sub) => {
      const renewal  = new Date(sub.renewal_date);
      renewal.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((renewal - today) / 86_400_000);

      let type, message;
      if (diffDays === 0) {
        type    = "today";
        message = `${sub.service_name} will charge you $${parseFloat(sub.amount).toFixed(2)} TODAY`;
      } else if (diffDays === 1) {
        type    = "tomorrow";
        message = `${sub.service_name} will charge you $${parseFloat(sub.amount).toFixed(2)} tomorrow`;
      } else {
        type    = "upcoming";
        message = `${sub.service_name} will charge you $${parseFloat(sub.amount).toFixed(2)} in ${diffDays} days`;
      }

      return {
        id:          sub.id,
        name:        sub.service_name,
        amount:      parseFloat(sub.amount),
        cycle:       sub.billing_cycle,
        renewalDate: sub.renewal_date,
        daysAway:    diffDays,
        type,
        message,
      };
    });

    return Response.json({ alerts });

  } catch (error) {
    console.error("Alerts API error:", error);
    return Response.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}
