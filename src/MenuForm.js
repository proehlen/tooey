// @flow

import App from './App';
import ComponentBase from './ComponentBase';
import Form, { type FormFieldDescription } from './Form';
import Menu from './Menu';
import MenuItem from './MenuItem';

import {
  KEY_UP, KEY_DOWN,
} from './keys';

export default class MenuForm extends ComponentBase {
  _menu: Menu
  _form: Form
  _activeComponent: ComponentBase

  constructor(app: App, fields: Array<FormFieldDescription>, MenuItems: Array<MenuItem>) {
    super();

    // Create form
    this._form = new Form(
      app,
      fields, {
        onNoMoreFields: this.onNoMoreFields.bind(this),
        onEscape: this.onEscapeFromField.bind(this),
      },
    );

    // Create menu
    this._menu = new Menu(app, MenuItems, true, this.onNoMoreOptions.bind(this));

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

  async handle(key: string) {
    if ((key === KEY_DOWN || key === KEY_UP) && this._activeComponent === this._menu) {
      // Menu doesn't respond to arrow up/down - in this view
      // we will use it to shift to form if menu is active
      this._activeComponent = this._form;
      this._form.setFirstFieldSelected();
    } else {
      await this._activeComponent.handle(key);
    }
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
