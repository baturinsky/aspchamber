import { greek, latin, localFixed } from "./util";
import { v2, v2Add, v2Copy, v2Dif, v2Dist, v2From, v2Len, v2Mul } from "./v2";
export type Node = {
  at: v2;
  mass: number;
  radius?: number;
  nailed?: boolean;
  id?: number;
};

function parseNodes(data: Node[]): Node[] {
  return data.map((p, i) => {
    p.radius = p.radius || Math.abs(p.mass) ** (1 / 3) * 5;
    p.id = i;
    return p;
  });
}

function pull(at: v2, to: v2, mass) {
  let delta = v2Dif(at, to);
  let len = v2Len(delta);
  v2Mul(delta, mass / len ** 3);
  return delta;
}

export class Chamber {
  nodes: Node[] = [];
  initialPositions: v2[];
  trails: { path: v2[]; length: number; end: Node }[] = [];
  totalLength: number;

  constructor(
    public name: string,
    public friction = 0.001,
    nodesData: Node[] = [],
    public launchers: { from: v2; vel: v2 }[] = [],
    public goals: any[][] = [],
    public optional: any[][] = [],
    public tip?:string
  ) {
    this.nodes = parseNodes(nodesData);
    this.initialPositions = this.nodes.map((n) => v2From(n.at));
  }

  nodeAt(at: v2) {
    return this.nodes.find(
      (p) => v2Dist(at, p.at) < Math.max(5, p.radius) + 0.5
    );
  }

  genTrail(
    source: v2,
    initialVel: v2
  ): { path: v2[]; length: number; end: Node } {
    let path: v2[] = [];
    let at = v2Copy(source);
    let vel = v2Copy(initialVel);
    let end: Node = null;
    let length = 0;
    for (let i = 0; i < 1500; i++) {
      for (let segLength = 0, j = 0; segLength < 3 && j < 10; j++) {
        for (let p of this.nodes) {
          v2Add(vel, pull(at, p.at, p.mass));
          let len = v2Len(vel);
          segLength += len;
          length += len;
          v2Add(at, vel);
          if (v2Dist(p.at, at) < p.radius) end = p;
        }
        v2Mul(vel, 1 - this.friction);
        if (end || at[0] < 0 || at[1] < 0 || at[0] > 400 || at[1] > 300) {
          path.push(at.slice());
          return { path, length, end };
        }
      }
      path.push(at.slice());
    }
    return { path, length, end };
  }

  update() {
    this.trails = this.launchers.map((launcher) =>
      this.genTrail(launcher.from, launcher.vel)
    );
    this.totalLength = this.trails.reduce((a, b) => a + b.length, 0);
  }

  serialize() {
    return this.nodes.map((node) => [node.at[0], node.at[1]]);
  }

  deserialize(data: v2[]) {
    if (!data) return;
    for (let i = 0; i < data.length; i++) {
      if (data[i] && data[i].length && this.nodes[i])
        this.nodes[i].at = v2From(data[i]);
    }
  }

  reset() {
    for (let i in this.initialPositions) {
      this.nodes[i].at = v2From(this.initialPositions[i]);
    }
  }

  checkGoal(goal: any[]) {
    let type = goal[0];
    let solved = false,
      text = "";
    let a = Number(goal[1]);
    let b = Number(goal[2]);
    switch (type) {
      case "totalLength":
        let target = a;
        solved = this.totalLength >= target;
        text = `Total trail length at least: ${localFixed(
          this.totalLength,
          0
        )} / ${localFixed(target, 0)}`;
        break;
      case "trailsHitNode":
        {
          let node = this.nodes[b];
          let hits = this.trails.filter((t) => t.end == node).length;
          solved = hits >= a;
          text = `At least ${hits}/${a} trail${a>0?'s':''} hit ${greek(b)}`;
        }
        break;
      case "trailHitsNode":
        {
          let node = this.nodes[b];
          solved = this.trails[a].end == node;
          text = `${latin(a)} hits ${greek(b)}`;
        }
        break;
    }
    return { solved, text };
  }

  checkGoals() {
    let goals = this.goals.map((goal) => this.checkGoal(goal));
    let solved = goals.every((goal) => goal.solved);
    return { goals, solved };
  }

  checkOptional() {
    if (!this.optional) return { goals: [], solved: true };
    let goals = this.optional.map((goal) => this.checkGoal(goal));
    let solved = goals.every((goal) => goal.solved);
    return { goals, solved };
  }
}
