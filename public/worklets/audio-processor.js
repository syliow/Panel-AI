class AudioRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const inputChannel = input[0];
    const inputLength = inputChannel.length;

    for (let i = 0; i < inputLength; i++) {
      this.buffer[this.bufferIndex++] = inputChannel[i];

      if (this.bufferIndex >= this.bufferSize) {
        this.flush();
      }
    }

    return true;
  }

  flush() {
    const int16 = new Int16Array(this.bufferSize);
    for (let i = 0; i < this.bufferSize; i++) {
      const s = Math.max(-1, Math.min(1, this.buffer[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // Post the buffer. We transfer the buffer to avoid copy.
    this.port.postMessage(int16.buffer, [int16.buffer]);

    this.bufferIndex = 0;
  }
}

registerProcessor('audio-recorder-processor', AudioRecorderProcessor);
