// @flow

import Tab from '../Tab';
import ComponentBase from './ComponentBase';
import output from '../output';

import {
  KEY_DOWN, KEY_UP, KEY_PAGE_DOWN, KEY_PAGE_UP,
} from '../keys';

/**
 * A component for displaying multi-line text with paging
 */
export default class Text extends ComponentBase {
  _tab: Tab
  _text: string
  _page: number

  constructor(
    tab: Tab,
    text: string,
  ) {
    super();
    this._tab = tab;
    this._text = text;
    this._page = 1;
  }

  /**
   * Renders the text for the current page
   */
  render() {
    // Render text for current page
    const startAt = (this._page - 1) * this._numCharsPage;
    const pageText = this._text.substr(startAt, this._numCharsPage);
    output.cursorTo(0, output.contentStartRow);
    console.log(pageText);
  }

  async _pageUp() {
    if (this._page === 1) {
      this._tab.setInfo('Already at start');
      return;
    }
    this._page--;
  }

  get _numCharsPage() {
    return output.width * output.contentHeight;
  }

  get _pageCount() {
    return Math.ceil(this._text.length / this._numCharsPage);
  }

  async _pageDown() {
    if (this._page >= this._pageCount) {
      this._tab.setInfo('No more pages');
      return;
    }
    this._page++;
  }

  /**
   * Handles input for the {@link Text}
   *
   * Note: the text itself is read-only and the only input we handle is for paging up
   * and down.
   */
  async handle(key: string): Promise<boolean> {
    let handled = false;
    switch (key) {
      case KEY_DOWN:
      case KEY_PAGE_DOWN:
        await this._pageDown();
        handled = true;
        break;
      case KEY_UP:
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
