import { Chamber, Node } from "./chamber";
import { initControls } from "./controls";
import levels from "./levels";
import { render } from "./render";
import { capitalize } from "./util";
import { v2, v2Add, v2Copy, v2Dif, v2Dist, v2Len, v2Mul, v2New } from "./v2";

let C = document.getElementById("C") as HTMLCanvasElement;
let needRedraw = true;

function scaleToWindow() {
  C.width = Math.min(window.innerWidth * 0.8, window.innerHeight * 1.2);
  C.height = (C.width * 3) / 4;
  needRedraw = true;
}


function chamberFromObject({ name, friction, nodes, launchers, goals, optional, tip }){  
  return new Chamber(name, friction, nodes, launchers, goals, optional, tip)
}

let chambers = JSON.parse(JSON.stringify(levels)).map(chamberFromObject);

let currentChamber = 0;

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
    let save: {
      chambers: { [name: string]: v2[] };
      currentChamber: number;
      solvedChambers: { [name: string]: number };
    } = JSON.parse(saveString);
    currentChamber = save.currentChamber;
    solvedChambers = save.solvedChambers || {};
    for (let chamber of chambers) {
      chamber.deserialize(save.chambers[chamber.name]);
    }
  }
}

function newGame() {
  let draggedNode: Node = null;

  let buttonsDiv = document.getElementById("buttons");
  buttonsDiv.innerHTML =
    `<button id="reset">RESET</button>` +
    chambers
      .map((c, i) => `<button id="chamber:${i}">${capitalize(c.name)}</button>`)
      .slice(1)
      .join("") +
    `<button id="custom">CUSTOM</button><textarea id="customEdit" value="123"></textarea><button id="apply">APPLY</button>`

  function renderAll() {
    render({ C, chamber: chambers[currentChamber] });
    for (let i = 0; i < chambers.length; i++) {
      let button = document.getElementById(i == 0 ? "custom" : `chamber:${i}`);
      let solved = solvedChambers[chambers[i].name];
      button.classList.remove("done0", "done1", "done2", "current");
      button.classList.add("done" + (solved || 0));
      if (i == currentChamber) button.classList.add("current");
    }

    for(let id of ["customEdit", "apply"])
      document.getElementById(id).style.display = currentChamber==0?"block":"none";

    needRedraw = false;
  }

  let mouse = initControls(C, {
    mousedown: () => {
      draggedNode = chambers[currentChamber].nodeAt(mouse.at);
    },
    mouseup: () => {
      draggedNode = null;
    },
    mousemove: (delta: v2) => {
      if (draggedNode && !draggedNode.nailed) {
        v2Add(draggedNode.at, delta);
        if (draggedNode.at[0] < 30) draggedNode.at[0] = 30;
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
          chambers[0] = chamberFromObject(JSON.parse((document.getElementById("customEdit") as HTMLTextAreaElement).value))
          break;
      }
      needRedraw = true;
    },
    shiftButton: (cmd) => {
      switch (cmd[0]) {
        case "chamber":
          if(currentChamber == 0) 
            (document.getElementById("customEdit") as HTMLTextAreaElement).value = JSON.stringify(levels[cmd[1]]);
          break;
      }
    }
  });

  function updateChamber() {
    let chamber = chambers[currentChamber];
    chamber.update();
    let s = [chamber.checkGoals().solved, chamber.checkOptional().solved];
    solvedChambers[chamber.name] = Math.max(
      solvedChambers[chamber.name],
      s[0] ? (s[1] ? 2 : 1) : 0
    );
    needRedraw = true;
  }

  function update(t: number) {
    if (needRedraw) {
      updateChamber();
      renderAll();
      save();
    }

    window.requestAnimationFrame(update);
  }

  update(0);
  updateChamber();
}

window.addEventListener("load", (e) => {
  newGame();
  scaleToWindow();
  window.addEventListener("resize", scaleToWindow);
});
