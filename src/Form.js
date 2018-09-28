// @flow

import ComponentBase from './ComponentBase';
import App from './App';
import Input, { type InputType } from './Input';
import output from './output';

import {
  KEY_TAB, KEY_SHIFT_TAB, KEY_LEFT, KEY_RIGHT, KEY_ESCAPE, KEY_UP, KEY_DOWN, KEY_ENTER,
} from './keys';

export type FieldData = {
  label: string,
  default: string,
  type: InputType,
}

export type Field = {
  label: string,
  input: Input,
}

type Direction = -1 | 1
type NoMoreFieldsCallback = (Direction) => Promise<void>
type EscapeCallback = () => Promise<void>

export default class Form extends ComponentBase {
  _fields: Array<Field>
  _selectedFieldIndex: number | void
  _onNoMoreFields: NoMoreFieldsCallback
  _onEscape: EscapeCallback

  constructor(
    app: App,
    fields: Array<FieldData>,
    onNoMoreFields?: NoMoreFieldsCallback,
    onEscape?: EscapeCallback,
  ) {
    super();
    this._fields = fields.map(data => ({
      label: data.label,
      input: new Input(app, this._onEnter.bind(this), data.default, data.type),
    }));
    if (onNoMoreFields) {
      this._onNoMoreFields = onNoMoreFields;
    }
    if (onEscape) {
      this._onEscape = onEscape;
    }
  }

  async _onEnter() {
    this.cycleSelectedField(1);
  }

  get fields() {
    return this._fields;
  }

  get selectedField() {
    let result;
    if (this._selectedFieldIndex !== undefined) {
      result = this._fields[this._selectedFieldIndex];
    }
    return result;
  }

  setFirstFieldSelected() {
    this._selectedFieldIndex = 0;
  }

  setLastFieldSelected() {
    this._selectedFieldIndex = this._fields.length - 1;
  }

  cycleSelectedField(direction: 1 | -1) {
    if (this._selectedFieldIndex === undefined) {
      // No current field selected
      if (direction === 1) {
        // Select first field
        this._selectedFieldIndex = 0;
      } else {
        // Select last field
        this._selectedFieldIndex = this._fields.length - 1;
      }
    } else {
      // Go to previous/next field
      this._selectedFieldIndex += direction;
      if (this._selectedFieldIndex < 0 || this._selectedFieldIndex >= this._fields.length) {
        // No more previous fields - callback view to handle
        // in case they want to switch cycling to another
        // control - e.g. a menu
        this._selectedFieldIndex = undefined;
        if (this._onNoMoreFields) {
          this._onNoMoreFields(direction);
        }
      }
    }
  }

  async handle(key: string) {
    switch (key) {
      case KEY_ESCAPE:
        if (this._onEscape) {
          this._selectedFieldIndex = undefined;
          await this._onEscape();
        }
        break;
      case KEY_UP:
      case KEY_LEFT:
      case KEY_SHIFT_TAB:
        this.cycleSelectedField(-1);
        break;
      case KEY_DOWN:
      case KEY_RIGHT:
      case KEY_TAB:
      case KEY_ENTER:
        this.cycleSelectedField(1);
        break;
      default:
        if (this.selectedField) {
          await this.selectedField.input.handle(key);
        }
        break;
    }
  }

  _renderField(index: number, active: boolean) {
    const row = output.contentStartRow + index;
    output.cursorTo(0, row);
    const field = this._fields[index];
    if (field) {
      console.log(field.label);
      field.input.render(!active, 20, row, false);
    }
  }

  render() {
    // Render inactive fields first
    for (let i = 0; i < this._fields.length; ++i) {
      const active = (i === this._selectedFieldIndex);
      if (!active) {
        this._renderField(i, active);
      }
    }

    // Render active field last (so cursor is left in correct position)
    if (this._selectedFieldIndex !== undefined) {
      this._renderField(this._selectedFieldIndex, true);
    }
  }
}
