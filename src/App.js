// @flow

import colors from 'colors';
import cliui from 'cliui';
import { isInteger } from 'stringfu';

import output from './output';
import ViewBase from './ViewBase';
import Tab from './Tab';

declare var process: any;

const TABS_PREFIX = 'Tab';
const MAX_TABS = 3;

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

  get activeTab(): Tab {
    return this._tabs[this._activeTabIndex];
  }

  set stateMessage(stateMessage: string) {
    this.activeTab._stateMessage = stateMessage;
  }

  get stateMessage(): string {
    return this.activeTab.stateMessage;
  }

  get activeView(): ViewBase {
    return this.activeTab.activeView;
  }

  get viewDepth() {
    return this.activeTab.viewDepth;
  }

  get status() {
    return this.activeTab.status;
  }

  setError(message: string) {
    this.activeTab.setError(message);
  }

  setInfo(message: string) {
    this.activeTab.setInfo(message);
  }

  setWarning(message: string) {
    this.activeTab.setWarning(message);
  }

  render() {
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


  async handle(key: string) {
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

  pushView(component: ViewBase) {
    this.activeTab.pushView(component);
  }

  popView() {
    this.activeTab.popView();
  }

  replaceView(component: ViewBase) {
    this.activeTab.replaceView(component);
  }

  quit() {
    output.clear();
    console.log('Bye!');
    process.exit(0);
  }
}
