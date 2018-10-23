// @flow

import ComponentBase from './ComponentBase';
import App from './App';
import Input, { type InputType } from './Input';
import output from './output';

import {
  KEY_TAB, KEY_SHIFT_TAB, KEY_LEFT, KEY_RIGHT, KEY_ESCAPE, KEY_UP, KEY_DOWN, KEY_ENTER,
} from './keys';

type FormSelectionDirection = -1 | 1
type FormOnNoMoreFields = (FormSelectionDirection) => Promise<void>
type FormOnEscape = () => Promise<void>

export type FormOptions = {
  readOnly?: boolean,
  onNoMoreFields?: FormOnNoMoreFields,
  onEscape?: FormOnEscape,
}

export type FormFieldDescription = {
  label: string,
  default: string,
  type: InputType,
}

export type FormField = {
  label: string,
  input: Input,
}

export default class Form extends ComponentBase {
  _app: App
  _fields: Array<FormField>
  _selectedFieldIndex: number | void
  _readOnly: ?boolean
  _onNoMoreFields: ?FormOnNoMoreFields
  _onEscape: ?FormOnEscape

  constructor(
    app: App,
    fields: Array<FormFieldDescription>,
    options: FormOptions = {},
  ) {
    super();
    this._app = app;
    this._fields = fields.map(data => ({
      label: data.label,
      input: new Input(app, this._onEnter.bind(this), data.default, data.type),
    }));
    this._readOnly = options.readOnly;
    this._onNoMoreFields = options.onNoMoreFields;
    this._onEscape = options.onEscape;
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

  cycleSelectedField(direction: FormSelectionDirection) {
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

  async handle(key: string): Promise<boolean> {
    let handled: boolean = false;
    switch (key) {
      case KEY_ESCAPE:
        if (this._onEscape) {
          this._selectedFieldIndex = undefined;
          await this._onEscape();
          handled = true;
        }
        break;
      case KEY_UP:
      case KEY_LEFT:
      case KEY_SHIFT_TAB:
        this.cycleSelectedField(-1);
        handled = true;
        break;
      case KEY_DOWN:
      case KEY_RIGHT:
      case KEY_TAB:
      case KEY_ENTER:
        this.cycleSelectedField(1);
        handled = true;
        break;
      default:
        if (this.selectedField) {
          if (this._readOnly) {
            this._app.setWarning('This form is not editable.');
          } else {
            await this.selectedField.input.handle(key);
          }
          handled = true;
        }
        break;
    }

    return handled;
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
