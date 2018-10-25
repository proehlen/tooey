// @flow

import Tab from './Tab';
import ComponentBase from './ComponentBase';
import Form, { type FormFieldDescription } from './Form';
import Menu, { type MenuItem } from './Menu';

import {
  KEY_UP, KEY_DOWN,
} from './keys';

export type FormViewOptions = {
  readOnly?: boolean
}

export default class FormView extends ComponentBase {
  _menu: Menu
  _form: Form
  _activeComponent: ComponentBase

  constructor(
    tab: Tab,
    fields: Array<FormFieldDescription>,
    menuItems: Array<MenuItem>,
    options: FormViewOptions = {},
  ) {
    super();

    // Create form
    this._form = new Form(
      tab,
      fields, {
        onNoMoreFields: this.onNoMoreFields.bind(this),
        onEscape: this.onEscapeFromField.bind(this),
        readOnly: options.readOnly,
      },
    );

    // Create menu
    this._menu = new Menu(tab, menuItems, true, this.onNoMoreOptions.bind(this));

    // Start with menu active
    this._activeComponent = this._menu;
  }

  get menu() { return this._menu; }
  get form() { return this._form; }
  get fields() { return this._form.fields; }

  async onNoMoreOptions(direction: number) {
    this._activeComponent = this._form;
    if (direction > 0) {
      this._form.setFirstFieldSelected();
    } else {
      this._form.setLastFieldSelected();
    }
  }

  async onNoMoreFields(direction: number) {
    this._activeComponent = this._menu;
    if (direction > 0) {
      this._menu.setFirstItemSelected();
    } else {
      this._menu.setLastItemSelected();
    }
  }

  async onEscapeFromField() {
    this._activeComponent = this._menu;
  }

  async handle(key: string): Promise<boolean> {
    let handled = false;
    if ((key === KEY_DOWN || key === KEY_UP) && this._activeComponent === this._menu) {
      // Menu doesn't respond to arrow up/down - in this view
      // we will use it to shift to form if menu is active
      this._activeComponent = this._form;
      this._form.setFirstFieldSelected();
      handled = true;
    } else {
      handled = await this._activeComponent.handle(key);
    }
    return handled;
  }

  render() {
    // Render components in proper order for cursor positioning
    if (this._activeComponent === this._menu) {
      this._form.render();
      this._menu.render(false);
    } else {
      this._menu.render(true);
      this._form.render();
    }
  }
}
