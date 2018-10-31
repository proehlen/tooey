// @flow

import colors from 'colors';
import cliui from 'cliui';

import Tab from '../Tab';
import ComponentBase from './ComponentBase';
import output from '../output';
import {
  KEY_ENTER, KEY_ESCAPE, KEY_LEFT, KEY_RIGHT, KEY_TAB, KEY_SHIFT_TAB,
} from '../keys';


const ITEM_GAP = 3; // Render gap between items
const MENU_PREFIX = 'Menu';

/**
 * The direction of user selection in a {@link Menu}
 *
 * A negative value indicates backwards, a positive value indicates forwards
 */
type MenuSelectionDirection = -1 | 1

/**
 * A function to be called by the {@link Menu} when there are no more items in
 * the direction the user was navigating.
 *
 * This may be useful in parent views where you wish the user to navigate
 * between components such a Form and a Menu
 */
type MenuOnNoMoreItems = (MenuSelectionDirection) => Promise<void>

/**
 * An item in a {@link Menu}
 *
 * Each item has:
 * * a key (a single character in the alphabet which is a short cut)
 * * a label that appears in the menu
 * * help text that is rendered in the status bar
 * * an `execute` function to be called when the user chooses the item
 * * an optional functon to be called to dynamically determine the item's visibility
 */
export type MenuItem = {
  key: string,
  label: string,
  help: string,
  execute?: () => Promise<void>,
  visible?: () => boolean,
}

/**
 * Options for constructing a {@link Menu}
 *
 * These are optional settings or values for constructing a Menu, not
 * menu items - ie not the entries that the user sees.
 */
export type MenuOptions = {
  hideBackItem?: boolean,
  onNoMoreItems?: MenuOnNoMoreItems,
}

/**
 * A menu is a horizontal row of {@link MenuItem items} from which the user can choose
 */
export default class Menu extends ComponentBase {
  _tab: Tab
  _items: MenuItem[]
  _selectedItem: MenuItem
  _hasBack: boolean
  _onNoMoreItems: ?MenuOnNoMoreItems

  constructor(
    tab: Tab,
    items?: MenuItem[] = [],
    options?: MenuOptions = {},
  ) {
    super();

    this._tab = tab;
    this._items = [];
    this._onNoMoreItems = options.onNoMoreItems;

    // Every menu has to allow for quitting
    this.addItem({
      key: 'Q',
      label: 'Quit',
      help: 'Exit the program',
    });

    // Most menus have (B)ack item
    if (!options.hideBackItem) {
      this.addItem({
        key: 'B',
        label: 'Back',
        help: 'Go back to previous menu',
      }, 'start');
      this._hasBack = true;
    } else {
      this._hasBack = false;
    }

    // Add items specific to this menu
    items.reverse().forEach(item => this.addItem(item, 'start'));

    // Select first item
    this.setFirstItemSelected();
  }

  /**
   * Return currently visible items in the {@link Menu}
   */
  getVisibleItems(): MenuItem[] {
    return this._items
      .filter(item => !item.visible || item.visible());
  }

  /**
   * Render the {@link Menu} to the console.
   *
   * Menus are always rendered at a fixed line at the top of the console.
   */
  render(inactive: boolean): void {
    // After processing, some menu items may no longer be visible (dynamically hidden) including
    // the one that was previously selected. Ensure a menu item is still selected
    const visibleItems = this.getVisibleItems();
    let selectedIndex = visibleItems.indexOf(this._selectedItem);
    if (selectedIndex < 0) {
      // No menu item selected - select first item
      selectedIndex = 0;
      this.setFirstItemSelected();
    }

    // Build items text
    output.cursorTo(0, output.menuRow);
    const ui = cliui({ wrap: false, width: output.width });
    const text = visibleItems
      .reduce((acc, item, index) => {
        const keyPosition = this._itemKeyPosition(item);
        const separator = index > 0 ? ` ${String.fromCharCode(183)} ` : '';
        const preKeyText = this._itemKeyPosition ? item.label.substring(0, keyPosition) : '';
        const postKeyText = item.label.substr(this._itemKeyPosition(item) + 1);
        const keyText = !inactive
          ? colors.bold(item.key)
          : item.key;
        return `${acc}${separator}${preKeyText}${keyText}${postKeyText}`;
      }, `${colors.blue(MENU_PREFIX)} | `);
    ui.div(`${text} |`);

    console.log(ui.toString());
    if (!inactive) {
      this._cursorToSelectedItem();
    }
  }

  _itemKeyPosition(item: MenuItem): number {
    return item.label.indexOf(item.key);
  }

  /**
   * Add a single item to a {@link Menu}
   */
  addItem(item: MenuItem, position: 'start' | 'end' = 'end'): void {
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

  /**
   * Set which item is currently selected in the {@link Menu}
   */
  setSelectedItem(item: MenuItem): void {
    this._selectedItem = item;
    if (item) {
      this._tab.setInfo(item.help);
    }
  }

  /**
   * Set the first {@link MenuItem item} in the {@link Menu} to selected
   */
  setFirstItemSelected(): void {
    const visibleItems = this.getVisibleItems();
    this.setSelectedItem(visibleItems[0]);
  }

  /**
   * Set the last {@link MenuItem item} in the {@link Menu} to selected
   */
  setLastItemSelected(): void {
    const visibleItems = this.getVisibleItems();
    this.setSelectedItem(visibleItems[visibleItems.length - 1]);
  }

  /**
   * The currently selected item in the {@link Menu}
   *
   * Selected items are rendered as highlighed in some way and are
   * usually executed when the user presses Enter.  This is in contrast to
   * non-selected items can only be executed by pressing the `key`.
   */
  get selectedItem(): MenuItem { return this._selectedItem; }

  /**
   * Return all items in the {@link Menu}
   *
   * Note: not all of these items may be visible to the user.  Call `getVisibleItems`
   * if you only want visible items.
   */
  get items(): MenuItem[] { return this._items; }

  /**
   * Faciliate backward or forward navigation between items on the {@link Menu}
   * @private
   */
  async _cycleSelectedItem(direction: 1 | -1): Promise<void> {
    const visibleItems = this.getVisibleItems();
    let selectedIndex = visibleItems.indexOf(this._selectedItem);
    if (selectedIndex < 0) {
      // Selection  not found in visible items - select a new item
      if (direction > 0) {
        this.setFirstItemSelected();
      } else {
        // Select last
        this.setLastItemSelected();
      }
    } else {
      selectedIndex += direction;
      if (selectedIndex < 0) {
        if (this._onNoMoreItems) {
          await this._onNoMoreItems(direction);
        } else {
          this.setLastItemSelected();
        }
      } else if (selectedIndex >= visibleItems.length) {
        if (this._onNoMoreItems) {
          await this._onNoMoreItems(direction);
        } else {
          this.setFirstItemSelected();
        }
      } else {
        this.setSelectedItem(visibleItems[selectedIndex]);
      }
    }
  }

  _cursorToSelectedItem(): void {
    const visibleItems = this.getVisibleItems();
    const selectedIndex = visibleItems.indexOf(this._selectedItem);
    let x = MENU_PREFIX.length + 3;
    for (let i = 0; i < selectedIndex; i++) {
      const item = visibleItems[i];
      x += (item.label.length + ITEM_GAP);
    }
    const keyPosition = this._itemKeyPosition(this.selectedItem);
    output.cursorTo(x + keyPosition, 1);
  }

  /**
   * Handle user input to the {@link Menu}
   */
  async handle(key: string): Promise<boolean> {
    let handled = false;
    if (key === KEY_ENTER && this.selectedItem) {
      // Call back this method (maybe in child class) with key
      // for active item
      handled = await this.handle(this.selectedItem.key);
    } else {
      switch (key.toUpperCase()) {
        case KEY_ESCAPE:
          if (this._tab.viewDepth) {
            this._tab.popView();
          }
          handled = true;
          break;
        case KEY_LEFT:
        case KEY_SHIFT_TAB:
          await this._cycleSelectedItem(-1);
          handled = true;
          break;
        case KEY_RIGHT:
        case KEY_TAB:
          await this._cycleSelectedItem(1);
          handled = true;
          break;
        case 'B':
          // Back
          if (this._tab.viewDepth) {
            this._tab.popView();
            handled = true;
          }
          break;
        case 'Q':
          // Quit
          this._tab.quit();
          handled = true;
          break;
        default: {
          const item = this.getVisibleItems()
            .find(candidate => candidate.key === key.toUpperCase());
          if (item) {
            if (item.execute) {
              await item.execute();
            } else {
              // Valid item
              this._tab.setWarning(`Sorry, the '${item.label}' feature is not implemented yet`);
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
