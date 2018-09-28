// @flow

import clear from 'clear-console';
import readline from 'readline';

const TITLE_HEIGHT = 1;
const MENU_HEIGHT = 2;

// TODO fix:
// Status currently rendered in 2nd last row to prevent need for scrolling
const STATUS_HEIGHT = 2;

declare var process: {
  stdout: any
};

class Output {
  _width: number

  _height: number

  constructor() {
    this.resize();
  }

  clear() {
    clear();
  }

  cursorTo(x: number, y: number) {
    readline.cursorTo(process.stdout, x, y);
  }

  resize() {
    const [width, height] = process.stdout.getWindowSize();
    this._width = width;
    this._height = height;
  }

  get height() {
    return this._height;
  }

  get contentHeight() {
    return this.height - TITLE_HEIGHT - MENU_HEIGHT - STATUS_HEIGHT;
  }

  get menuRow() {
    return 0 + TITLE_HEIGHT;
  }

  get contentStartRow() {
    return this.menuRow + MENU_HEIGHT;
  }

  get width() {
    return this._width;
  }
}

const output = new Output();
export default output;
