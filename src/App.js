// @flow

import cliui from 'cliui';
import output from './output';
import ViewBase from './ViewBase';
import Tab from './Tab';

declare var process: any;

export default class App {
  _title: string
  _tabs: Tab[]
  _activeTabIndex: number
  _initialView: ViewBase

  constructor(title: string) {
    this._title = title;
    this._tabs = [new Tab()];
    this._activeTabIndex = 0;
  }

  get activeTab(): Tab {
    return this._tabs[this._activeTabIndex];
  }

  set state(state: string) {
    this.activeTab._state = state;
  }

  get state(): string {
    return this.activeTab.state;
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
    await this.activeTab.handle(key);
  }

  _renderTitle() {
    output.cursorTo(0, 0);
    const ui = cliui();
    ui.div({
      text: this.activeTab.activeView.title,
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
