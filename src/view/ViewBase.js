// @flow
import ComponentBase from '../component/ComponentBase';

/**
 * The base view component from which all views should derive
 *
 * A view is a component that is intended to render as the full content
 * of the app (current or only tab).  It is roughly analagous to a page.  The
 * view's `title` is rendered at the top of the console by the {@link Tab}.
 */
export default class ViewBase extends ComponentBase {
  _title: string

  constructor(title: string) {
    super();
    this._title = title;
  }

  /**
   * The {@link ViewBase view}'s title.
   */
  get title(): string {
    return this._title;
  }
}
