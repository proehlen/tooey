// @flow

import colors from 'colors';
import { rightPad } from 'stringfu';


import Tab from '../Tab';
import ComponentBase from './ComponentBase';
import Menu from './Menu';
import output from '../output';

import {
  KEY_PAGE_DOWN, KEY_PAGE_UP, KEY_DOWN, KEY_UP, KEY_ENTER,
} from '../keys';

/**
 * A column to be displayed in a {@link List}.
 *
 * The value function recieves a list row (an item / object of type T) and the
 * row index and returns the value to be output as a string in that column.
 */
export type ListColumn<T> = {
  heading: string,
  width: number,
  value: (T, number) => string,
}

type OutputRow = Array<string>

/**
 * Items to display in a {@link List} - an array of objects of type T
 */
export type ListItems<T> = Array<T>

/**
 * Callback function to be called when the user navigates to
 * a different row in a {@link List} (ie via up/down arrows).  Requires
 * List to be constructed with `rowSelection` set to `true`.
 */
export type ListOnSelect = () => Promise<void>

/**
 * Callback function to be called when the user presses Enter
 * on a {@link List} row.
 */
export type ListOnEnter = (number) => Promise<void>

/**
 * {@link List} options
 */
export type ListOptions = {
  showHeadings?: boolean,
  menu?: Menu,
  rowSelection?: boolean,
  onSelect?: ListOnSelect,
  onEnter?: ListOnEnter,
}

/**
 * A multi-column List component with optional row selection
 */
export default class List<T> extends ComponentBase {
  _tab: Tab
  _startIndex: number
  _items: ListItems<T>
  _columns: Array<ListColumn<T>>
  _showHeadings: boolean
  _rowSelection: boolean
  _onSelect: ListOnSelect
  _onEnter: ListOnEnter
  _selectedPageRow: number

  /**
   * List constructor
   */
  constructor(
    tab: Tab,
    columns: Array<ListColumn<T>>,
    items: ListItems<T>,
    options: ListOptions = {},
  ) {
    super();
    this._tab = tab;
    this._columns = columns;
    this.items = items;
    this._showHeadings = options.showHeadings === undefined ? true : options.showHeadings;
    this._rowSelection = options.rowSelection === undefined ? false : options.rowSelection;
    if (options.onSelect) {
      if (!this._rowSelection) {
        throw new Error('onSelect callback is incompatible with rowSelection === false');
      }
      this._onSelect = options.onSelect;
    }
    if (options.onEnter) {
      this._onEnter = options.onEnter;
    }
    if (options.menu) {
      // Add page down to menu
      options.menu.addItem({
        key: 'D',
        label: 'Page Down',
        help: 'Go to next page',
        execute: this._pageDown.bind(this),
        visible: () => !this._isLastPage(),
      });
    }
    if (options.menu) {
      // Add page up to menu (incorrect flow error requires above additional if statement)
      options.menu.addItem({
        key: 'U',
        label: 'Page Up',
        help: 'Return to previous page',
        execute: this._pageUp.bind(this),
        visible: () => this._currentPage() > 1,
      });
    }
  }

  /**
   * Items shown in a {@link List}
   */
  get items(): ListItems<T> {
    return this._items;
  }

  set items(items: ListItems<T>): void {
    this._items = items;
    this._startIndex = 0;
    this._selectedPageRow = 0;
  }

  _getValues(object: T, index: number): OutputRow {
    const result = [];
    for (let i = 0; i < this._columns.length; i++) {
      const column = this._columns[i];
      result.push(column.value(object, index));
    }
    return result;
  }

  /**
   * Renders the {@link List}
   */
  render(): void {
    // Column headings
    if (this._showHeadings) {
      output.cursorTo(0, output.contentStartRow - 1);
      const reduceHeadingsToString = (accumulator, column): string => {
        const colText = rightPad(column.heading, column.width);
        return `${accumulator || ''}${colText} `;
      };
      const heading = this._columns.reduce(reduceHeadingsToString, '');
      console.log(colors.bgBlue.white(heading));
    }

    // Render items for current page
    output.cursorTo(0, output.contentStartRow);
    const reduceColsToString = (accumulator, colData, index): string => {
      const column = this._columns[index];
      const colText = rightPad(colData, column.width);
      return `${accumulator || ''}${colText} `;
    };
    this._items
      .slice(this._startIndex, this._startIndex + output.contentHeight)
      .map(this._getValues.bind(this))
      .map(cols => cols.reduce(reduceColsToString, ''))
      .forEach((text, index) => {
        const outputText = text.substr(0, output.width);
        if (this._rowSelection && index === this._selectedPageRow) {
          console.log(colors.inverse(outputText));
        } else {
          console.log(outputText);
        }
      });
  }

  /**
   * Changes the currently displayed items in a {@link List} to the previous page
   * @private
   */
  async _pageUp(): Promise<void> {
    if (this._startIndex === 0) {
      this._tab.setInfo('Already at start');
      return;
    }
    this._startIndex -= output.contentHeight;
    this._selectedPageRow = output.contentHeight - 1;
    if (this._startIndex < 0) {
      this._startIndex = 0;
    }

    if (this._onSelect) {
      await this._onSelect();
    }
  }

  /**
   * Return the index of the currently selected row in a {@link List}
   */
  get selectedRowIndex(): number {
    return this._startIndex + this._selectedPageRow;
  }

  _currentPage(): number {
    return Math.ceil((this._startIndex + 1) / output.contentHeight);
  }

  _numberPages(): number {
    return Math.floor(this._items.length / output.contentHeight) + 1;
  }

  _isLastPage(): boolean {
    return this._currentPage() >= this._numberPages();
  }

  /**
   * Changes the currently displayed items in a {@link List} to the next page
   * @private
   */
  async _pageDown(): Promise<void> {
    if ((this._startIndex + output.contentHeight) > this._items.length) {
      this._tab.setInfo('No more pages');
      return;
    }
    this._startIndex += output.contentHeight;
    this._selectedPageRow = 0;
    if (this._startIndex >= (this._items.length)) {
      this._startIndex = this._items.length - 1;
    }
    if (this._onSelect) {
      await this._onSelect();
    }
  }

  /**
   * Selects the previous record in a {@link List} (paging up if necessary)
   * @private
   */
  async _selectPrevious(): Promise<void> {
    if (this._selectedPageRow === 0) {
      await this._pageUp();
    } else {
      this._selectedPageRow--;
    }
    if (this._onSelect) {
      await this._onSelect();
    }
  }

  /**
   * Selects the next record in a {@link List} (paging down if necessary)
   * @private
   */
  async _selectNext(): Promise<void> {
    const isLastPage = this._isLastPage();
    const lastPageRowIndex = (this._items.length % output.contentHeight) - 1;
    if (!isLastPage && this._selectedPageRow >= output.contentHeight - 1) {
      await this._pageDown();
    } else if (isLastPage && this._selectedPageRow < lastPageRowIndex) {
      this._selectedPageRow++;
    } else if (!isLastPage) {
      this._selectedPageRow++;
    } else {
      this._tab.setInfo('No more records');
    }
    if (this._onSelect) {
      await this._onSelect();
    }
  }

  /**
   * Handle user input to a {@link List}
   */
  async handle(key: string): Promise<boolean> {
    let handled = false;
    switch (key) {
      case KEY_ENTER:
        if (this._onEnter) {
          await this._onEnter(this.selectedRowIndex);
          handled = true;
        }
        break;
      case KEY_DOWN:
        if (this._rowSelection) {
          await this._selectNext();
        } else {
          await this._pageDown();
        }
        handled = true;
        break;
      case KEY_UP:
        if (this._rowSelection) {
          await this._selectPrevious();
        } else {
          await this._pageUp();
        }
        handled = true;
        break;
      case KEY_PAGE_DOWN:
        await this._pageDown();
        handled = true;
        break;
      case KEY_PAGE_UP:
        await this._pageUp();
        handled = true;
        break;
      default:
        // Don't handle here
        handled = false;
    }
    return handled;
  }
}
