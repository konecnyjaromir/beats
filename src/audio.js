import { t } from "./i18n.js";
import { instruments, timelineFor, positionAt, eventsForBar } from "./model.js";
export class DrumEngine {
  buffers = new Map();
  sources = new Set();
  active = false;
  volume = 0.75;
  installEarlyUnlock(target = document) {
    let preparing = false;
    const unlock = () => {
      if (
        target.hidden ||
        preparing ||
        (this.keepAlive && this.ctx?.state === "running")
      )
        return;
      preparing = true;
      // Capture the gesture before opening a loop, rather than waiting for Play.
      this.prepare()
        .catch(() => {
          this.releaseOutput();
          // Playback retries and reports any actual loading error to the user.
        })
        .finally(() => {
          preparing = false;
        });
    };
    const visibility = () => {
      if (target.hidden) this.releaseOutput();
    };
    for (const event of ["touchend", "click", "keydown"])
      target.addEventListener(event, unlock, { capture: true });
    target.addEventListener("visibilitychange", visibility);
    return () => {
      for (const event of ["touchend", "click", "keydown"])
        target.removeEventListener(event, unlock, { capture: true });
      target.removeEventListener("visibilitychange", visibility);
      this.releaseOutput();
    };
  }
  keepOutputOpen() {
    if (this.keepAlive) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.ctx.createBuffer(
      1,
      this.ctx.sampleRate,
      this.ctx.sampleRate,
    );
    // A zero-only stream may let USB DACs idle. Very low-level noise (-100 dBFS
    // peak before master gain) keeps the stream nonzero without an audible cue.
    const samples = source.buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++)
      samples[i] = (Math.random() * 2 - 1) * 0.00001;
    source.loop = true;
    source.connect(this.master);
    source.start();
    // Separate from musical sources: Stop must not put the output back to sleep.
    this.keepAlive = source;
  }
  releaseOutput() {
    if (!this.keepAlive) return;
    this.keepAlive.stop();
    this.keepAlive.disconnect();
    this.keepAlive = null;
  }
  async prepare() {
    this.ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (!this.master) {
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
    }
    this.master.gain.value = this.volume;
    const resumed = this.ctx.resume();
    this.keepOutputOpen();
    // Start a real (silent) source while still inside the user's gesture.
    const outputReady = this.primeOutput();
    await resumed;
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
    await Promise.all([this.loading, outputReady]);
  }
  primeOutput() {
    const source = this.ctx.createBufferSource();
    source.buffer = this.ctx.createBuffer(
      1,
      Math.ceil(this.ctx.sampleRate * 0.06),
      this.ctx.sampleRate,
    );
    source.connect(this.master);
    this.sources.add(source);
    // Completion is driven by the audio renderer, not by a wall-clock timeout.
    return new Promise((resolve) => {
      source.onended = () => {
        this.sources.delete(source);
        source.disconnect();
        resolve();
      };
      source.start();
    });
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
    source.beatsTime = time;
    source.start(time);
  }
  start(
    project,
    onPosition,
    { warmup = false, repeat = true, onEnded = () => {} } = {},
  ) {
    this.stop();
    this.active = true;
    this.project = structuredClone(project);
    this.timeline = timelineFor(project);
    // Shift the entire timeline so the first hit and playhead remain aligned.
    // prepare() has already verified that the audio renderer is processing.
    const now = this.ctx.currentTime;
    if (warmup) this.hit("rim", 1, now + 0.01);
    this.startTime = now + (warmup ? 0.5 : 0.08);
    this.endTime = repeat ? Infinity : this.startTime + this.timeline.total;
    this.nextBar = 0;
    this.nextTime = this.startTime;
    this.queue = [];
    const schedule = (initial = false) => {
      if (!this.active) return;
      const now = this.ctx.currentTime;
      if (now >= this.endTime) {
        this.active = false;
        clearInterval(this.timer);
        cancelAnimationFrame(this.frame);
        // Let the final drum/cymbal decay naturally after the last bar.
        onEnded();
        return;
      }
      const horizon = (initial ? this.startTime : now) + 0.15;
      while (
        this.nextTime < horizon &&
        this.nextTime < this.endTime - 0.000001
      ) {
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
        if (e.time < horizon) {
          if (e.time >= now - 0.02)
            this.hit(e.instrument, e.level, Math.max(now, e.time));
          return false;
        }
        return true;
      });
    };
    // Queue the first hit now; do not rely on a timer firing during startup.
    schedule(true);
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
  setRepeating(repeat) {
    if (!this.active) return;
    if (repeat) {
      this.endTime = Infinity;
      return;
    }
    const cycle =
      Math.floor(
        Math.max(0, this.ctx.currentTime - this.startTime) /
          this.timeline.total,
      ) + 1;
    this.endTime = this.startTime + cycle * this.timeline.total;
    this.queue = this.queue.filter(
      (event) => event.time < this.endTime - 0.000001,
    );
    this.nextBar = Math.min(this.nextBar, cycle * this.project.bars.length);
    this.nextTime = Math.min(this.nextTime, this.endTime);
    for (const source of this.sources)
      if (source.beatsTime >= this.endTime - 0.000001) {
        source.stop();
        this.sources.delete(source);
      }
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
