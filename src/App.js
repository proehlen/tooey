// @flow

// import colors from 'colors';
import cliui from 'cliui';
import output from './output';
import ViewBase from './ViewBase';
import Tab from './Tab';

declare var process: any;

export default class App {
  _title: string
  _tabs: Tab[]
  _activeTabIndex: number
  _initialView: (Tab) => ViewBase

  constructor(title: string, initialView: (Tab) => ViewBase) {
    this._title = title;
    this._initialView = initialView;
    this._tabs = [];
    this.addTab();
  }

  addTab() {
    const tab = new Tab(this);
    tab.pushView(this._initialView(tab));
    this._tabs = [tab];
    this._activeTabIndex = this._tabs.length - 1;
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
      this._renderTitle();
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
    const handled = await this.activeTab.handle(key);
    if (!handled) {
      switch (key) {
        case '+': {
          this.addTab();
          break;
        }
        default:
          // Not handled
      }
    }
  }

  _renderTitle() {
    output.cursorTo(0, 0);
    const ui = cliui();
    let tabs = '';
    for (let i = 0; i < this._tabs.length; i++) {
      const tab = this._tabs[i];
      // const active = i === this._activeTabIndex;
      tabs += ` ${tab.activeView.title} |`;
    }
    tabs += ' +';
    ui.div({
      text: tabs,
      align: 'left',
    }, {
      text: this._title,
      align: 'right',
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
