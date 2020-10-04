import { v2 } from "./v2";

export function initControls(C: HTMLCanvasElement, callbacks:{[name:string]:Function}) {
  let mouse: { at?: v2; direction?: v2 } = {};

  onkeydown = (e) => {
    switch (e.code) {
      case "Space":
        callbacks.pause();
        break;
      default:
        break;
    }
  };

  function scaleToScreen(at: v2): v2 {
    at[0] *= 400 / C.width;
    at[1] *= 300 / C.height;
    return at;
  }

  function updatePosition(m:MouseEvent){
    let Crect = C.getBoundingClientRect();
    mouse.at = scaleToScreen(
      [m.clientX - Crect.left, m.clientY - Crect.top]
    );
  }

  document.addEventListener("mousedown", (e) => {
    let el = e.target as HTMLElement;
    if(el && el.id && el.tagName == "BUTTON"){
      if(e.shiftKey)
        callbacks.shiftButton(el.id.split(":"))
      else
        callbacks.button(el.id.split(":"))
    }
  })

  C.onmousedown = (m) => {
    if (m.button == 0) callbacks.mousedown();
  };

  C.onmouseup = (m) => {
    if (m.button == 0) callbacks.mouseup();
  };

  C.onmousemove = (m) => {
    updatePosition(m);
    callbacks.mousemove(scaleToScreen([m.movementX, m.movementY]))
  };

  return mouse;
}
