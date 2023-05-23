/**
 * This class displays the FFT information as frequency vs intensity (dB)
 */
class FFTView {
    /**
   * Saves variables, initializes dimensions and formants, and draws the scale.
   * @param {AudioSystem} audioSystem A reference to the parent, used to access the FFT analyzer
   * @param {Window} container The reference to the window, used to access dimensions for resizing.
   */
    constructor(audioSystem, container=window) {
        // Initialize audio variables.
        this.audioSystem = audioSystem;
        this.sampleRate = this.fft.audioCtx.sampleRate;
        this.frequencyBinCount = this.fft.analyser.fftSize;

        // Initialize container.
        this.container = container;
        this.canvas.width = container.innerWidth;
        this.canvas.height = container.innerHeight;
        this.ctx = this.canvas.getContext('2d');
        this.colormap = 'viridis';

        // Initialize and draw scale
        this.scaleWidth = 100;
        this.viewPortRight = this.canvas.width - this.scaleWidth;
        this.viewPortBottom = this.canvas.height;
        this.x = this.viewPortRight - 310;
        this.y = this.viewPortBottom - 310;
        this.scaleMode = 'dB';
        this.specMin = -32;
        this.specMax = 10;
        this.scaleX = 1;
        this.scaleY = 1;
        this.speed = 100;
    }

    /** References the canvas. */
    get canvas() {
        return this.audioSystem.fftCanvas;
    }

    /** References the FFT analyzer. */
    get fft() {
        return this.audioSystem.fft;
    }

    draw(data, dt) {
        this.ctx.fillRect(this.x, this.y, 300, 300)
        this.ctx.fillStyle = 'rgb(255,255,255)'

    }

    drawContainer() {
        this.ctx.clearRect(0, 0, 200, 200)
    }


}