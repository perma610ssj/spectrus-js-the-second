/**
 * This class displays the FFT information as frequency vs intensity (dB)
 */
class FFTView extends Visualizer{
    /**
   * Saves variables, initializes dimensions and formants, and draws the scale.
   * @param {AudioSystem} audioSystem A reference to the parent, used to access the FFT analyzer
   * @param {Window} container The reference to the window, used to access dimensions for resizing.
   */
    constructor(audioSystem, container=window) {
        super(audioSystem, container)
        this.hzMax = 1000;
        this.viewPortRight = this.canvas.width;
        this.viewPortBottom = this.canvas.height - this.scaleWidth
    }

    /** References the canvas. */
    get canvas() {
        return this.audioSystem.fftCanvas
    }

    /** References the FFT analyzer. */
    get fft() {
        return this.audioSystem.fft;
    }

    get barSpacing() {
        if (this.scaleMode === 'linear') {
            return this.canvas.width /  (this.hzMax / this.hzFromIndex(1))
        } else {

        }
    }

    draw(data, dt) {
        // Draw container
        this.clear()
        this.update(data, dt)
    }

    clear() {
        this.ctx.fillStyle = this.getColor(0);
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height - this.scaleWidth);
    }

    update(data, dt) {
        this.clear();
        // Go through FFT and draw bars
        let indexLimit = this.hzMax / this.hzFromIndex(1);

        for (var i=0; i < indexLimit; i++){
            this.ctx.fillStyle = this.getColor(data[i])
            // this.ctx.fillStyle = this.barColor(data[i]) // Highlight peaks
            
            this.ctx.fillRect(
                i * this.barSpacing, 
                this.viewPortBottom, 
                this.barSpacing, 
                -1 * ( (this.viewPortBottom*.70) / 255) * data[i] 
            );
        }
    }

    drawScale(){
        this.ctx.clearRect(0, this.viewPortBottom, this.canvas.width, this.scaleWidth);
        let tmpStepDist = 50;

        // ========= notes scale =========
        let tmpHZ;
        this.ctx.font = `${12}px Mono`;
        const A1 = 55;

        // ========= main scale =========
        if (this.scaleMode === 'log') {
            for (let i = 1; i < this.canvas.width / tmpStepDist; i++) {
                this.ctx.fillStyle = '#888';
                this.ctx.fillRect((i * tmpStepDist), this.viewPortBottom, 1, 20);
                this.renderText(
                    Math.floor(this.hzFromX(i * tmpStepDist)),
                    (i * tmpStepDist) - 5,
                    this.viewPortBottom,
                    '#777',
                    '15px',
                );
            }
            // do some manual steps
            const tmpSteps = [100, 500, 1000, 5000, 10000];
            for (let i = 0; i < tmpSteps.length; i++) {
            this.ctx.fillStyle = '#555';
            this.ctx.fillRect(this.viewPortRight, this.xFromHz(tmpSteps[i]), 30, 1);
            this.renderText(
                Math.floor(tmpSteps[i]),
                this.xFromHz(tmpSteps[i]) + 5,
                this.viewPortBottom + 30,
                '#444',
                '15px',
            );
            }
        } else if (this.scaleMode === 'linear') {
            
            tmpStepDist = 100; // hz
            for (let i = 0; i < this.hzMax / tmpStepDist; i++) {
            this.ctx.fillStyle = '#555';
            this.ctx.fillRect(this.xFromHz(i * tmpStepDist), this.viewPortBottom, 1, 5);
            }

            tmpStepDist = 500; // hz
            for (let i = 0; i < this.hzMax / tmpStepDist; i++) {
            this.ctx.fillStyle = '#777';
            this.ctx.fillRect(this.xFromHz(i * tmpStepDist), this.viewPortBottom, 1, 10);
            this.renderText(
                Math.floor(i * tmpStepDist),
                this.xFromHz(i * tmpStepDist) - 5,
                this.viewPortBottom + 20,
                '#777',
                '15px',
            );
            }
        }
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


    // takes an index and scales it to its X coordinate
    xFromIndex(index) {
        if (this.scaleMode === 'linear') {
        return  (index * this.scaleX);
        }
        if (this.scaleMode === 'log') {
        return(getBaseLog(index, this.logScale) * this.scaleX);
        }
        throw new Error('invalid scale mode');
    }

    // takes a X value and returns its index in the array
    // undoes scaling
    indexFromX(x) {
        if (this.scaleMode === 'linear') {
        return x / this.scaleX;
        }
        if (this.scaleMode === 'log') {
        return unBaseLog((x) / this.scaleX, this.logScale);
        }
        throw new Error('invalid scale mode');
    }

  xFromHz(hz) {
    return this.xFromIndex(this.indexFromHz(hz));
  }

  hzFromX(x) {
    return this.hzFromIndex(this.indexFromX(x));
  }

}