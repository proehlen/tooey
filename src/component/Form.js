// @flow

import ComponentBase from './ComponentBase';
import Tab from '../Tab';
import Input, { type InputType } from './Input';
import output from '../output';

import {
  KEY_TAB, KEY_SHIFT_TAB, KEY_LEFT, KEY_RIGHT, KEY_ESCAPE, KEY_UP, KEY_DOWN, KEY_ENTER,
} from '../keys';

/**
 * The direction of user selection in a {@link Form}
 *
 * A negative value indicates backwards / up, a positive value indicates forwards
 * / down.
 */
type FormSelectionDirection = -1 | 1

/**
 * A function to be called by the {@link Form} when there are no more fields in
 * the direction the user was navigating.
 *
 * This may be useful in parent views where you wish the user to navigate
 * between components such a Form and a Menu
 */
type FormOnNoMoreFields = (FormSelectionDirection) => Promise<void>

/**
 * A function to be called by the {@link Form} when the user presses the Esc key
 */
type FormOnEscape = () => Promise<void>

/**
 * Options for the {@link Form}
 */
export type FormOptions = {
  readOnly?: boolean,
  onNoMoreFields?: FormOnNoMoreFields,
  onEscape?: FormOnEscape,
}

/**
 * A description of a single field on the {@link Form}
 *
 * A convenience for constructing Forms, this data is used to instantiate actual
 * form fields
 */
export type FormFieldDescription = {
  label: string,
  default: string,
  type: InputType,
}

/**
 * A visible field in the {@link Form}
 */
export type FormField = {
  label: string,
  input: Input,
}

/**
 * A component for presenting several {@link Input} components
 */
export default class Form extends ComponentBase {
  _tab: Tab
  _fields: Array<FormField>
  _selectedFieldIndex: number | void
  _readOnly: ?boolean
  _onNoMoreFields: ?FormOnNoMoreFields
  _onEscape: ?FormOnEscape

  constructor(
    tab: Tab,
    fields: Array<FormFieldDescription>,
    options: FormOptions = {},
  ) {
    super();
    this._tab = tab;
    this._fields = fields.map(data => ({
      label: data.label,
      input: new Input(tab, this._onEnter.bind(this), data.default, data.type),
    }));
    this._readOnly = options.readOnly;
    this._onNoMoreFields = options.onNoMoreFields;
    this._onEscape = options.onEscape;
  }

  async _onEnter() {
    this._cycleSelectedField(1);
  }

  /**
   * Return the fields that belong to a {@link Form}
   */
  get fields(): FormField[] {
    return this._fields;
  }

  /**
   * Return the currently selected {@link Form} field (if one)
   */
  get selectedField(): ?FormField {
    let result;
    if (this._selectedFieldIndex !== undefined) {
      result = this._fields[this._selectedFieldIndex];
    }
    return result;
  }

  /**
   * Set the first {@link FormField} on the {@link Form} to be the selected one
   */
  setFirstFieldSelected() {
    this._selectedFieldIndex = 0;
  }

  /**
   * Set the last {@link FormField} on the {@link Form} to be the selected one
   */
  setLastFieldSelected() {
    this._selectedFieldIndex = this._fields.length - 1;
  }

  /**
   * Faciliate backward or forward navigation between fields on the {@link Form}
   * @private
   */
  _cycleSelectedField(direction: FormSelectionDirection) {
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

  /**
   * Handle user input in the {@link Form}
   *
   * Returns `true` if the input was handled
   */
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
        this._cycleSelectedField(-1);
        handled = true;
        break;
      case KEY_DOWN:
      case KEY_RIGHT:
      case KEY_TAB:
      case KEY_ENTER:
        this._cycleSelectedField(1);
        handled = true;
        break;
      default:
        if (this.selectedField) {
          if (this._readOnly) {
            this._tab.setWarning('This form is not editable.');
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

  /**
   * Render the {@link Form}
   */
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
