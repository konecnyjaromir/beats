import { t } from "./i18n.js";
import { instruments, timelineFor, positionAt, eventsForBar } from "./model.js";
export class DrumEngine {
  buffers = new Map();
  sources = new Set();
  active = false;
  volume = 0.75;
  async prepare() {
    this.ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    this.master ??= this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    await this.ctx.resume();
    if (!this.loading)
      this.loading = Promise.all(
        instruments.flatMap((i) =>
          [1, 3, 5].map(async (v, idx) => {
            const res = await fetch(
              `${import.meta.env.BASE_URL}samples/${i.note}_v${v}.wav`,
            );
            if (!res.ok) throw Error(t("Zvuky se nepodařilo načíst."));
            this.buffers.set(
              `${i.id}-${idx + 1}`,
              await this.ctx.decodeAudioData(await res.arrayBuffer()),
            );
          }),
        ),
      ).catch((e) => {
        this.loading = null;
        throw e;
      });
    await this.loading;
  }
  hit(instrument, level, time = this.ctx.currentTime) {
    const source = this.ctx.createBufferSource();
    source.buffer = this.buffers.get(`${instrument}-${level}`);
    // Keep the recorded velocity layer's timbre, and widen its volume contrast.
    // Soft: -12 dB, medium: about -5 dB, strong: unchanged.
    const dynamics = this.ctx.createGain();
    dynamics.gain.setValueAtTime([0, 0.25, 0.55, 1][level], time);
    source.connect(dynamics);
    dynamics.connect(this.master);
    this.sources.add(source);
    source.onended = () => {
      this.sources.delete(source);
      source.disconnect();
      dynamics.disconnect();
    };
    source.start(time);
  }
  start(project, onPosition) {
    this.stop();
    this.active = true;
    this.project = structuredClone(project);
    this.timeline = timelineFor(project);
    // Give the audio output time to wake up after resume (especially on iPad).
    // Shift the entire timeline so the first hit and playhead remain aligned.
    this.startTime = this.ctx.currentTime + 0.3;
    this.nextBar = 0;
    this.nextTime = this.startTime;
    this.queue = [];
    const schedule = () => {
      if (!this.active) return;
      const now = this.ctx.currentTime;
      while (this.nextTime < now + 0.15) {
        const index = this.nextBar % project.bars.length;
        const at = this.nextTime;
        const duration = this.timeline.bars[index].duration;
        this.queue.push(
          ...eventsForBar(project.bars[index], duration).map((e) => ({
            ...e,
            time: at + e.time,
          })),
        );
        this.nextBar++;
        this.nextTime += duration;
      }
      this.queue = this.queue.filter((e) => {
        if (e.time < now + 0.15) {
          if (e.time >= now - 0.02)
            this.hit(e.instrument, e.level, Math.max(now, e.time));
          return false;
        }
        return true;
      });
    };
    schedule();
    this.timer = setInterval(schedule, 25);
    const draw = () => {
      if (!this.active) return;
      const elapsed = Math.max(0, this.ctx.currentTime - this.startTime);
      onPosition(positionAt(this.timeline, elapsed));
      this.frame = requestAnimationFrame(draw);
    };
    draw();
  }
  setVolume(value) {
    this.volume = value;
    if (this.master)
      this.master.gain.setTargetAtTime(value, this.ctx.currentTime, 0.02);
  }
  stop() {
    this.active = false;
    clearInterval(this.timer);
    cancelAnimationFrame(this.frame);
    this.sources.forEach((s) => {
      try {
        s.stop();
      } catch {}
    });
    this.sources.clear();
  }
}
