/** This class generates performs FFT and handles rendering for spectrogram and GUI overlay. */
class AudioSystem { // eslint-disable-line no-unused-vars
  /**
   * Initializes the FFT Analyzer and the UI.
   * @param {HTMLDivElement} div - The div element to render the key UI.
   * @param {MediaStream} audioStream - The microphone audio stream.
   */
  constructor(div, audioStream) {
    // Initialize FFT.
    this.fft = new FFTAnalyser();
    this.fft.init(audioStream);

    // Initialize FPS.
    this.avgFPS = 0;

    // Initialize canvases for the display.
    this.specCanvas = div.appendChild(document.createElement('canvas'));
    this.fftCanvas = div.appendChild(document.createElement('canvas'));
    this.guiCanvas = div.appendChild(document.createElement('canvas'));
    
    // Only show spectrogram by default.
    this.specCanvas.style.visibility = 'visible';
    this.fftCanvas.style.visibility = 'hidden';

    // Initialize and draw visualizers, and GUI overlay.
    this.spec = new Spectrogram(this);
    this.spec.updateScale();
    this.spec.drawScale();

    this.fftView = new FFTView(this);
    this.fftView.updateScale();
    this.fftView.drawScale();
    
    this.gui = new GUIOverlay(this);

    // Initialize Toggle for choosing between views
    this.visualizeMode = "spectrogram";

    // Variable to point to currently active visualizer
    // so that html buttons toggles the correct ones. 
    this.activeVisualizer = this.spec;
  }

  /**
   * Re-calculates FFT and updates the UI.
   * @param {number} delta Time difference from last frame.
   * @returns {boolean} Success status of the update.
   */
  update(delta) {
    // Abort update if no time has passed.
    if (delta === 0) { return false; }
    // Re-run FFT.
    this.fft.update();

    // Update average FPS.
    this.avgFPS = ((1 / delta) + this.avgFPS * 19) / 20; // Calculate average FPS.
    this.gui.clear();
    this.gui.renderText(Math.floor(this.avgFPS), 10, 30, '#ffffff50', '20px', 'Mono');
    this.gui.update();

    // Redraw spectrogram.
    this.spec.updateScale();
    this.spec.draw(this.fft.data, delta);
    
    // Redraw FFTview
    this.fftView.updateScale();
    this.fftView.draw(this.fft.data, delta);


    return true;
  }

  toggleView() {
    if (this.visualizeMode == "spectrogram") {
      this.visualizeMode = "1d-fft";
      this.activeVisualizer = this.fftView;
      this.specCanvas.style.visibility = 'hidden';
      this.fftCanvas.style.visibility = 'visible';
    }
    else if (this.visualizeMode == "1d-fft") {
      this.visualizeMode = "spectrogram";
      this.activeVisualizer = this.spec;
      this.specCanvas.style.visibility = 'visible';
      this.fftCanvas.style.visibility = 'hidden';
    }


  }
}
