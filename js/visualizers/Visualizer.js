/**
 * Base class for all visualizers (Spectrogram and 1D-FFT)
 * 
 * 
 * This class defines functions that both of the different views should inherit by default, 
 * to reduce redundancy on common helper functions.
 * 
 * Other classes such as GUIOverlay will also rely on using common functions here to 
 * know how to render things like ruler for each type of visualization.
 */

class Visualizer {
    constructor(audioSystem, container = window){
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

        // Initialize and draw scale.
        this.scaleWidth = 100;
        this.viewPortRight = this.canvas.width - this.scaleWidth;
        this.viewPortBottom = this.canvas.height;
        this.scaleMode = 'log';
        this.pitchTrackMode = false;
        this.logScale = 2;
        this.hzMin = 0;
        this.hzMax = 15000;
        this.scaleX = 1;
        this.scaleY = 1;
        this.speed = 100;
        this.notationType = 'musical';

        this.running_width = 0;
        // Configure visualizer options.
        this.pause = false;
        this.track = {
        fundamental: false,
        formants: false,
        formantCount: 3,
        fundamentalMinAmp: 150,
        fundamentalAmp: 0,
        };

        // Initialize variables for formant tracking.
        this.f = Array(5).fill({ index: 0, amp: 0, active: false });
        this.formantColors = FORMANT_COLORS;

        // Draw the scale.
        this.clear();
        this.updateScale();
    }

    get canvas() {
        return this.audioSystem.primaryCanvas
    }

    get fft() {
        return this.audioSystem.fft;
    }

    update(){
        if (this.pause) return;
        this.getFundamental(this.fft.data);
    }

    #getBaseLog(number, base) {
        return Math.round((Math.log(number) / Math.log(base)) * 1000000000) / 1000000000;
      }
      
    #unBaseLog(answer, base) {
        return (base ** answer);
      }
      
    #getMoreAccurateFundamental(array, start) {
        let total = array[start];
        let div = 1;
        for (let i = Math.max(start - 2, 0); i < Math.min(start + 2, array.length - 1); i++) {
          if (i !== start) {
            total += (array[i]) * i;
            div += (array[i]);
          }
        }
        return (total / div);
      }
      
      /**
       * Calculate the moving average of each element in an array.
       *
       * This function calculates a moving average without zero padding. No values outside bounds are
       * assumed.
       * @param {Uint8Array} array Input array of length n to be processed.
       * @param {number} span Length on either side indicating the size of the sliding window.
       * @param {number} maxIndex Maximum size for the output array.
       */
    #movingAverage(array, span, maxIndex = 1000) {
        const output = new Array(Math.min(array.length, maxIndex));
        let tmpCurAvg;
        let totalDiv;
        for (let i = 0; i < Math.min(array.length, maxIndex); i++) {
          tmpCurAvg = 0;
          totalDiv = 0;
          for (let l = i - span; l <= i + span; l++) {
            if (l >= 0 && l < Math.min(array.length, maxIndex)) {
              tmpCurAvg += array[l];
              totalDiv += 1;
            }
          }
          output[i] = tmpCurAvg / totalDiv;
        }
        return output;
      }
      
      /**
       * Find peaks in an array with segments of increasing size.
       *
       * This function keeps increasing the size of the segment exponentially and maintains the largest
       * value for the current segment.
       * @param {Uint8Array} array Input array of length n.
       * @param {number} baseSegmentSize Initial segment size, or the smallest possible unit of size.
       * @param {number} logPeaksScale Initial
       * @returns {Array} Array of peaks and indices.
       */

    #getPeaks(array, baseSegmentSize, logPeaksScale) {
        let segmentSize = baseSegmentSize;
        let curSegment = 1;
        let segmentStart = 0;
      
        const peaks = new Array(0); // make a blank array for adding to later
      
        let tmpPeakIndex = 0;
        let tmpPeakValue = 0;
        peaks.push([1, 10]);
        for (let k = 0; k < array.length; k++) {
          // tmpPeakIndex = k;
          if (array[k] >= tmpPeakValue) {
            tmpPeakIndex = k;
            tmpPeakValue = array[k];
          }
      
          if (k >= segmentStart + segmentSize) { // when you get to the end of the segment
            peaks.push([tmpPeakIndex, tmpPeakValue]);
      
            segmentSize = unBaseLog(logPeaksScale, curSegment) * baseSegmentSize;
            segmentStart = k;
            curSegment++;
            tmpPeakValue = 0;
          }
        }
      
        return peaks;
      }
      
    #getFormants(array, formantCount = 3) {
        const newFormants = Array(formantCount + 1).fill([0, 0, 0]);
      
        let avgPos = 0;
        let totalDiv = 0;
        const tmpExp = 40;
        for (let i = 1; i < array.length - 1; i++) {
          if (array[i][1] > newFormants[0][1]) {
            if (array[i - 1][1] < array[i][1] && array[i][1] > array[i + 1][1]) {
              avgPos = 0;
              totalDiv = 0;
              for (let l = -1; l < 2; l++) {
                avgPos += array[(i + l)][0] * array[i + l][1] ** tmpExp;
                totalDiv += array[i + l][1] ** tmpExp;
              }
              avgPos /= totalDiv;
              newFormants.shift();
              newFormants.push([avgPos, array[i][1], 1]);
            }
          }
        }
      
        return newFormants;
    }

    // takes index and returns its Hz value
    hzFromIndex(index) {
        return (index / this.frequencyBinCount) * (this.sampleRate / 1);
    }

    // converts hz to array position (float)
    indexFromHz(hz) {
        return (hz / (this.sampleRate / 1)) * this.frequencyBinCount;
    }

  /**
   * Gets the scale for the canvas.
   *
   * This method calculates the scaling factor for the spectrogram and the scale/ruler, i.e, what
   * the fft.data values need to be multiplied by to fill the screen.
   *
   * @todo Check if this.scaleX is necessary.
   */
    updateScale() {
        // Check if the canvas has been resized and needs to be re-drawn.
        const reDraw = (this.canvas.width !== this.container.innerWidth)
        || (this.canvas.height !== this.container.innerHeight);

        // If it needs to be re-drawn, calculate the new dimensions.
        if (reDraw) {
            this.sampleRate = this.fft.audioCtx.sampleRate;
            this.frequencyBinCount = this.fft.analyser.fftSize;
            this.canvas.width = this.container.innerWidth;
            this.canvas.height = this.container.innerHeight;
            this.viewPortRight = this.canvas.width - this.scaleWidth;
            this.viewPortBottom = this.canvas.height;
        }

        // Calculate scaling for the spectrogram.
        if (this.scaleMode === 'linear') {
            this.scaleX = this.canvas.width / this.indexFromHz(this.hzMax);
            this.scaleY = this.canvas.height / this.indexFromHz(this.hzMax);
        } else if (this.scaleMode === 'log') {
            this.scaleX = this.canvas.width
            / getBaseLog(this.indexFromHz(this.hzMax), this.logScale);
            this.scaleY = this.canvas.height
            / getBaseLog(this.indexFromHz(this.hzMax), this.logScale);
        }

        // Re-draw if necessary.
        if (reDraw) {
            this.clear();
            this.drawScale();
        }
    }

    clear() {
        this.ctx.fillStyle = this.getColor(0);
        this.ctx.fillRect(0, 0, this.canvas.width - this.scaleWidth, this.viewPortBottom);
    }

  /**
   * Attempts to find the fundamental index.
   * @param {Uint8Array} array Contains amplitudes of detected audio.
   * @returns {Object} Contains index and amplitude of fundamental frequency if found.
   */
    getFundamental(array) {
        // get highest peak
        let highestPeak = 0;
    
        const tmpMaxCheck = Math.floor(this.indexFromHz(Math.min(5000, array.length)));
        for (let i = 0; i < tmpMaxCheck; i++) { // fast version?
          if (array[i] > highestPeak) {
            highestPeak = array[i];
          }
        }
        const peakThreshold = highestPeak * 0.7; // only look at things above this theshold
        let currentPeakIndex = 0;
        let currentPeakAmplitude = 0;
        for (let i = 0; i < tmpMaxCheck; i++) {
          // only look above threshold
          if (array[i] > peakThreshold) {
            // look for peaks
            if (array[i] > currentPeakAmplitude) {
              currentPeakIndex = i;
              currentPeakAmplitude = array[i];
            }
          } else if (currentPeakIndex > 0) {
            currentPeakIndex = getMoreAccurateFundamental(array, currentPeakIndex);
            if (currentPeakAmplitude > this.track.fundamentalMinAmp) {
              this.f[0] = Math.max(currentPeakIndex, 1);
            }
            this.track.fundamentalAmp = currentPeakAmplitude;
            return { index: Math.max(currentPeakIndex, 1), amp: currentPeakAmplitude };
          }
        }
        return { index: 0, amplitude: 0 };
    }
    
    renderText(text, x, y, color = '#fff', fontsize = '20px', font = 'Mono') {
        this.ctx.font = `${fontsize} ${font}`;
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
        return true;
    }

    hzMaxIncrement(amount) {
        this.hzMax = Math.min(Math.max(this.hzMax + amount, 1000), 15000);
        this.updateScale();
        this.drawScale();
    }

    trackFormantToggle() {
        this.track.fundamental = !this.track.fundamental;
        this.track.formants = !this.track.formants;
    }
    
    scaleModeToggle() {
        this.scaleMode = this.scaleMode === 'log' ? 'linear' : 'log';
        this.updateScale();
        this.drawScale();
    }
    
    pauseToggle() {
        this.pause = !this.pause;
    }
    
    notationToggle() {
        this.notationType = this.notationType === 'experimental' ? 'musical' : 'experimental';
        this.updateScale();
        this.drawScale();
    }
    
    pitchTrackModeToggle() {
        this.pitchTrackMode = !this.pitchTrackMode;
    }

    // All of these functions below need to be overridden
    // For each specific visualizer.
    draw(data, dt) {
        // Needs to be overrided 
    }

    drawPitchTrackerMode(data, width) {
        // Needs to be overriden
    }

    plot(x, y, color, width, height) {
        // Needs to be overriden
    }

    plotFormants(data, width){ 
        // Needs to be overriden
    }

    drawScale() {
        // Needs to be overriden
    }

}
