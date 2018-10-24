// @flow

export default class MenuItem {
  _label: string
  _key: string
  _keyPosition: number
  _help: string
  _execute: ?() => Promise<void>
  _checkVisible: ?() => boolean

  constructor(
    key: string,
    label: string,
    help: string,
    execute?: () => Promise<void>,
    checkVisible?: () => boolean,
  ) {
    this._key = key;
    this._label = label;
    this._help = help;
    this._keyPosition = this._label.indexOf(this._key);
    if (this._keyPosition < 0) {
      throw new Error('Key not found in menu option label text.');
    }
    this._execute = execute;
    this._checkVisible = checkVisible;
  }


  // Simple getters
  get execute() { return this._execute; }
  get checkVisible() { return this._checkVisible; }
  get key() { return this._key; }
  get keyPosition() { return this._keyPosition; }
  get label() { return this._label; }
  get help() { return this._help; }
}
