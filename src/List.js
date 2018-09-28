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

export type ListColumn = {
  heading: string,
  width: number,
}

export default class List extends ComponentBase {
  _app: App
  _startIndex: number
  _data: Array<Array<string>>
  _columns: Array<ListColumn>
  _showHeadings: boolean
  _rowSelection: boolean
  _onEnter: (number) => Promise<void>
  _onSelect: () => Promise<void>
  _selectedPageRow: number

  constructor(
    app: App,
    columns: Array<ListColumn>,
    data: Array<Array<string>>,
    showHeadings: boolean = true,
    menu?: Menu,
    rowSelection: boolean = false,
    onSelect?: () => Promise<void>,
    onEnter?: (number) => Promise<void>,
  ) {
    super();
    this._app = app;
    this._columns = columns;
    this.setData(data);
    this._showHeadings = showHeadings;
    this._rowSelection = rowSelection;
    if (onEnter) {
      this._onEnter = onEnter;
    }
    if (onSelect) {
      if (!rowSelection) {
        throw new Error('onSelect callback is incompatible with rowSelection === false');
      }
      this._onSelect = onSelect;
    }
    if (menu) {
      // Add paging to menu
      menu.addOption(new MenuOption('D', 'Page Down', 'Go to next page', this.pageDown.bind(this)));
      menu.addOption(new MenuOption('U', 'Page Up', 'Return to previous page', this.pageUp.bind(this)));
    }
  }

  setData(data: Array<Array<string>>) {
    this._data = data;
    this._startIndex = 0;
    this._selectedPageRow = 0;
  }

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

  async pageUp() {
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

  get selectedRowIndex() {
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

  async pageDown() {
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

  async selectPrevious() {
    if (this._selectedPageRow === 0) {
      await this.pageUp();
    } else {
      this._selectedPageRow--;
    }
    if (this._onSelect) {
      await this._onSelect();
    }
  }

  async selectNext() {
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

  async handle(key: string) {
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
