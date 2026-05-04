export const PLANS = {
  FREE: {
    name: 'Free',
    maxUsers: 1,
    maxBookings: 3,
  },
  GROWTH: {
    name: 'Growth',
    maxUsers: 5,
    maxBookings: 300,
  },
  PRO: {
    name: 'Pro',
    maxUsers: 10,
    maxBookings: Infinity,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
