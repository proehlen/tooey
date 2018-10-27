// @flow

import colors from 'colors';
import cliui from 'cliui';

import output from './output';
import App from './App';
import ViewBase from './view/ViewBase';

declare var process: any;

/**
 * Valid types of {@link TabStatus}
 */
type TabStatusType = 'error' | 'warning' | 'info' | 'none';

/**
 * A status for a {@link Tab}
 *
 * The status message is rendered in the status bar with a
 * color that is dependent on {@link TabStatusType}
 */
type TabStatus = {
  type: TabStatusType,
  message: string,
}

/**
 * The tab is the main viewport through which all views are rendered.
 *
 * Every App has at least one tab open even if it is not obvious to the user
 * that it is a tab. Each tab maintains its own view stack where the top most
 * view is the active view that is rendered and receives input. As new
 * views are pushed on to the view stack, the previously active view becomes
 * dormant until later views are popped off the stack again.  The user
 * experiences this as navigating forward (push) and backward (pop).
 *
 * The status bar is also a Tab construct meaning messages set on one
 * tab are not active on other tabs.
 */
export default class Tab {
  _stateMessage: string
  _views: Array<ViewBase>
  _status: TabStatus
  _app: App

  constructor(app: App) {
    this._views = [];
    this._status = {
      type: 'info',
      message: 'Welcome',
    };
    this._app = app;
  }

  /**
   * Quits the app by calling `quit` on the app instance
   *
   * This method is provided as a convenience for components
   * that have a reference to the tab but not the app instance.
   */
  quit(): void {
    // Quit the app
    this._app.quit();
  }

  /**
   * The text that appears at the right of the Status Bar
   */
  get stateMessage(): string {
    return this._stateMessage
      ? this._stateMessage
      : '';
  }

  set stateMessage(stateMessage: string): void {
    this._stateMessage = stateMessage;
  }

  /**
   * The currently active view
   */
  get activeView(): ViewBase {
    return this._views[this._views.length - 1];
  }

  /**
   * The depth of the currently active view in the view stack
   */
  get viewDepth(): number {
    return this._views.length - 1;
  }

  /**
   * The current status.
   *
   * The status gets reset at the start of each handle->render cyle.
   */
  get status(): TabStatus {
    return this._status;
  }

  /**
   * Set the status with an error message
   */
  setError(message: string): void {
    this._status = {
      type: 'error',
      message,
    };
  }

  /**
   * Set the status with an information message
   */
  setInfo(message: string): void {
    // Don't overrride higher severity message
    if (!this._status || (this.status.type !== 'error' && this.status.type !== 'warning')) {
      this._status = {
        type: 'info',
        message,
      };
    }
  }

  /**
   * Set the status with a warning message
   */
  setWarning(message: string): void {
    // Don't overrride higher severity message
    if (!this._status || this.status.type !== 'error') {
      this._status = {
        type: 'warning',
        message,
      };
    }
  }

  /**
   * Render the current tab contents
   */
  render(): void {
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

  /**
   * Handle input to this tab
   */
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

  /**
   * Push a new view to the view stack making it the active view
   */
  pushView(component: ViewBase): void {
    this._views.push(component);
  }

  /**
   * Pop the active view off the view stack
   */
  popView(): void {
    this._views.pop();
  }

  /**
   * Replace the active view with another view
   *
   * This is equivalent to a `popView` followed by a `pushView`
   */
  replaceView(component: ViewBase): void {
    this._views.pop();
    this._views.push(component);
  }
}
