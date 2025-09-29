// Sound utility using Web Audio API for timer feedback

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled = true;

  constructor() {
    // Initialize AudioContext on first user interaction
    this.initAudioContext();
  }

  private async initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private async ensureAudioContext() {
    if (!this.audioContext) {
      await this.initAudioContext();
    }

    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  private async playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.enabled || !this.audioContext) return;

    try {
      await this.ensureAudioContext();

      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      // Envelope for smooth sound
      gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext!.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + duration);

      oscillator.start(this.audioContext!.currentTime);
      oscillator.stop(this.audioContext!.currentTime + duration);

    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }

  // Start sound - ascending beep
  async playStart() {
    await this.playTone(800, 0.2);
    setTimeout(() => this.playTone(1000, 0.2), 100);
  }

  // Pause sound - single mid-tone
  async playPause() {
    await this.playTone(600, 0.3);
  }

  // Resume sound - ascending quick beep
  async playResume() {
    await this.playTone(700, 0.15);
    setTimeout(() => this.playTone(900, 0.15), 80);
  }

  // Stop/Reset sound - descending beep
  async playStop() {
    await this.playTone(1000, 0.15);
    setTimeout(() => this.playTone(800, 0.15), 80);
    setTimeout(() => this.playTone(600, 0.2), 160);
  }

  // Complete sound - success chime
  async playComplete() {
    await this.playTone(800, 0.2);
    setTimeout(() => this.playTone(1000, 0.2), 100);
    setTimeout(() => this.playTone(1200, 0.3), 200);
  }

  // Tick sound for timer updates (optional, can be enabled/disabled)
  async playTick() {
    if (!this.enabled) return;
    await this.playTone(800, 0.05, 'square');
  }

  // Enable/disable sounds
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled() {
    return this.enabled;
  }
}

// Create singleton instance
export const soundManager = new SoundManager();

// Initialize sound on first user interaction
let initialized = false;
export const initializeSounds = () => {
  if (initialized) return;

  const initOnInteraction = () => {
    soundManager['initAudioContext']();
    initialized = true;

    // Remove listeners after first interaction
    document.removeEventListener('click', initOnInteraction);
    document.removeEventListener('keydown', initOnInteraction);
    document.removeEventListener('touchstart', initOnInteraction);
  };

  // Listen for first user interaction
  document.addEventListener('click', initOnInteraction);
  document.addEventListener('keydown', initOnInteraction);
  document.addEventListener('touchstart', initOnInteraction);
};