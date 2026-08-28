import { createServerFn } from "@tanstack/react-start";

export const getClassOccupancy = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ class_time: string; participants: number }[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("get_class_occupancy");
    if (error) throw new Error(error.message);
    return (data ?? []) as { class_time: string; participants: number }[];
  },
);

export const getRegistrationCount = createServerFn({ method: "GET" }).handler(
  async (): Promise<number> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("get_registration_count" as never);
    if (error) throw new Error(error.message);
    return (data as number | null) ?? 0;
  },
);
