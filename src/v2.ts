export type v2 = Float32Array | number[];

export function v2Set(a: v2, b: v2) {
  a[0] = b[0];
  a[1] = b[1];
}

export function v2From(v: v2) {
  return new Float32Array(v);
}

export function v2New(x: number, y:number) {
  return new Float32Array([x,y]);
}

export function v2Copy(v:v2) {
  return new Float32Array(v);
}

export function v2Len(v: v2) {
  return Math.sqrt(v[0] ** 2 + v[1] ** 2);
}

export function v2Dist(a: v2, b: v2) {
  return v2Len(v2Dif(a, b));
}

export function v2Dif(a: v2, b: v2): v2 {
  return new Float32Array([b[0] - a[0], b[1] - a[1]]);
}

export function v2Sum(a: v2, b: v2): v2 {
  return new Float32Array([a[0] + b[0], a[1] + b[1]]);
}

export function v2Normalized(v: v2, n = 1): v2 {
  const scale = n / (v2Len(v) || 1);
  return new Float32Array([v[0] * scale, v[1] * scale]);
}

export function v2Sub(a: v2, b: v2) {
  a[0] -= b[0];
  a[1] -= b[1];
}

export function v2Add(a: v2, b: v2) {
  a[0] += b[0];
  a[1] += b[1];
}

export function v2Mul(v: v2, n: number) {
  v[0] *= n;
  v[1] *= n;
}

export function v2Normalize(v: v2, n = 1) {
  const scale = n / (v2Len(v) || 1);
  v[0] *= scale;
  v[1] *= scale;
}

export function distLinePoint(a: v2, b: v2, c: v2) {
  return (
    Math.abs(
      (b[1] - a[1]) * c[0] - (b[0] - a[0]) * c[1] + b[0] * a[1] - b[1] * a[0]
    ) / v2Dist(a, b)
  );
}

export function segmentsIntersection(one:Float32Array|number[], another:Float32Array|number[], st?:[number,number]): [number, number] {
  let [a, b, c, d] = one;
  let [e, f, g, h] = another;
  let det:number, td:number, sd:number;
  det = (c - a) * (h - f) - (g - e) * (d - b);
  if (det === 0) {
    return null;
  } else {
    let detSign = det<0?-1:1;
    det *= detSign
    sd = ((h - f) * (g - a) + (e - g) * (h - b)) * detSign;
    td = ((b - d) * (g - a) + (c - a) * (h - b)) * detSign;
    if (st) [st[0], st[1]] = [sd/det, td/det];
    if (0 <= sd && sd <= det && 0 <= td && td <= det) {
      return [a + (c - a) * sd/det, b + (d - b) * sd/det];
    }
  }
}  

export function contains(x: number, y: number, v:Float32Array | number[], l?:number) {
  let inside = false;
  if(l==null)
    l = v.length
  for (let i = 0, j = l / 2 - 1; i < l / 2; j = i++) {
    let xi = v[i * 2 + 0],
      yi = v[i * 2 + 1];
    let xj = v[j * 2 + 0],
      yj = v[j * 2 + 1];

    let intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

export function v2PolygonSquareArea(poly: number[]|Float32Array) {
  let total = 0,
    l = poly.length/2;

  for (let i = 0; i < l; i++) {
    let j = (i + 1) % l;
    total += poly[i*2] * poly[j*2 + 1] - poly[i*2+1] * poly[j*2];
  }

  let area = Math.abs(total / 2);
  return area;
}

export function v2Cross(v: v2, w: v2) {
  return v[0] * w[1] - v[1] * w[0];
}

export function v2Scalar(v: v2, w: v2) {
  return v[0] * w[0] + v[1] * w[1];
}

export function v2RotateLeft(v: v2): v2 {
  [v[0], v[1]] = [v[1], -v[0]];
  return v;
}
