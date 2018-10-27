// @flow

import colors from 'colors';
import cliui from 'cliui';
import { isInteger } from 'stringfu';

import output from './output';
import ViewBase from './view/ViewBase';
import Tab from './Tab';

declare var process: any;

const TABS_PREFIX = 'Tab';
const MAX_TABS = 3;

/**
 * The top level container for your Tooey app
 *
 * Each application must have exactly one App instance.  It is responsible
 * for:
 *   * The main / top level render routine and rendering everything that should
 *     be currently visible.
 *   * The main / top level handle routine and handling all user input.
 *   * Specifically, rendering the app bar - the first row in the console, including:
 *       * The current view title,
 *       * the app title,
 *       * all tabs and hot keys for opening / closing tabs
 *   * Managing tabs.
 *
 * When constructing an App instance, it is necessary to provide the app title and
 * the first view that will be rendered (the app will create the first tab to contain
 * that view).
 */
export default class App {
  _title: string
  _tabs: Tab[]
  _activeTabIndex: number
  _initialView: (Tab) => ViewBase

  constructor(title: string, initialView: (Tab) => ViewBase) {
    this._title = title;
    this._initialView = initialView;
    this._tabs = [];
    this._addTab();

    // Render
    this.render();

    // Re-render on window resize
    process.stdout.on('resize', () => {
      output.resize();
      this.render();
    });

    // Handle input and re-render after input
    const { stdin } = process;
    // $flow-disable-line need raw mode; method appears to be available
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    stdin.on('data', async (key) => {
      await this.handle(key);
      this.render();
    });
  }

  _addTab() {
    if (this._tabs.length < MAX_TABS) {
      const tab = new Tab(this);
      tab.pushView(this._initialView(tab));
      this._tabs.push(tab);
      this._activeTabIndex = this._tabs.length - 1;
    }
  }

  _removeTab() {
    if (this._tabs.length > 1) {
      this._tabs.splice(this._activeTabIndex, 1);
      if (this._activeTabIndex > this._tabs.length - 1) {
        this._activeTabIndex--;
      }
    }
  }

  /**
   * Returns the currently active {@link Tab}
   */
  get activeTab(): Tab {
    return this._tabs[this._activeTabIndex];
  }

  /**
   * Render the entire app
   */
  render(): void {
    try {
      output.clear();
      this._renderTitleBar();
      this.activeTab.render();
    } catch (err) {
      // No errors should come up to this high level,
      // Will probably need a coder to sort out
      output.clear();
      console.error(err);
      process.exit(0);
    }
  }


  /**
   * Handle user input for the entire app
   */
  async handle(key: string): Promise<void> {
    try {
      const handled = await this.activeTab.handle(key);
      if (!handled) {
        switch (key) {
          case '-':
            this._removeTab();
            break;
          case '+':
            this._addTab();
            break;
          default:
            if (isInteger(key)) {
              const newIndex = parseInt(key, 10) - 1;
              if (newIndex >= 0 && newIndex < this._tabs.length) {
                this._activeTabIndex = newIndex;
              }
            }
        }
      }
    } catch (err) {
      // No errors should come up to this high level,
      // Will probably need a dev to sort out
      output.clear();
      console.error(err);
      process.exit(0);
    }
  }

  _getSingleTabText() {
    let tabsText = this.activeTab.activeView.title;
    tabsText += ' ';
    tabsText += colors.bold('+');
    return tabsText;
  }

  _getMultiTabsText() {
    let tabsText = `${colors.blue(TABS_PREFIX)}  `;
    for (let i = 0; i < this._tabs.length; i++) {
      const tab = this._tabs[i];
      const active = i === this._activeTabIndex;
      tabsText += '| ';
      const tabNumber = i + 1;
      tabsText += `${colors.bold(tabNumber)}.`;
      let tabTitle = `${tab.activeView.title}`;
      if (active) {
        tabTitle = `${colors.inverse(tabTitle)}`;
      }
      tabsText += tabTitle;
    }
    tabsText += ' |';
    if (this._tabs.length < MAX_TABS) {
      tabsText += ` ${colors.bold('+')}`;
    }
    if (this._tabs.length > 1) {
      tabsText += ` ${colors.bold('-')}`;
    }

    return tabsText;
  }

  _renderTitleBar() {
    output.cursorTo(0, 0);
    const tabsText = this._tabs.length > 1
      ? this._getMultiTabsText()
      : this._getSingleTabText();
    const ui = cliui();
    ui.div({
      text: tabsText,
      align: 'left',
      width: output.width - this._title.length,
    }, {
      text: this._title,
      align: 'right',
      width: this._title.length,
    });
    console.log(ui.toString());
  }

  /**
   * Quit the entire app
   */
  quit(): void {
    output.clear();
    console.log('Bye!');
    process.exit(0);
  }
}
