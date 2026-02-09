import { constants } from "./constants.js?v=9";

export const state = {
  constants,

  canvas: null,
  ctx: null,
  baseLayer: null,
  fogLayer: null,
  baseCtx: null,
  fogCtx: null,

  dom: {},

  TILEPX: constants.DEFAULT_TILEPX,
  TICK_HZ: constants.DEFAULT_TICK_HZ,
  STEP_TIME: 1 / constants.DEFAULT_TICK_HZ,
  ASTAR_BUDGET: constants.DEFAULT_ASTAR_BUDGET,
  SAMPLE_K: constants.DEFAULT_SAMPLE_K,

  HP_LUMBER: constants.DEFAULT_HP_LUMBER,
  HP_MINER: constants.DEFAULT_HP_MINER,
  HP_HUNTER: constants.DEFAULT_HP_HUNTER,
  HP_SCOUT: constants.DEFAULT_HP_SCOUT,
  ANIMAL_HP: constants.DEFAULT_ANIMAL_HP,
  HP_BUILDER: constants.DEFAULT_HP_BUILDER,
  chopRate: constants.CHOP_RATE,
  mineRate: constants.MINE_RATE,

  ageIndex: 0,
  techs: {
    logging: false,
    doubleAxe: false,
    bowSaw: false,
    digging: false,
    bronze: false,
    casting: false,
  },

  grid: null,
  occupied: null,
  animalAt: null,
  explored: null,
  visible: null,
  visiblePrev: null,

  resType: null,
  resIdAt: null,

  trees: [],
  rocks: [],
  meats: [],
  animals: [],

  knownTreeIds: [],
  knownRockIds: [],
  knownMeatIds: [],

  storage: { x: 50, y: 50, wood: 0, ore: 0, food: 0 },
  buildings: [],
  buildingAt: null,

  units: [],
  workers: [],
  scouts: [],
  preferred: { type: null, id: null },

  dropTiles: [],
  parkTiles: [],
  dropReservedBy: null,
  parkReservedBy: null,
  dropOwner: null,
  parkOwner: null,

  hoverX: null,
  hoverY: null,

  visOffsetsWorker: [],
  visOffsetsScout: [],

  gScore: null,
  parent: null,
  seenStamp: null,
  closedStamp: null,
  stampCounter: 1,
  pathQueue: [],

  simState: "READY",
  tickCount: 0,
};

