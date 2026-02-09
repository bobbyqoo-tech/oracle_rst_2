export const constants = {
  W: 100,
  H: 100,
  Tile: { Empty: 0, Block: 1, Storage: 2 },
  ResT: { None: 0, Tree: 1, Rock: 2, Meat: 3 },

  WORKER_CARRY_CAP: 10,

  CHOP_RATE: 1,
  MINE_RATE: 1,
  MEAT_RATE: 1,
  TREE_MIN: 18,
  TREE_MAX: 55,
  ROCK_MIN: 25,
  ROCK_MAX: 70,
  MEAT_MIN: 14,
  MEAT_MAX: 35,

  ATK_DAMAGE: 1,
  ATK_INTERVAL: 1.0,
  FLEE_HP_FRAC: 0.20,
  FLEE_HIT_FRAC: 0.60,
  HUNTER_RESUME_HP_FRAC: 0.60,
  HUNTER_HEAL_INTERVAL: 1.0,

  ANIMAL_MOVE_INTERVAL: 2.0,
  ANIMAL_WANDER_R: 6,
  ANIMAL_LEASH_R: 12,
  ANIMAL_MIN_DIST: 4,
  ANIMAL_THINK_MIN: 0.7,
  ANIMAL_THINK_MAX: 1.6,

  STORAGE_RING_R: 1,
  PARK_RING_R: 2,
  PUSH_STUCK_TICKS: 6,
  PUSH_NEAR_STORAGE_R: 5,

  DEFAULT_TILEPX: 7,
  DEFAULT_TICK_HZ: 20,
  DEFAULT_ASTAR_BUDGET: 12,
  DEFAULT_SAMPLE_K: 45,
  DEFAULT_HP_LUMBER: 10,
  DEFAULT_HP_MINER: 10,
  DEFAULT_HP_HUNTER: 12,
  DEFAULT_HP_SCOUT: 8,
  DEFAULT_ANIMAL_HP: 18,

  AGES: ["Ancient", "Classical", "Medieval"],

  DIRS8: [
    { dx: 1, dy: 0, c: 1 }, { dx: -1, dy: 0, c: 1 }, { dx: 0, dy: 1, c: 1 }, { dx: 0, dy: -1, c: 1 },
    { dx: 1, dy: 1, c: Math.SQRT2 }, { dx: 1, dy: -1, c: Math.SQRT2 }, { dx: -1, dy: 1, c: Math.SQRT2 }, { dx: -1, dy: -1, c: Math.SQRT2 },
  ],
};

