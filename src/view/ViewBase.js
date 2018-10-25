// @flow
import ComponentBase from '../component/ComponentBase';

export default class ViewBase extends ComponentBase {
  _title: string

  constructor(title: string) {
    super();
    this._title = title;
  }

  get title() {
    return this._title;
  }
}
