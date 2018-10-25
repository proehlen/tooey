// @flow

import colors from 'colors';
import cliui from 'cliui';

import output from './output';
import App from './App';
import ViewBase from './view/ViewBase';

declare var process: any;

type StatusType = 'error' | 'warning' | 'info' | 'none';

type Status = {
  type: StatusType,
  message: string,
}

export default class Tab {
  _stateMessage: string
  _views: Array<ViewBase>
  _status: Status
  _app: App

  constructor(app: App) {
    this._views = [];
    this._status = {
      type: 'info',
      message: 'Welcome',
    };
    this._app = app;
  }

  quit() {
    this._app.quit();
  }

  set stateMessage(stateMessage: string) {
    this._stateMessage = stateMessage;
  }

  get stateMessage(): string {
    return this._stateMessage
      ? this._stateMessage
      : '';
  }

  get activeView(): ViewBase {
    return this._views[this._views.length - 1];
  }

  get viewDepth() {
    return this._views.length - 1;
  }

  get status() {
    return this._status;
  }

  setError(message: string) {
    this._status = {
      type: 'error',
      message,
    };
  }

  setInfo(message: string) {
    // Don't overrride higher severity message
    if (!this._status || (this.status.type !== 'error' && this.status.type !== 'warning')) {
      this._status = {
        type: 'info',
        message,
      };
    }
  }

  setWarning(message: string) {
    // Don't overrride higher severity message
    if (!this._status || this.status.type !== 'error') {
      this._status = {
        type: 'warning',
        message,
      };
    }
  }

  render() {
    this._renderStatus();
    output.cursorTo(0, output.contentStartRow);
    this.activeView.render(false);
  }

  _clearStatus() {
    this._status = {
      type: 'none',
      message: '',
    };
  }

  async handle(key: string): Promise<boolean> {
    this._clearStatus();
    return this.activeView.handle(key);
  }

  _renderStatus() {
    let bgColor;
    let fgColor;
    switch (this._status.type) {
      case 'error':
        bgColor = 'bgRed';
        fgColor = 'yellow';
        break;
      case 'warning':
        bgColor = 'bgYellow';
        fgColor = 'black';
        break;
      case 'info':
        bgColor = 'bgBlue';
        fgColor = 'white';
        break;
      default:
        bgColor = 'white';
        fgColor = 'black';
    }
    output.cursorTo(0, output.height - 2);
    const ui = cliui({ wrap: false });

    const stateMessageWidth = this.stateMessage.length;
    const messageWidth = output.width - stateMessageWidth;
    const message = this.status.message.substr(0, messageWidth);
    ui.div({
      text: colors[bgColor][fgColor](message),
      width: messageWidth,
    }, {
      text: this.stateMessage,
      width: stateMessageWidth,
    });
    console.log(ui.toString());
  }

  pushView(component: ViewBase) {
    this._views.push(component);
  }

  popView() {
    this._views.pop();
  }

  replaceView(component: ViewBase) {
    this._views.pop();
    this._views.push(component);
  }
}
