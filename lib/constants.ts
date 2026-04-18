// Crowd density thresholds (0–1 scale)
export const CROWD_THRESHOLDS = {
  LOW: 0.3,
  MEDIUM: 0.6,
  HIGH: 0.85,
} as const;

// CSS color classes for each density tier
export const CROWD_COLORS = {
  LOW: "text-green-500",
  MEDIUM: "text-yellow-500",
  HIGH: "text-orange-500",
  CRITICAL: "text-red-500",
} as const;

// Wait time estimates in seconds per density tier
export const WAIT_TIME_SECONDS = {
  LOW: 60,
  MEDIUM: 180,
  HIGH: 360,
  CRITICAL: 600,
} as const;

// Routing: how much crowd penalizes an edge weight
export const CROWD_PENALTY_FACTOR = 2.5;

// Mock data update interval in milliseconds
export const MOCK_UPDATE_INTERVAL_MS = 3000;

// Order pickup code length
export const PICKUP_CODE_LENGTH = 4;

// Group session code length
export const GROUP_CODE_LENGTH = 6;

// Routing constants
export const USER_SEAT_NODE_ID = "n-seat";
export const CROWD_PENALTY_MAX = 2.0;
export const WALKING_SPEED_SVG_PER_SEC = 12;
export const ROUTING_ETA_ROUND_TO_SEC = 5;

// Match event density profiles
export const MATCH_EVENTS = {
  START: "match_start",
  HALFTIME: "halftime",
  GOAL: "goal_celebration",
  FINAL_QUARTER: "final_quarter_lull",
  END: "match_end",
  RESET: "reset",
} as const;

export type MatchEvent = (typeof MATCH_EVENTS)[keyof typeof MATCH_EVENTS];
