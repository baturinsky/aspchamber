import { v2 } from "./v2";
import { Node } from "./chamber";

let levels: {
  name: string;
  friction?: number;
  nodes?: Node[];
  launchers?: { from: v2; vel: v2 }[];
  goals?: any[][];
  optional?: any[][];
  tip?: string;
}[] = [
  {
    name: "custom",
    tip: `Shift click level button to copy it to custom level editor. Then you can edit it and click "APPLY" to play
You may also want to click "RESET" after changing nodes position.`,
  },
  {
    name: "loop",
    nodes: [
      { at: [100, 150], mass: 0.1 },
      { at: [100, 160], mass: 0.3 },
    ],
    launchers: [
      {
        from: [5, 100],
        vel: [0.1, 0],
      },
    ],
    goals: [["totalLength", 400]],
    optional: [["totalLength", 550]],
    tip:
      "Drag nodes (circles) with mouse to meet the objectives (see top lright corner).",
  },
  {
    name: "Three lines",
    nodes: [
      { at: [100, 100], mass: 0.5 },
      { at: [130, 100], mass: -0.05 },
    ],
    launchers: [...new Array(3)].map((v, i) => ({
      from: [5, 100 + 10 * i],
      vel: [0.03, 0],
    })),
    goals: [["totalLength", 1400]],
    optional: [["totalLength", 1750]],
    tip:
      "Red nodes attract particles, blue repel them. Strength is usually dependent on node's size.",
  },
  {
    name: "nailed",
    nodes: [
      { at: [100, 150], mass: 0.1 },
      { at: [100, 160], mass: 0.3, nailed: true },
    ],
    launchers: [
      {
        from: [5, 100],
        vel: [0.2, 0],
      },
    ],
    goals: [["totalLength", 700]],
    optional: [["totalLength", 800]],
    tip: "Some nodes can't be moved.",
  },
  {
    name: "roadblock",
    nodes: [
      { at: [200, 150], mass: 0.1 },
      { at: [200, 200], mass: -0.1 },
      { at: [100, 100], mass: 0, radius: 50, nailed: true },
    ],
    launchers: [
      {
        from: [5, 100],
        vel: [0.1, 0],
      },
    ],
    goals: [["totalLength", 450]],
    optional: [["totalLength", 500]],
    tip: "White nodes neither attract nor repel particles.",
  },
  {
    name: "Blue",
    nodes: [
      { at: [130, 100], mass: 1 },
      { at: [100, 100], mass: -0.3 },
      { at: [160, 100], mass: 1 },
    ],
    launchers: [...new Array(3)].map((v, i) => ({
      from: [5, 100 + 10 * i],
      vel: [0.03, 0],
    })),
    goals: [["trailsHitNode", 1, 1]],
    optional: [["trailsHitNode", 3, 1]],
    tip: `You have to fullfill all goals, including optional, at once to get "gold" on level.`,
  },
  {
    name: "Each",
    nodes: [
      { at: [130, 100], mass: 2 },
      { at: [100, 100], mass: -0.5 },
      { at: [160, 100], mass: 2 },
    ],
    launchers: [...new Array(3)].map((v, i) => ({
      from: [5, 100 + 10 * i],
      vel: [0.03, 0],
    })),
    goals: [
      ["trailHitsNode", 0, 0],
      ["trailHitsNode", 1, 1],
      ["trailHitsNode", 2, 2],
    ],
    optional: [["totalLength", 1000]],
  },
  {
    name: "Switch",
    nodes: [
      { at: [130, 100], mass: 2 },
      { at: [100, 100], mass: -0.5 },
      { at: [160, 100], mass: 2 },
    ],
    launchers: [...new Array(3)].map((v, i) => ({
      from: [5, 100 + 10 * i],
      vel: [0.1, 0],
    })),
    goals: [
      ["trailHitsNode", 0, 2],
      ["trailHitsNode", 1, 1],
      ["trailHitsNode", 2, 0],
    ],
    optional: [["totalLength", 1000]],
  },
  {
    name: "radial",
    nodes: [
      { at: [200, 200], mass: 1, nailed: true },
      { at: [130, 100], mass: 1 },
      { at: [160, 100], mass: 1 },
    ],
    launchers: [...new Array(6)].map((v, i) => ({
      from: [
        100 + Math.sin((i * 6.28) / 6) * 3,
        100 + Math.cos((i * 6.28) / 6) * 3,
      ],
      vel: [Math.sin((i * 6.28) / 6) * 0.1, Math.cos((i * 6.28) / 6) * 0.1],
    })),
    goals: [
      ["trailsHitNode", 2, 0],
      ["trailsHitNode", 2, 1],
      ["trailsHitNode", 2, 2],
    ],
    optional: [["totalLength", 2000]],
  },
  {
    name: "converge",
    nodes: [
      { at: [180, 180], mass: 1, nailed: true },
      { at: [130, 100], mass: 1 },
    ],
    launchers: [...new Array(6)].map((v, i) => ({
      from: [
        100 + Math.sin((i * 6.28) / 6) * 3,
        100 + Math.cos((i * 6.28) / 6) * 3,
      ],
      vel: [Math.sin((i * 6.28) / 6) * 0.1, Math.cos((i * 6.28) / 6) * 0.1],
    })),
    goals: [["trailsHitNode", 5, 0]],
    optional: [["trailsHitNode", 1, 1]],
  },
  {
    name: "implosion",
    nodes: [
      { at: [200, 100], mass: -0.1, radius: 10, nailed: true },
      { at: [100, 100], mass: -1 },
      { at: [160, 100], mass: 2 },
    ],
    launchers: [...new Array(10)].map((v, i) => ({
      from: [100 + 20 * i, 295],
      vel: [0, -0.1],
    })),
    goals: [["trailsHitNode", 8, 0]],
    optional: [["trailsHitNode", 10, 0]],
  },
  {
    name: "10-5",
    nodes: [...new Array(5)].map((v, i) => ({
      at: [150 + i * 20, 100],
      mass: 0.5,
    })),
    launchers: [...new Array(10)].map((v, i) => ({
      from: [100 + 20 * i, 295],
      vel: [0, -0.1],
    })),
    goals: [["trailsHitNode", 6, 0]],
    optional: [["trailsHitNode", 7, 0]],
  },
  {
    name: "10-5 fixed",
    nodes: [...new Array(5)].map((v, i) => ({
      at: [150 + i * 20, 100],
      mass: 0.5,
      nailed: i == 2,
    })),
    launchers: [...new Array(10)].map((v, i) => ({
      from: [100 + 20 * i, 295],
      vel: [0, -0.1],
    })),
    goals: [["trailsHitNode", 4, 2]],
    optional: [["trailsHitNode", 5, 2]],
  },
  {
    name: "split",
    friction: 0,
    nodes: [
      { at: [300, 100], mass: 0, radius: 4, nailed: true },
      { at: [300, 120], mass: 0, radius: 4, nailed: true },
      { at: [300, 140], mass: 0, radius: 4, nailed: true },
      { at: [300, 160], mass: 0, radius: 4, nailed: true },
      { at: [300, 180], mass: 0, radius: 4, nailed: true },
      { at: [300, 200], mass: 0, radius: 4, nailed: true },
      { at: [100, 100], mass: 1 },
      { at: [160, 100], mass: 1 },
    ],
    launchers: [...new Array(6)].map((v, i) => ({
      from: [5, 80 + 1 * i],
      vel: [0.1, 0],
    })),
    goals: [["trailsHitNode", 1, 0],["trailsHitNode", 1, 1],["trailsHitNode", 1, 2],["trailsHitNode", 1, 3],],
    optional: [["trailsHitNode", 1, 4],["trailsHitNode", 1, 5]],
  },
  {
    name: "forest",
    nodes: [{
      at: [375, 150],
      mass: 0,
      nailed: true,
      radius: 5
    }].concat([...new Array(35)].map((v, i) => ({
      at: [50 * (i%7 + 1), 50 * (~~(i/7) + 1)],
      mass: 0.5,
      nailed: i%10
    })) as any),
    launchers: [{
      from: [0, 150],
      vel: [0.1, 0],
    }],
    goals: [["trailsHitNode", 1, 0]],
    optional: [["totalLength", 450]],
  },  
];

export default levels;
