import { Chamber } from './chamber';
import { capitalize, greek } from './util';
import { v2Dist } from './v2';

let noiseC = document.createElement('canvas');
noiseC.width = 2000;
noiseC.height = 1000;
let noiseCtx = noiseC.getContext('2d');
let cdata = noiseCtx.getImageData(0, 0, noiseC.width, noiseC.height);
for (let i = 3; i < cdata.data.length; i += 4) {
  cdata.data[i] = ~~(Math.random() * 100);
}
noiseCtx.putImageData(cdata, 0, 0);

export function render({
  C,
  chamber,
}: {
  C: HTMLCanvasElement;
  chamber: Chamber;
}) {
  let cc = C.getContext('2d');

  cc.save();
  cc.scale(C.width / 400, C.height / 300);

  cc.fillStyle = '#000';
  cc.clearRect(0, 0, 400, 300);

  cc.strokeStyle = '#030';
  for (let i = 0; i < 400; i += 10) {
    cc.lineWidth = 0.5;
    cc.strokeStyle = i % 100 == 0? '#003800': i % 50 == 0 ? '#002800' : '#001800';
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
    cc.fillText(
      `${String.fromCharCode('A'.charCodeAt(0) + i)}`,
      path[0][0] - 5,
      path[0][1] + 1
    );

    if (i > 0) cc.strokeStyle = `hsl(${i * 55},50%,50%)`;
    else cc.strokeStyle = '#fff';

    cc.lineWidth = 0.5;

    cc.beginPath();
    cc.moveTo(path[0][0], path[0][1]);
    for (let i = 1; i < path.length; i++) {
      if(i%10 == 1)
        cc.lineWidth = Math.min(2,v2Dist(path[i], path[i-1])/20);
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
  let combined: typeof goals.goals = [].concat(goals.goals, optional.goals);

  cc.font = 'bold 4pt Courier';
  for (let i = 0; i < combined.length; i++) {
    let goal = combined[i];
    let text = (i >= goals.goals.length? 'Optional: ':'') + goal.text;
    cc.fillStyle =
      i < goals.goals.length
        ? goal.solved
          ? '#0f0'
          : '#f00'
        : goal.solved
        ? '#ff0'
        : '#aaa';
    cc.fillText(text , 395 - cc.measureText(text).width, 10 + i * 8);
  }

  if(chamber.tip){
    cc.fillStyle = "#fff";
    let tips = chamber.tip.split("\n");
    for(let i=0; i<tips.length;i++){
      cc.fillText(tips[i], (400-cc.measureText(tips[i]).width) / 2, 300 + 10 * (i-tips.length));
    }
  }

  cc.drawImage(noiseC, 0, 0);

  C.style.border = `solid 1px #${
    goals.solved ? (optional.solved ? 'ff0' : '0f0') : 'f00'
  }`;  

  cc.restore();
}
