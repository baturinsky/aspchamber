(function () {
  'use strict';

  function capitalize(s) {
      return s[0].toUpperCase() + s.substr(1);
  }
  function localFixed(n, digits = 2) {
      return n.toLocaleString(undefined, { maximumFractionDigits: digits });
  }
  function greek(n) {
      return String.fromCharCode('\u{03B1}'.charCodeAt(0) + Number(n));
  }
  function latin(n) {
      return String.fromCharCode('A'.charCodeAt(0) + Number(n));
  }

  function v2From(v) {
      return new Float32Array(v);
  }
  function v2Copy(v) {
      return new Float32Array(v);
  }
  function v2Len(v) {
      return Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2));
  }
  function v2Dist(a, b) {
      return v2Len(v2Dif(a, b));
  }
  function v2Dif(a, b) {
      return new Float32Array([b[0] - a[0], b[1] - a[1]]);
  }
  function v2Sum(a, b) {
      return new Float32Array([a[0] + b[0], a[1] + b[1]]);
  }
  function v2Normalized(v, n = 1) {
      const scale = n / (v2Len(v) || 1);
      return new Float32Array([v[0] * scale, v[1] * scale]);
  }
  function v2Add(a, b) {
      a[0] += b[0];
      a[1] += b[1];
  }
  function v2Mul(v, n) {
      v[0] *= n;
      v[1] *= n;
  }

  function parseNodes(data) {
      return data.map((p, i) => {
          p.radius = p.radius || Math.pow(Math.abs(p.mass), (1 / 3)) * 5;
          p.id = i;
          return p;
      });
  }
  function pull(at, to, mass) {
      let delta = v2Dif(at, to);
      let len = v2Len(delta);
      v2Mul(delta, mass / Math.pow(len, 3));
      return delta;
  }
  class Chamber {
      constructor(name, friction = 0.001, nodesData = [], launchers = [], goals = [], optional = [], tip) {
          this.name = name;
          this.friction = friction;
          this.launchers = launchers;
          this.goals = goals;
          this.optional = optional;
          this.tip = tip;
          this.nodes = [];
          this.trails = [];
          this.nodes = parseNodes(nodesData);
          this.initialPositions = this.nodes.map((n) => v2From(n.at));
      }
      nodeAt(at) {
          return this.nodes.find((p) => v2Dist(at, p.at) < Math.max(5, p.radius) + 0.5);
      }
      genTrail(source, initialVel) {
          let path = [];
          let at = v2Copy(source);
          let vel = v2Copy(initialVel);
          let end = null;
          let length = 0;
          for (let i = 0; i < 1500; i++) {
              for (let segLength = 0, j = 0; segLength < 3 && j < 10; j++) {
                  for (let p of this.nodes) {
                      v2Add(vel, pull(at, p.at, p.mass));
                      let len = v2Len(vel);
                      segLength += len;
                      length += len;
                      v2Add(at, vel);
                      if (v2Dist(p.at, at) < p.radius)
                          end = p;
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
          this.trails = this.launchers.map((launcher) => this.genTrail(launcher.from, launcher.vel));
          this.totalLength = this.trails.reduce((a, b) => a + b.length, 0);
      }
      serialize() {
          return this.nodes.map((node) => [node.at[0], node.at[1]]);
      }
      deserialize(data) {
          if (!data)
              return;
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
      checkGoal(goal) {
          let type = goal[0];
          let solved = false, text = "";
          let a = Number(goal[1]);
          let b = Number(goal[2]);
          switch (type) {
              case "totalLength":
                  let target = a;
                  solved = this.totalLength >= target;
                  text = `Total trail length at least: ${localFixed(this.totalLength, 0)} / ${localFixed(target, 0)}`;
                  break;
              case "trailsHitNode":
                  {
                      let node = this.nodes[b];
                      let hits = this.trails.filter((t) => t.end == node).length;
                      solved = hits >= a;
                      text = `At least ${hits}/${a} trail${a > 0 ? 's' : ''} hit ${greek(b)}`;
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
          if (!this.optional)
              return { goals: [], solved: true };
          let goals = this.optional.map((goal) => this.checkGoal(goal));
          let solved = goals.every((goal) => goal.solved);
          return { goals, solved };
      }
  }

  function initControls(C, callbacks) {
      let mouse = {};
      onkeydown = (e) => {
          switch (e.code) {
              case "Space":
                  callbacks.pause();
                  break;
          }
      };
      function scaleToScreen(at) {
          at[0] *= 400 / C.width;
          at[1] *= 300 / C.height;
          return at;
      }
      function updatePosition(m) {
          let Crect = C.getBoundingClientRect();
          mouse.at = scaleToScreen([m.clientX - Crect.left, m.clientY - Crect.top]);
      }
      document.addEventListener("mousedown", (e) => {
          let el = e.target;
          if (el && el.id && el.tagName == "BUTTON") {
              if (e.shiftKey)
                  callbacks.shiftButton(el.id.split(":"));
              else
                  callbacks.button(el.id.split(":"));
          }
      });
      C.onmousedown = (m) => {
          if (m.button == 0)
              callbacks.mousedown();
      };
      C.onmouseup = (m) => {
          if (m.button == 0)
              callbacks.mouseup();
      };
      C.onmousemove = (m) => {
          updatePosition(m);
          callbacks.mousemove(scaleToScreen([m.movementX, m.movementY]));
      };
      return mouse;
  }

  let levels = [
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
          tip: "Drag nodes (circles) with mouse to meet the objectives (see top lright corner).",
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
          tip: "Red nodes attract particles, blue repel them. Strength is usually dependent on node's size.",
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
          goals: [["trailsHitNode", 1, 0], ["trailsHitNode", 1, 1], ["trailsHitNode", 1, 2], ["trailsHitNode", 1, 3],],
          optional: [["trailsHitNode", 1, 4], ["trailsHitNode", 1, 5]],
      },
      {
          name: "forest",
          nodes: [{
                  at: [375, 150],
                  mass: 0,
                  nailed: true,
                  radius: 5
              }].concat([...new Array(35)].map((v, i) => ({
              at: [50 * (i % 7 + 1), 50 * (~~(i / 7) + 1)],
              mass: 0.5,
              nailed: i % 10
          }))),
          launchers: [{
                  from: [0, 150],
                  vel: [0.1, 0],
              }],
          goals: [["trailsHitNode", 1, 0]],
          optional: [["totalLength", 450]],
      },
      {
          name: "blue forest",
          nodes: [...new Array(35)].map((v, i) => ({
              at: [50 * (i % 7 + 1), 50 * (~~(i / 7) + 1)],
              mass: i % 10 ? -1 : -0.1,
              nailed: i % 10
          })),
          launchers: [{
                  from: [0, 150],
                  vel: [0.1, 0],
              }],
          goals: [["totalLength", 800]],
          optional: [["totalLength", 1300]],
      },
      {
          name: "orbit",
          nodes: [
              { at: [310, 150], mass: 0, radius: 3, nailed: true },
              { at: [20, 100], mass: 0.3 },
              { at: [20, 120], mass: 0.3 },
              { at: [20, 140], mass: 0.3 },
              { at: [20, 160], mass: 0.3 },
              { at: [20, 180], mass: 0.3 },
              { at: [200, 150], mass: 30, radius: 100, nailed: true },
          ],
          launchers: [
              {
                  from: [5, 150],
                  vel: [0.1, 0],
              },
          ],
          goals: [["trailsHitNode", 1, 0]],
          optional: [["totalLength", 470]],
          tip: "White nodes neither attract nor repel particles.",
      },
  ];

  let noiseC = document.createElement('canvas');
  noiseC.width = 2000;
  noiseC.height = 1000;
  let noiseCtx = noiseC.getContext('2d');
  let cdata = noiseCtx.getImageData(0, 0, noiseC.width, noiseC.height);
  for (let i = 3; i < cdata.data.length; i += 4) {
      cdata.data[i] = ~~(Math.random() * 100);
  }
  noiseCtx.putImageData(cdata, 0, 0);
  function render({ C, chamber, }) {
      let cc = C.getContext('2d');
      cc.save();
      cc.scale(C.width / 400, C.height / 300);
      cc.fillStyle = '#000';
      cc.clearRect(0, 0, 400, 300);
      cc.strokeStyle = '#030';
      for (let i = 0; i < 400; i += 10) {
          cc.lineWidth = 0.5;
          cc.strokeStyle = i % 100 == 0 ? '#003800' : i % 50 == 0 ? '#002800' : '#001800';
          cc.beginPath();
          cc.moveTo(i, 0);
          cc.lineTo(i, 300);
          cc.stroke();
          cc.beginPath();
          cc.moveTo(0, i);
          cc.lineTo(600, i);
          cc.stroke();
      }
      cc.strokeStyle = '#fff';
      cc.lineWidth = 0.3;
      cc.fillStyle = '#fff';
      cc.font = 'italic bold 4pt Courier';
      for (let i = 0; i < chamber.trails.length; i++) {
          let { path } = chamber.trails[i];
          cc.fillText(`${String.fromCharCode('A'.charCodeAt(0) + i)}`, path[0][0] - 5, path[0][1] + 1);
          if (i > 0)
              cc.strokeStyle = `hsl(${i * 55},50%,50%)`;
          else
              cc.strokeStyle = '#fff';
          cc.lineWidth = 0.5;
          cc.beginPath();
          cc.moveTo(path[0][0], path[0][1]);
          for (let i = 1; i < path.length; i++) {
              if (i % 10 == 1)
                  cc.lineWidth = Math.min(2, v2Dist(path[i], path[i - 1]) / 20);
              //cc.lineWidth = 10;
              cc.lineTo(path[i][0], path[i][1]);
              cc.stroke();
          }
      }
      cc.lineWidth = 0.5;
      for (let [i, p] of Object.entries(chamber.nodes).reverse()) {
          cc.fillStyle = cc.strokeStyle =
              p.mass > 0 ? '#f00' : p.mass < 0 ? '#00f' : '#fff';
          cc.beginPath();
          cc.arc(p.at[0], p.at[1], p.radius, 0, 6.283);
          if (p.nailed) {
              cc.save();
              cc.fillStyle = p.mass > 0 ? '#800' : p.mass < 0 ? '#008' : '#888';
              cc.fill();
              cc.restore();
          }
          cc.stroke();
          cc.font = 'italic bold 4pt Courier';
          cc.fillText(greek(i), p.at[0] + p.radius + 2, p.at[1] + 2);
      }
      cc.fillStyle = '#fff';
      cc.font = '5pt Courier';
      //cc.fillText(Math.round(chamber.totalLength).toLocaleString(), 10, 10);
      cc.fillText(`${capitalize(chamber.name)}`, 5, 10);
      cc.fillText(`Friction: ${chamber.friction.toLocaleString()}`, 5, 20);
      let goals = chamber.checkGoals();
      let optional = chamber.checkOptional();
      let combined = [].concat(goals.goals, optional.goals);
      cc.font = 'bold 4pt Courier';
      for (let i = 0; i < combined.length; i++) {
          let goal = combined[i];
          let text = (i >= goals.goals.length ? 'Optional: ' : '') + goal.text;
          cc.fillStyle =
              i < goals.goals.length
                  ? goal.solved
                      ? '#0f0'
                      : '#f00'
                  : goal.solved
                      ? '#ff0'
                      : '#aaa';
          cc.fillText(text, 395 - cc.measureText(text).width, 10 + i * 8);
      }
      if (chamber.tip) {
          cc.fillStyle = "#fff";
          let tips = chamber.tip.split("\n");
          for (let i = 0; i < tips.length; i++) {
              cc.fillText(tips[i], (400 - cc.measureText(tips[i]).width) / 2, 300 + 10 * (i - tips.length));
          }
      }
      cc.drawImage(noiseC, 0, 0);
      C.style.border = `solid 1px #${goals.solved ? (optional.solved ? 'ff0' : '0f0') : 'f00'}`;
      cc.restore();
  }

  let C = document.getElementById("C");
  let needRedraw = true;
  function scaleToWindow() {
      C.width = Math.min(window.innerWidth * 0.8, window.innerHeight * 1.2);
      C.height = (C.width * 3) / 4;
      needRedraw = true;
  }
  function chamberFromObject({ name, friction, nodes, launchers, goals, optional, tip, }) {
      return new Chamber(name, friction, nodes, launchers, goals, optional, tip);
  }
  let chambers = JSON.parse(JSON.stringify(levels)).map(chamberFromObject);
  let currentChamber = 1;
  let solvedChambers = {};
  load();
  function serialize() {
      let chambersByName = {};
      for (let chamber of chambers) {
          chambersByName[chamber.name] = chamber.serialize();
      }
      let str = JSON.stringify({
          chambers: chambersByName,
          currentChamber,
          solvedChambers,
      });
      return str;
  }
  function save() {
      let saveString = serialize();
      localStorage["aspchamber"] = saveString;
  }
  function load() {
      let saveString = localStorage["aspchamber"];
      if (saveString) {
          let save = JSON.parse(saveString);
          currentChamber = save.currentChamber;
          solvedChambers = save.solvedChambers || {};
          for (let chamber of chambers) {
              chamber.deserialize(save.chambers[chamber.name]);
          }
      }
  }
  function newGame() {
      let draggedNode = null;
      let buttonsDiv = document.getElementById("buttons");
      buttonsDiv.innerHTML =
          `<button id="reset">RESET</button>` +
              chambers
                  .map((c, i) => `<button id="chamber:${i}">${capitalize(c.name)}</button>`)
                  .slice(1)
                  .join("") +
              `<button id="custom">CUSTOM</button><textarea id="customEdit" value="123"></textarea><button id="apply">APPLY</button>`;
      function renderAll() {
          render({ C, chamber: chambers[currentChamber] });
          for (let i = 0; i < chambers.length; i++) {
              let button = document.getElementById(i == 0 ? "custom" : `chamber:${i}`);
              let solved = solvedChambers[chambers[i].name];
              button.classList.remove("done0", "done1", "done2", "current");
              button.classList.add("done" + (solved || 0));
              if (i == currentChamber)
                  button.classList.add("current");
          }
          for (let id of ["customEdit", "apply"])
              document.getElementById(id).style.display =
                  currentChamber == 0 ? "block" : "none";
          needRedraw = false;
      }
      let mouse = initControls(C, {
          mousedown: () => {
              draggedNode = chambers[currentChamber].nodeAt(mouse.at);
          },
          mouseup: () => {
              draggedNode = null;
          },
          mousemove: (delta) => {
              let c = chambers[currentChamber];
              if (draggedNode && !draggedNode.nailed) {
                  let newPos = v2Sum(draggedNode.at, delta);
                  let r = draggedNode.radius;
                  let blocked = null;
                  let blockingLauncher = c.launchers.find((l) => v2Dist(l.from, newPos) < r + 5);
                  let blockingNode = c.nodes.find((n) => n !== draggedNode && v2Dist(n.at, draggedNode.at) < n.radius + r);
                  blocked = (blockingLauncher && blockingLauncher.from) || (blockingNode && blockingNode.at);
                  if (blocked)
                      v2Add(draggedNode.at, v2Normalized(v2Dif(blocked, draggedNode.at)));
                  else
                      draggedNode.at = newPos;
                  needRedraw = true;
              }
          },
          button: (cmd) => {
              switch (cmd[0]) {
                  case "chamber":
                      currentChamber = Number(cmd[1]);
                      break;
                  case "reset":
                      chambers[currentChamber].reset();
                      break;
                  case "custom":
                      currentChamber = 0;
                      break;
                  case "apply":
                      chambers[0] = chamberFromObject(JSON.parse(document.getElementById("customEdit")
                          .value));
                      break;
              }
              needRedraw = true;
          },
          shiftButton: (cmd) => {
              switch (cmd[0]) {
                  case "chamber":
                      if (currentChamber == 0)
                          document.getElementById("customEdit").value = JSON.stringify(levels[cmd[1]]);
                      break;
              }
          },
      });
      function updateChamber() {
          let chamber = chambers[currentChamber];
          chamber.update();
          let s = [chamber.checkGoals().solved, chamber.checkOptional().solved];
          solvedChambers[chamber.name] = Math.max(solvedChambers[chamber.name] || 0, s[0] ? (s[1] ? 2 : 1) : 0);
          needRedraw = true;
      }
      function update(t) {
          if (needRedraw) {
              updateChamber();
              renderAll();
              save();
          }
          window.requestAnimationFrame(update);
      }
      update();
      updateChamber();
  }
  window.addEventListener("load", (e) => {
      newGame();
      scaleToWindow();
      window.addEventListener("resize", scaleToWindow);
  });

}());
