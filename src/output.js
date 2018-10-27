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

/**
 * Convenience class for all things dealing with stdout
 *
 * *Note*: It is not possible for clients to instantiate this class
 * directly; import the {@link output} constant instead.
 */
class Output {
  _width: number
  _height: number

  /**
   * @hideconstructor
   */
  constructor() {
    this.resize();
  }

  /**
   * Clear the output
   */
  clear(): void {
    clear();
  }

  /**
   * Moves the cursor to the nominated column (`x`) and row (`y`)
   */
  cursorTo(x: number, y: number): void {
    readline.cursorTo(process.stdout, x, y);
  }

  /**
   * Resets the output width and height based on the current window size
   * @private
   *
   * Note: does not re-render the view - that is handled by the App instance.
   */
  resize(): void {
    const [width, height] = process.stdout.getWindowSize();
    this._width = width;
    this._height = height;
  }

  /**
   * Returns the height (number of rows) in the console window
   */
  get height(): number {
    return this._height;
  }

  /**
   * Returns the number of available rows for rendering view content
   */
  get contentHeight(): number {
    return this.height - TITLE_HEIGHT - MENU_HEIGHT - STATUS_HEIGHT;
  }

  /**
   * Returns the row number at which the menu should be rendered
   */
  get menuRow(): number {
    return 0 + TITLE_HEIGHT;
  }

  /**
   * Gets the number of the first row in which view content can be rendered
   */
  get contentStartRow(): number {
    return this.menuRow + MENU_HEIGHT;
  }

  /**
   * Gets the width / number of columns available the console window
   */
  get width(): number {
    return this._width;
  }
}

/**
 * The output singleton - an instance of {@link Output}
 */
const output = new Output();

export default output;
