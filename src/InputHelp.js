// @flow
import colors from 'colors';
import ComponentBase from './ComponentBase';
import output from './output';

export const DEFAULT_TEXT = `Press ${colors.bold('Enter')} to accept; ${colors.bold('Esc')} to cancel`;

/**
 * Input help for views with Input and no Menu; appears in place of menu bar
 *
 * Note: this component does not / cannot handle key strokes
 */
export default class InputHelp extends ComponentBase {
  _helpText: string

  /**
   * InputHelp constructor
   */
  constructor(helpText: string = DEFAULT_TEXT) {
    super();
    this._helpText = helpText;
  }

  /**
   * Render this component
   */
  render() {
    output.cursorTo(0, output.menuRow);
    console.log(this._helpText);
  }

  /**
   * Handle user input (throws error)
   */
  async handle(key: string): Promise<boolean> {
    throw new Error(`Input help cannot handle input (key: ${key}).`);
  }
}
