export function breadthSearch(
  start: number,
  end: number,
  neighbors: (star: number) => [number, number][]
): { route: number[]; distances: number[]; prev: number[] } {
  let bag = [start];
  let distances = [];
  distances[start] = 0;
  let prev = [];
  let route: number[] = null;
  for (let limit = 0; limit < 10000; limit++) {
    if (bag.length == 0) {
      break;
    }
    let walking = bag.shift();
    if (walking == end) {
      route = [];
      while (walking >= 0) {
        route.push(walking);
        walking = prev[walking];
      }
      route.reverse();
      break;
    }
    for (let [cell, cost] of neighbors(walking)) {
      let totalCost = cost + distances[walking];
      if (!(cell in distances) || distances[cell] > totalCost) {
        let bigger = bag.findIndex((v) => distances[v] > totalCost);
        bag.splice(bigger >= 0 ? bigger : bag.length, 0, cell);
        distances[cell] = totalCost;
        prev[cell] = walking;
      }
    }
  }
  return { route, distances, prev };
}

export function listSum(a: number[]) {
  return a.reduce((x, y) => x + y, 0);
}

export function weightedRandom(a: number[], rng:(number?)=>number) {
  let roll = rng() * listSum(a) - a[0];
  let i = 0;
  while (roll >= 0) roll -= a[++i];
  return i;
}

export function listNorm(list: number[], newSum = 1, speed = 1) {
  let sum = listSum(list);
  let factor = 1 + ((newSum - sum) * speed) / sum;
  return sum ? list.map((v) => v * factor) : list;
}


/** Генератор случайных чисел */
export function RNG(seed:number){
  if(0<seed && seed<1)
    seed = Math.floor(seed*1e9);
  else 
    seed = Math.floor(seed);

  /** Возвращает случайное целое число от 0 до n */
  let rngi = (n:number) => {
    seed = (seed * 69069 + 1) % 2 ** 31;
    return seed % n;
  }
  
  /** Возвращает случайное число от 0 до 1 */
  let rng = (n?:number) => n==undefined?rngi(1e9)/1e9:rngi(n)
  return rng;
}

export function capitalize(s:string){
  return s[0].toUpperCase() + s.substr(1);
}

export function localFixed(n:number, digits:number = 2){
  return n.toLocaleString(undefined, {maximumFractionDigits:digits})
}

export function greek(n){
  return String.fromCharCode('\u{03B1}'.charCodeAt(0) + Number(n));
}

export function latin(n){
  return String.fromCharCode('A'.charCodeAt(0) + Number(n));
}