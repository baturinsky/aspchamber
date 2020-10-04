export class Vec2{
  constructor(public xy:Float32Array){
  }

  static from([x, y]:number[]){
    return new Vec2(new Float32Array([x,y]))
  }

  set(v:Vec2) {
    this.xy[0] = v.xy[0]
    this.xy[1] = v.xy[1]
    return this;
  }  

  len(){
    return Math.sqrt(this.xy[0] ** 2 + this.xy[1] ** 2);
  }

  dist(v: Vec2) {
    return (this.xy[0] - v.xy[0]) ** 2 + (this.xy[1] - v.xy[1]) ** 2
  }
  
  add(v: Vec2) {
    this.xy[0] += v.xy[0];
    this.xy[1] += v.xy[1];
    return this;
  }
    
  sub(v: Vec2) {
    this.xy[0] -= v.xy[0];
    this.xy[1] -= v.xy[1];
    return this;
  }
  
  get x(){
    return this.xy[0];
  }

  get y(){
    return this.xy[1];
  }

  v2Normalize(n = 1) {
    const scale = n / (this.len() || 1);
    this.xy[0] /= scale;
    this.xy[1] /= scale;
    return this;
  }
  
  distToLine(a: Vec2, b: Vec2) {
    return (
      Math.abs(
        (b[1] - a[1]) * this.xy[0] - (b[0] - a[0]) * this.xy[1] + b[0] * a[1] - b[1] * a[0]
      ) / a.dist(b)
    );
  }
    
}