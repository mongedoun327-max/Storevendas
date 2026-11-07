export class EscPosBuilder {
  private buffer: number[] = [];

  init(): this {
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

  size(width: number = 0, height: number = 0): this {
    const sizeByte = (width << 4) | height;
    this.buffer.push(0x1d, 0x21, sizeByte);
    return this;
  }

  text(content: string): this {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(content);
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

  cut(): this {
    this.buffer.push(0x1d, 0x56, 0x42, 0x00);
    return this;
  }

  row(left: string, right: string, width: number = 48): this {
    const spaceCount = width - (left.length + right.length);
    const spaces = " ".repeat(Math.max(0, spaceCount));
    this.line(`${left}${spaces}${right}`);
    return this;
  }

  build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}
