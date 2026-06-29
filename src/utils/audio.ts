// Web Audio API Synthesizer for Phone System Sounds
// Lazily initialized to avoid browser autoplay restrictions

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private ringtoneInterval: any = null;
  private dialtoneInterval: any = null;

  private initCtx() {
    if (!this.ctx) {
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Imo/WhatsApp style beautiful ringing sound
  playRingtone() {
    const ctx = this.initCtx();
    if (!ctx) return;

    this.stopRingtone();

    const playBeepPair = () => {
      if (!ctx || ctx.state === 'suspended') return;
      const now = ctx.currentTime;

      // First beep of the ring ring
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, now); // standard ringtone frequencies (US/UK mix)
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(480, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
      gain.gain.setValueAtTime(0.15, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.5);
      osc2.stop(now + 1.5);
    };

    playBeepPair();
    this.ringtoneInterval = setInterval(playBeepPair, 3000);
  }

  stopRingtone() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  // Dial tone beep beep for outgoing calls
  playDialTone() {
    const ctx = this.initCtx();
    if (!ctx) return;

    this.stopDialTone();

    const playDialBeep = () => {
      if (!ctx || ctx.state === 'suspended') return;
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(350, now);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
      gain.gain.setValueAtTime(0.1, now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.0);
      osc2.stop(now + 1.0);
    };

    playDialBeep();
    this.dialtoneInterval = setInterval(playDialBeep, 2000);
  }

  stopDialTone() {
    if (this.dialtoneInterval) {
      clearInterval(this.dialtoneInterval);
      this.dialtoneInterval = null;
    }
  }

  // Cheerful chime when connected
  playConnectedSound() {
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.3);
    });
  }

  // Downward tone when call ends
  playDisconnectedSound() {
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [587.33, 493.88, 440.00]; // D5, B4, A4

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.4);
    });
  }

  // Short pop for sent message
  playMessageSentSound() {
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Double bubble sound for received message
  playMessageReceivedSound() {
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // First pop
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(800, now);
    osc1.frequency.exponentialRampToValueAtTime(1000, now + 0.04);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.06, now + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.06);

    // Second pop
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(900, now + 0.07);
    osc2.frequency.exponentialRampToValueAtTime(1100, now + 0.11);
    gain2.gain.setValueAtTime(0, now + 0.07);
    gain2.gain.linearRampToValueAtTime(0.06, now + 0.07 + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.07 + 0.05);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.07);
    osc2.stop(now + 0.13);
  }

  // Pleasant notification bell/chime for reminders
  playNotification() {
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    // F5 then A5 chime
    const notes = [698.46, 880.00];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.4);
    });
  }
}

export const sounds = new SoundSynthesizer();
