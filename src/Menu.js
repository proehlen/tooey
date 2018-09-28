// @flow

import colors from 'colors';
import cliui from 'cliui';

import App from './App';
import ComponentBase from './ComponentBase';
import MenuOption from './MenuOption';
import output from './output';
import {
  KEY_ENTER, KEY_ESCAPE, KEY_LEFT, KEY_RIGHT, KEY_TAB, KEY_SHIFT_TAB,
} from './keys';


const OPTION_GAP = 3; // Render gap between options

type Direction = -1 | 1
type NoMoreOptionsCallback = (Direction) => Promise<void>

export default class Menu extends ComponentBase {
  _app: App
  _options: MenuOption[]
  _selectedIndex: number
  _hasBack: boolean
  _onNoMoreOptions: NoMoreOptionsCallback

  constructor(
    app: App,
    options?: MenuOption[] = [],
    allowBackOption: boolean = true,
    onNoMoreOptions?: NoMoreOptionsCallback,
  ) {
    super();

    this._app = app;
    this._options = [];
    if (onNoMoreOptions) {
      this._onNoMoreOptions = onNoMoreOptions;
    }

    // Every menu has to allow for quitting
    this.addOption(new MenuOption('Q', 'Quit', 'Exit the program'));

    // Most menus have (B)ack option
    if (allowBackOption) {
      this.addOption(new MenuOption('B', 'Back', 'Go back to previous menu'), 'start');
      this._hasBack = true;
    } else {
      this._hasBack = false;
    }

    // Add options specific to this menu
    options.reverse().forEach(option => this.addOption(option, 'start'));

    // Set active/default  action
    this.selectedIndex = 0;
  }

  render(inactive: boolean) {
    // Build options text
    output.cursorTo(0, output.menuRow);
    const ui = cliui();
    const text = this._options.reduce((acc, option, index) => {
      const separator = index > 0 ? ` ${String.fromCharCode(183)} ` : '';
      const preKeyText = (option.keyPosition) ? option.label.substring(0, option.keyPosition) : '';
      const postKeyText = option.label.substr(option.keyPosition + 1);
      const keyText = !inactive
        ? colors.bold(option.key)
        : option.key;
      return `${acc}${separator}${preKeyText}${keyText}${postKeyText}`;
    }, '');
    ui.div(text);

    console.log(ui.toString());
    if (!inactive) {
      this._cursorToselectedOption();
    }
  }

  addOption(option: MenuOption, position: 'start' | 'end' = 'end') {
    if (this._options.findIndex(existing => existing.key === option.key) > -1) {
      throw new Error(`Cannot create menu with duplicate key '${option.key}'`);
    }

    if (position === 'start') {
      this._options.unshift(option);
    } else {
      const insertAt = this._hasBack
        ? this._options.length - 2 // before Back
        : this._options.length - 1; // before Quit
      this._options.splice(insertAt, 0, option);
    }
  }

  setSelectedOption(key: string) {
    const index = this._options.findIndex(option => option.key === key);
    if (index < 0) {
      throw new Error(`Cannot set selected menu option; missing key '${key}'`);
    }
    this.selectedIndex = index;
  }

  setFirstOptionSelected() {
    this.selectedIndex = 0;
  }

  setLastOptionSelected() {
    this.selectedIndex = this._options.length - 1;
  }

  get selectedIndex() { return this._selectedIndex; }
  get selectedOption() { return this._options[this._selectedIndex]; }
  get options() { return this._options; }

  set selectedIndex(index: number) {
    this._selectedIndex = index;
    if (this.selectedOption) {
      this._app.setInfo(this.selectedOption.help);
    }
  }

  async cycleSelectedOption(direction: 1 | -1) {
    this.selectedIndex += direction;

    if (this.selectedIndex < 0) {
      if (this._onNoMoreOptions) {
        await this._onNoMoreOptions(direction);
      } else {
        this.selectedIndex = this._options.length - 1;
      }
    } else if (this.selectedIndex >= this._options.length) {
      if (this._onNoMoreOptions) {
        await this._onNoMoreOptions(direction);
      } else {
        this.selectedIndex = 0;
      }
    }
  }

  _cursorToselectedOption() {
    let x = 0;
    for (let i = 0; i < this.selectedIndex; i++) {
      const option = this._options[i];
      x += (option.label.length + OPTION_GAP);
    }
    output.cursorTo(x + this.selectedOption.keyPosition, 1);
  }


  async handle(key: string): Promise<void> {
    if (key === KEY_ENTER) {
      // Call back this method (maybe in child class) with key
      // for active option
      await this.handle(this.selectedOption.key);
    } else {
      switch (key.toUpperCase()) {
        case KEY_ESCAPE:
          if (this._app.viewDepth) {
            this._app.popView();
          } else {
            this._app.quit();
          }
          break;
        case KEY_LEFT:
        case KEY_SHIFT_TAB:
          await this.cycleSelectedOption(-1);
          break;
        case KEY_RIGHT:
        case KEY_TAB:
          await this.cycleSelectedOption(1);
          break;
        case 'B':
          // Back
          if (this._app.viewDepth) {
            this._app.popView();
          }
          break;
        case 'Q':
          // Quit
          this._app.quit();
          break;
        default: {
          const option = this._options.find(candidate => candidate.key === key.toUpperCase());
          if (option) {
            if (option.execute) {
              await option.execute();
            } else {
              // Valid option
              this._app.setWarning(`Sorry, the '${option.label}' feature is not implemented yet`);
            }
          }
          break;
        }
      }
    }
  }
}
