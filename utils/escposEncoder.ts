export class EscPosEncoder {
  private buffer: number[] = [];
  private encoder = new TextEncoder();

  initialize(): this {
    this.buffer.push(0x1b, 0x40);
    return this;
  }

  align(alignment: "left" | "center" | "right"): this {
    const alignMap = { left: 0, center: 1, right: 2 };
    this.buffer.push(0x1b, 0x61, alignMap[alignment]);
    return this;
  }

  bold(enable: boolean): this {
    this.buffer.push(0x1b, 0x45, enable ? 1 : 0);
    return this;
  }

  size(width: number = 1, height: number = 1): this {
    const n = ((width - 1) << 4) | (height - 1);
    this.buffer.push(0x1d, 0x21, n);
    return this;
  }

  text(content: string): this {
    const bytes = this.encoder.encode(content);
    bytes.forEach((byte) => this.buffer.push(byte));
    return this;
  }

  line(content: string = ""): this {
    this.text(`${content}\n`);
    return this;
  }

  feed(lines: number = 1): this {
    this.buffer.push(0x1b, 0x64, lines);
    return this;
  }

  cut(partial: boolean = false): this {
    this.feed(3);
    this.buffer.push(0x1d, 0x56, partial ? 1 : 0);
    return this;
  }

  openCashDrawer(): this {
    this.buffer.push(0x1b, 0x70, 0x00, 0x19, 0xff);
    return this;
  }

  encode(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}
