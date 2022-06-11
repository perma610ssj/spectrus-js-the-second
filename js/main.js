
// select an input, then start everything
navigator.mediaDevices.getUserMedia({ audio: true }).then(initialise).catch(console.log);

let fft, gui, spec;
let avgFPS = 0;

// starts everything after you select an input
function initialise(stream) {
  // make the spectrogram
  fft = new _fftData();
  fft.init(stream);
  spec = new _SPECTROGRAM(fft);
  spec.updateScale();
  spec.drawScale();
  gui = new _GUI(spec, window);
  startLoop(mainLoop);
}

function mainLoop(dt) {
  if (dt === 0) { return false } // don't continue if infinite fps
  fft.update();
  gui.clear(); // clear the gui layer
  // show FPS
  avgFPS = ((1/dt) + avgFPS * 19) / 20;
  gui.renderText(Math.floor(avgFPS), 10, spec.viewPortBottom - 10, "#fff", "20px", "Mono");
  spec.updateScale();
  // spec.drawScale();
  // spec.clear();
  spec.draw(fft.data);
  gui.update();
  return;
}


//  add spacebar to pause
const space_bar = 32;
window.onkeydown = function(gfg){
  if(gfg.keyCode === space_bar) {
    spec.pauseToggle();
  }
};
