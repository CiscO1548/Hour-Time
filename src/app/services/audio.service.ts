import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientSource: AudioNode | null = null;
  private isAmbientPlaying = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play pleasant completion chime for focus session
  playCompletionChime(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Harmonious chord notes: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
      const freqs = [523.25, 659.25, 783.99, 1046.5];

      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);

        gain.gain.setValueAtTime(0, now + index * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, now + index * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 1.3);
      });
    } catch (e) {
      console.warn('Audio playback not supported or blocked:', e);
    }
  }

  // Play short soft tick or tap sound
  playTick(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Ignored
    }
  }

  // Play alert for break transition
  playBreakChime(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Soft gentle two-tone chime
      const freqs = [440, 554.37];
      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.15);

        gain.gain.setValueAtTime(0, now + index * 0.15);
        gain.gain.linearRampToValueAtTime(0.18, now + index * 0.15 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.15 + 1.0);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.15);
        osc.stop(now + index * 0.15 + 1.1);
      });
    } catch {
      // Ignored
    }
  }

  // Start synthesized ambient background noise (White noise / Rain / Lo-fi waves)
  startAmbient(type: 'rain' | 'whitenoise' | 'lofi_pulse' | 'waves', volume: number = 0.3): void {
    try {
      this.stopAmbient();
      const ctx = this.getContext();
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Generate brown/pink/white noise
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'rain' || type === 'waves') {
          // Pink/Brown noise simulation
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        } else {
          output[i] = white * 0.4;
        }
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Filter to soften the sound
      const filter = ctx.createBiquadFilter();
      if (type === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
      } else if (type === 'waves') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);
        filter.Q.setValueAtTime(1.2, ctx.currentTime);
      } else {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(Math.min(volume, 0.5) * 0.4, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();

      this.ambientSource = whiteNoise;
      this.ambientGain = gain;
      this.isAmbientPlaying = true;
    } catch (e) {
      console.warn('Ambient sound failed:', e);
    }
  }

  setAmbientVolume(volume: number): void {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(Math.min(volume, 0.5) * 0.4, this.ctx.currentTime);
    }
  }

  stopAmbient(): void {
    if (this.ambientSource) {
      try {
        (this.ambientSource as AudioScheduledSourceNode).stop();
        this.ambientSource.disconnect();
      } catch {
        // Ignored
      }
      this.ambientSource = null;
    }
    this.isAmbientPlaying = false;
  }

  getIsAmbientPlaying(): boolean {
    return this.isAmbientPlaying;
  }
}
