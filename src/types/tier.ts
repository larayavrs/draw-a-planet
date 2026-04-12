export type UserTier = "guest" | "registered" | "premium";

export type PlanetType =
  | "rocky"
  | "gaseous"
  | "icy"
  | "lava"
  | "ocean"
  | "desert"
  | "ringed";

export type StarType =
  | "yellow_dwarf"
  | "red_dwarf"
  | "blue_giant"
  | "white_dwarf"
  | "neutron";

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "cancelled"
  | "trialing"
  | "pending";

export type SubscriptionPlan = "monthly" | "annual";
