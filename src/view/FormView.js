// @flow

import Tab from '../Tab';
import ComponentBase from '../component/ComponentBase';
import Form, { type FormFieldDescription, type FormField } from '../component/Form';
import Menu, { type MenuItem } from '../component/Menu';

import {
  KEY_UP, KEY_DOWN,
} from '../keys';

/**
 * Options for constructing a {@link FormView}
 */
export type FormViewOptions = {
  readOnly?: boolean
}

/**
 * A FormView is a view providing a {@link Form} and {@link Menu}
 */
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
        onNoMoreFields: this._onNoMoreFields.bind(this),
        onEscape: this._onEscapeFromField.bind(this),
        readOnly: options.readOnly,
      },
    );

    // Create menu
    this._menu = new Menu(tab, menuItems, {
      onBack: this._onNoMoreOptions.bind(this),
    });

    // Start with menu active
    this._activeComponent = this._menu;
  }

  /**
   * The menu for the {@link FormView}
   */
  get menu(): Menu { return this._menu; }

  /**
   * The form for the {@link FormView}
   */
  get form(): Form { return this._form; }

  /**
   * The fields on the {@link FormView}
   */
  get fields(): FormField[] { return this._form.fields; }

  async _onNoMoreOptions(direction: number): Promise<void> {
    this._activeComponent = this._form;
    if (direction > 0) {
      this._form.setFirstFieldSelected();
    } else {
      this._form.setLastFieldSelected();
    }
  }

  async _onNoMoreFields(direction: number): Promise<void> {
    this._activeComponent = this._menu;
    if (direction > 0) {
      this._menu.setFirstItemSelected();
    } else {
      this._menu.setLastItemSelected();
    }
  }

  async _onEscapeFromField(): Promise<void> {
    this._activeComponent = this._menu;
  }

  /**
   * Handle input to the {@link FormView}
   */
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

  /**
   * Render the {@link FormView}
   */
  render(): void {
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
