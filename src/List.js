// @flow

import colors from 'colors';
import { rightPad } from 'stringfu';


import App from './App';
import ComponentBase from './ComponentBase';
import Menu from './Menu';
import MenuOption from './MenuOption';
import output from './output';

import {
  KEY_PAGE_DOWN, KEY_PAGE_UP, KEY_DOWN, KEY_UP, KEY_ENTER,
} from './keys';

/**
 * A column to be displayed in the list.  The value function
 * recieves a row in the data (an object) and the row index
 * and returns the value to be output as a string in that
 * column.
 */
export type ListColumn<T> = {
  heading: string,
  width: number,
  value: (T, number) => string,
}

type OutputRow = Array<string>

/**
 * Data to display in the list - an array of objects.
 */
export type ListData<T> = Array<T>

/**
 * Callback function to be called when the user navigates to
 * a different row in the list (ie via up/down arrows).  Requires
 * List to be constructed with rowSelection === true.
 */
export type ListOnSelect = () => Promise<void>

/**
 * Callback function to be called when the user presses Enter
 * on a list row.
 */
export type ListOnEnter = (number) => Promise<void>

/**
 * List options
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
  _app: App
  _startIndex: number
  _data: ListData<T>
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
    app: App,
    columns: Array<ListColumn<T>>,
    data: ListData<T>,
    options: ListOptions = {},
  ) {
    super();
    this._app = app;
    this._columns = columns;
    this.setData(data);
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
      // Add paging to menu
      options.menu.addOption(new MenuOption('D', 'Page Down', 'Go to next page', this.pageDown.bind(this)));
    }
    if (options.menu) {
      // Add paging to menu (incorrect flow error requires section if statement)
      options.menu.addOption(new MenuOption('U', 'Page Up', 'Return to previous page', this.pageUp.bind(this)));
    }
  }

  /**
   * Updates the data shown in the list
   */
  setData(data: ListData<T>) {
    this._data = data;
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
   * Renders this component
   */
  render() {
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

    // Data for current page
    output.cursorTo(0, output.contentStartRow);
    const reduceColsToString = (accumulator, colData, index): string => {
      const column = this._columns[index];
      const colText = rightPad(colData, column.width);
      return `${accumulator || ''}${colText} `;
    };
    this._data
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
   * Changes the currently displayed data to the previous page
   */
  async pageUp(): Promise<void> {
    if (this._startIndex === 0) {
      this._app.setInfo('Already at start');
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
   * Return the index of the currently selected row
   */
  get selectedRowIndex(): number {
    return this._startIndex + this._selectedPageRow;
  }

  _currentPage(): number {
    return Math.ceil((this._startIndex + 1) / output.contentHeight);
  }

  _numberPages(): number {
    return Math.floor(this._data.length / output.contentHeight) + 1;
  }

  _isLastPage(): boolean {
    return this._currentPage() >= this._numberPages();
  }

  /**
   * Changes the currently displayed data to the next page
   */
  async pageDown(): Promise<void> {
    if ((this._startIndex + output.contentHeight) > this._data.length) {
      this._app.setInfo('No more pages');
      return;
    }
    this._startIndex += output.contentHeight;
    this._selectedPageRow = 0;
    if (this._startIndex >= (this._data.length)) {
      this._startIndex = this._data.length - 1;
    }
    if (this._onSelect) {
      await this._onSelect();
    }
  }

  /**
   * Selects the previous record (pages up if necessary)
   */
  async selectPrevious(): Promise<void> {
    if (this._selectedPageRow === 0) {
      await this.pageUp();
    } else {
      this._selectedPageRow--;
    }
    if (this._onSelect) {
      await this._onSelect();
    }
  }

  /**
   * Selects the next record (pages down if necessary)
   */
  async selectNext(): Promise<void> {
    const isLastPage = this._isLastPage();
    const lastPageRowIndex = (this._data.length % output.contentHeight) - 1;
    if (!isLastPage && this._selectedPageRow >= output.contentHeight - 1) {
      await this.pageDown();
    } else if (isLastPage && this._selectedPageRow < lastPageRowIndex) {
      this._selectedPageRow++;
    } else if (!isLastPage) {
      this._selectedPageRow++;
    } else {
      this._app.setInfo('No more records');
    }
    if (this._onSelect) {
      await this._onSelect();
    }
  }

  /**
   * Handle user input
   */
  async handle(key: string): Promise<void> {
    switch (key) {
      case KEY_ENTER:
        if (this._onEnter) {
          await this._onEnter(this.selectedRowIndex);
        }
        break;
      case KEY_DOWN:
        if (this._rowSelection) {
          await this.selectNext();
        } else {
          await this.pageDown();
        }
        break;
      case KEY_UP:
        if (this._rowSelection) {
          await this.selectPrevious();
        } else {
          await this.pageUp();
        }
        break;
      case KEY_PAGE_DOWN:
        await this.pageDown();
        break;
      case KEY_PAGE_UP:
        await this.pageUp();
        break;
      default:
        // Don't handle here
    }
  }
}
