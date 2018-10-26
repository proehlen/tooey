// @flow

import cliui from 'cliui';
import colors from 'colors';
import output from '../output';
import ViewBase from './ViewBase';
import Input from '../component/Input';
import { KEY_UP, KEY_DOWN } from '../keys';
import Tab from '../Tab';

export type InputViewOptions = {
  instructions?: string
}

/**
 * The title for the {@link InputView}
 */
type InputViewTitle = string;

/**
 * An single historical input for a {@link InputView}
 */
type InputViewHistory = string[];

/**
 * A map of all history for all {@link InputView} instances.
 *
 * Map is keyed by title of the InputView so use unique titles if you
 * which history to be different for different instances.
 */
type InputViewAllHistory = Map<InputViewTitle, InputViewHistory>;

const allHistory: InputViewAllHistory = new Map();

/**
 * View comprising of a single input field and help text in place of menu with
 * optional instructions below the input field
 *
 * This view is useful where:
 * * Only a single input value is required (ie not a form), and
 * * the input can potentially be very large wrapping over multiple lines
 *
 * This view also provides input history that can be navigated by the up/down arrows.
 */
export default class InputView extends ViewBase {
  _tab: Tab
  _title: InputViewTitle
  _onEnter: (string) => Promise<void>
  _historyLevel: number
  _input: Input
  _options: InputViewOptions

  constructor(
    tab: Tab,
    title: InputViewTitle,
    onEnter: (string) => Promise<void>,
    options: InputViewOptions = {},
  ) {
    super(title);
    this._title = title;
    this._tab = tab;
    this._historyLevel = 0;
    this._input = new Input(tab, this._onInputEnter.bind(this));
    this._options = options;
    this._onEnter = onEnter;
  }

  /**
   * Render the {@link InputView}
   */
  render() {
    // Render instruction text somewhere below the input field but only if no input has been entered
    // since the input may wrap and overwrite this text otherwise
    if (!this._input.value && this._options.instructions) {
      output.cursorTo(0, 5);
      const ui = cliui();
      ui.div({
        text: colors.gray(this._options.instructions),
      });
      console.log(ui.toString());
    }

    // Render input help text where the menu would normally appear in other views
    output.cursorTo(0, output.menuRow);
    console.log(`Press ${colors.bold('Enter')} to accept; ${colors.bold('Esc')} to cancel; ${colors.bold('Up')} and ${colors.bold('Down')} for history`);

    // Render input last for correct cursor positioning
    this._input.render();
  }

  get _history(): InputViewHistory {
    let history = allHistory.get(this._title);
    if (!history) {
      history = [];
    }
    return history;
  }

  set _history(history: InputViewHistory) {
    allHistory.set(this._title, history);
  }

  _addHistory(inputValue: string) {
    const history = this._history;
    const existingIndex = history.indexOf(inputValue);
    if (existingIndex > -1) {
      history.splice(existingIndex, 1);
    }
    history.push(inputValue);
    this._history = history;
  }

  async _onInputEnter(inputValue: string) {
    this._addHistory(inputValue);
    this._historyLevel = 0;
    this._input.value = '';
    await this._onEnter(inputValue);
  }

  _loadEarlier() {
    if (this._historyLevel < this._history.length) {
      this._historyLevel++;
    }
    this._loadFromHistory();
  }

  _loadLater() {
    if (this._historyLevel > 1) {
      this._historyLevel--;
      this._loadFromHistory();
    } else {
      // History exhausted - clear input
      this._input.value = '';
    }
  }

  _loadFromHistory() {
    if (!this._history.length) {
      this._tab.setWarning('No history found');
      return;
    }
    const index = this._history.length - this._historyLevel;
    this._input.value = this._history[index];
  }

  /**
   * Handle input to the {@link InputView}
   */
  async handle(key: string): Promise<boolean> {
    let handled = false;
    switch (key) {
      case KEY_DOWN:
        this._loadLater();
        handled = true;
        break;
      case KEY_UP:
        this._loadEarlier();
        handled = true;
        break;
      default:
        handled = await this._input.handle(key);
    }
    return handled;
  }
}
