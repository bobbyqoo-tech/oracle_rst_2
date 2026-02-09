# Mini RTS Simulation Demo

> Deprecated on 2026-02-09. Use `PROJECT_CONTEXT_MERGED.md` going forward.

## Architecture
- Single file HTML project
- All logic is inside index.html
- No module splitting allowed
- Performance budget system must be preserved
- Simulation tick based

## World
- 2D grid map
- Fog of war
- Resource clusters

## Unit Types
### Worker
- Gather wood
- Gather ore
- Flee when HP < 20%

### Hunter
- Hunt animals
- Gather meat
- Same flee behaviour as workers

### Scout
- Explore fog using frontier sampling

## Animal AI
- Wander around home radius
- Chase attacker
- Stop chase beyond leash radius
- Drop meat resource when killed

## Combat Rules
- All units attack = 1 damage per second
- Units have HP system

## Storage Logic
- Uses dropoff ring
- Uses parking system
- Uses yield / push system

## Performance Rules
- Must use pathfinding budget
- Must use fog incremental update
- Avoid full map scanning
- Avoid per unit BFS

## Development Goal
- This is a demo project
- Maintain visual clarity over realism
- Maintain stability over feature complexity

Language Rule:
User instructions may be in Traditional Chinese.
Technical keywords remain in English.
