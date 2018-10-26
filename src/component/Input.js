// @flow

import Tab from '../Tab';
import ComponentBase from './ComponentBase';
import output from '../output';
import { KEY_ESCAPE, KEY_ENTER, KEY_BACKSPACE } from '../keys';

/**
 * The type of input that should be accepted or be represented by the {@link Input} component
 */
export type InputType = 'string' | 'integer' | 'password';

/**
 * A component for accepting user input
 */
export default class Input extends ComponentBase {
  _value: string
  _onEnter: (string) => Promise<void>
  _type: InputType
  _tab: Tab

  constructor(tab: Tab, onEnter: (string) => Promise<void>, initialValue: string = '', type: InputType = 'string') {
    super();
    this._tab = tab;
    this._onEnter = onEnter;
    this._value = initialValue;
    this._type = type;
  }

  /**
   * The current value of the {@link Input}
   */
  get value() { return this._value; }
  set value(value: string) { this._value = value; }

  /**
   * Render the {@link Input} to the console
   */
  render(
    inactive: boolean = false,
    atColumn: number = 0,
    atRow: number = output.contentStartRow,
    allowWrap: boolean = true,
  ) {
    // Output value
    const promptColumnWidth = 2;
    const valueColumnWidth = output.width - atColumn - promptColumnWidth;
    const rows = allowWrap
      ? Math.trunc(this._value.length / valueColumnWidth) + 1
      : 1;

    let overflow = false;
    for (let row = 0; row < rows; row++) {
      let prompt;
      if (row === 0) {
        prompt = !inactive ? '> ' : ': ';
      } else {
        prompt = '  ';
      }
      let value;
      if (allowWrap || inactive || this.value.length < valueColumnWidth) {
        value = this.value.substr(row * valueColumnWidth, valueColumnWidth);
      } else {
        overflow = true;
        const cursorWidth = 1;
        const from = this.value.length - valueColumnWidth + cursorWidth;
        const length = valueColumnWidth - cursorWidth;
        value = this.value.substr(from, length);
        value = `${value} `; // space for cursor
      }
      if (this._type === 'password') {
        value = '*'.repeat(value.length);
      }
      output.cursorTo(atColumn, atRow + row);
      console.log(`${prompt}${value}`);
    }

    // Put cursor back to next char after last character output - ie where
    // the user will be typing next
    if (!inactive) {
      let cursorColumn;
      if (!overflow) {
        cursorColumn = atColumn + (this._value.length % valueColumnWidth) + promptColumnWidth;
      } else {
        cursorColumn = output.width;
      }
      const cursorRow = atRow + (rows - 1);
      output.cursorTo(cursorColumn, cursorRow);
    }
  }

  /**
   * Handle user input to the {@link Input} component
   */
  async handle(key: string): Promise<boolean> {
    let handled = false;
    switch (key) {
      case KEY_BACKSPACE:
        this._value = this._value.substr(0, this._value.length - 1);
        handled = true;
        break;
      case KEY_ENTER:
        await this._onEnter(this._value);
        handled = true;
        break;
      case KEY_ESCAPE:
        if (this._value.length) {
          this._value = '';
        } else {
          this._tab.popView();
        }
        handled = true;
        break;
      default:
        switch (this._type) {
          case 'integer':
            {
              // Find any non-integer chars in input
              const nonInt = key.split('').find(char => '0123456789'.indexOf(char) < 0);
              if (!nonInt) {
                this._value += key;
                handled = true;
              }
            }
            break;
          default:
            // Add printable chars to input text - ignore all other
            // special chars (e.g. unprintable arrow keys etc)
            // that haven't been handled by this point.
            if (key.length === 1 && key.charCodeAt(0) > 0x1F) {
              this._value += key;
              handled = true;
            } else if (key.length > 4) {
              // Need to allow multiple chars for pasting - some of
              // these might not be printable however
              this._value += key;
              handled = true;
            } else {
              // keys of length 2 to 4 are possibly arrow navigation and other
              // undesirable inputs that will screw up our input control so
              // ignore them.  It presently means that you can't paste
              // less than 5 chars into the input field.
              handled = false;
            }
        }
    }

    return handled;
  }
}
