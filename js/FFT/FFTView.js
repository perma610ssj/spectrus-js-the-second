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
        this.w = 300;
        this.h = 300;
        this.x = this.viewPortRight - this.w;
        this.y = this.viewPortBottom - this.h;
        this.scaleMode = 'dB';
        this.hzMin = 0;
        this.hzMax = 1000;
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
    get tickSpacing() {
        return this.w /  (this.hzMax / this.hzFromIndex(1))
    }

    draw(data, dt) {
        // Draw container
        this.drawContainer()
        this.update(data, dt)
    }

    drawContainer() {
        this.ctx.fillStyle = this.getColor(0)
        this.ctx.fillRect(this.x, this.y, this.w, this.h);

        // Draw borders
        this.ctx.fillStyle = 'rgb(255,255,255)'
        this.ctx.fillRect(this.x, this.y, this.w, 1);
        this.ctx.fillRect(this.x, this.y, 1, this.h);
        this.ctx.fillRect(this.x + this.w, this.y, 1, this.h);
        this.ctx.fillRect(this.x, this.y + this.h, this.w, 1);
    }

    update(data, dt) {
        // Go through FFT and draw bars
        let indexLimit = this.hzMax / this.hzFromIndex(1);
        for (var i=0; i < indexLimit; i++){
            this.ctx.fillStyle = this.getColor(data[i])
            // this.ctx.fillStyle = this.barColor(data[i]) // Highlight peaks
            
            this.ctx.fillRect(
                this.x + (i * this.tickSpacing), 
                this.y + this.h, 
                this.tickSpacing, 
                -1 * (this.h / 255) * data[i] 
            );
        }
    }

    // converts array position to hz (float)
    // if i=1, this is the hz per bin
    hzFromIndex(i) {
        return i * this.sampleRate / this.frequencyBinCount
    }

    // Returns an rgb string given a 0-255 value
    barColor(intensity) {
        // Flatten ends of histogram
        let percentile = 0.5

        if (intensity <= percentile*255) {
            intensity = 0
        }
        if (intensity >= 255 - percentile*255) {
            intensity = 255
        }

        return `rgb(0, ${intensity}, ${intensity*0.2})`
    }

    getColor(d) {
        if (colormap === undefined) { return `rbg(${d},${d},${d})`; }
        return (`rgb(
          ${colormap[this.colormap][d][0] * 255},
          ${colormap[this.colormap][d][1] * 255},
          ${colormap[this.colormap][d][2] * 255})`);
      }

}