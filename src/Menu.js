// @flow

import colors from 'colors';
import cliui from 'cliui';

import App from './App';
import ComponentBase from './ComponentBase';
import MenuItem from './MenuItem';
import output from './output';
import {
  KEY_ENTER, KEY_ESCAPE, KEY_LEFT, KEY_RIGHT, KEY_TAB, KEY_SHIFT_TAB,
} from './keys';


const ITEM_GAP = 3; // Render gap between items

type Direction = -1 | 1
type NoMoreItemsCallback = (Direction) => Promise<void>

export default class Menu extends ComponentBase {
  _app: App
  _items: MenuItem[]
  _selectedIndex: number
  _hasBack: boolean
  _onNoMoreItems: NoMoreItemsCallback

  constructor(
    app: App,
    items?: MenuItem[] = [],
    allowBackItem: boolean = true,
    onNoMoreItems?: NoMoreItemsCallback,
  ) {
    super();

    this._app = app;
    this._items = [];
    if (onNoMoreItems) {
      this._onNoMoreItems = onNoMoreItems;
    }

    // Every menu has to allow for quitting
    this.addItem(new MenuItem('Q', 'Quit', 'Exit the program'));

    // Most menus have (B)ack item
    if (allowBackItem) {
      this.addItem(new MenuItem('B', 'Back', 'Go back to previous menu'), 'start');
      this._hasBack = true;
    } else {
      this._hasBack = false;
    }

    // Add items specific to this menu
    items.reverse().forEach(item => this.addItem(item, 'start'));

    // Set active/default  action
    this.selectedIndex = 0;
  }

  render(inactive: boolean) {
    // Build items text
    output.cursorTo(0, output.menuRow);
    const ui = cliui();
    const text = this._items.reduce((acc, item, index) => {
      const separator = index > 0 ? ` ${String.fromCharCode(183)} ` : '';
      const preKeyText = (item.keyPosition) ? item.label.substring(0, item.keyPosition) : '';
      const postKeyText = item.label.substr(item.keyPosition + 1);
      const keyText = !inactive
        ? colors.bold(item.key)
        : item.key;
      return `${acc}${separator}${preKeyText}${keyText}${postKeyText}`;
    }, '');
    ui.div(text);

    console.log(ui.toString());
    if (!inactive) {
      this._cursorToselectedItem();
    }
  }

  addItem(item: MenuItem, position: 'start' | 'end' = 'end') {
    if (this._items.findIndex(existing => existing.key === item.key) > -1) {
      throw new Error(`Cannot create menu with duplicate key '${item.key}'`);
    }

    if (position === 'start') {
      this._items.unshift(item);
    } else {
      const insertAt = this._hasBack
        ? this._items.length - 2 // before Back
        : this._items.length - 1; // before Quit
      this._items.splice(insertAt, 0, item);
    }
  }

  setSelectedItem(key: string) {
    const index = this._items.findIndex(item => item.key === key);
    if (index < 0) {
      throw new Error(`Cannot set selected menu item; missing key '${key}'`);
    }
    this.selectedIndex = index;
  }

  setFirstItemSelected() {
    this.selectedIndex = 0;
  }

  setLastItemSelected() {
    this.selectedIndex = this._items.length - 1;
  }

  get selectedIndex() { return this._selectedIndex; }
  get selectedItem() { return this._items[this._selectedIndex]; }
  get items() { return this._items; }

  set selectedIndex(index: number) {
    this._selectedIndex = index;
    if (this.selectedItem) {
      this._app.setInfo(this.selectedItem.help);
    }
  }

  async cycleSelectedItem(direction: 1 | -1) {
    this.selectedIndex += direction;

    if (this.selectedIndex < 0) {
      if (this._onNoMoreItems) {
        await this._onNoMoreItems(direction);
      } else {
        this.selectedIndex = this._items.length - 1;
      }
    } else if (this.selectedIndex >= this._items.length) {
      if (this._onNoMoreItems) {
        await this._onNoMoreItems(direction);
      } else {
        this.selectedIndex = 0;
      }
    }
  }

  _cursorToselectedItem() {
    let x = 0;
    for (let i = 0; i < this.selectedIndex; i++) {
      const item = this._items[i];
      x += (item.label.length + ITEM_GAP);
    }
    output.cursorTo(x + this.selectedItem.keyPosition, 1);
  }


  async handle(key: string): Promise<boolean> {
    let handled = false;
    if (key === KEY_ENTER) {
      // Call back this method (maybe in child class) with key
      // for active item
      handled = await this.handle(this.selectedItem.key);
    } else {
      switch (key.toUpperCase()) {
        case KEY_ESCAPE:
          if (this._app.viewDepth) {
            this._app.popView();
          } else {
            this._app.quit();
          }
          handled = true;
          break;
        case KEY_LEFT:
        case KEY_SHIFT_TAB:
          await this.cycleSelectedItem(-1);
          handled = true;
          break;
        case KEY_RIGHT:
        case KEY_TAB:
          await this.cycleSelectedItem(1);
          handled = true;
          break;
        case 'B':
          // Back
          if (this._app.viewDepth) {
            this._app.popView();
            handled = true;
          }
          break;
        case 'Q':
          // Quit
          this._app.quit();
          handled = true;
          break;
        default: {
          const item = this._items.find(candidate => candidate.key === key.toUpperCase());
          if (item) {
            if (item.execute) {
              await item.execute();
            } else {
              // Valid item
              this._app.setWarning(`Sorry, the '${item.label}' feature is not implemented yet`);
            }
            handled = true;
          }
          break;
        }
      }
    }
    return handled;
  }
}
