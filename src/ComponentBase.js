// @flow
export default class ComponentBase {
  _title: string

  // eslint-disable-next-line no-unused-vars
  render(inactive: boolean) {
    throw new Error('Method is abstract.  Override in subclass.');
  }


  /**
   * Async function to handle user input
   *
   * Returns promise that resolves to boolean where true
   * means this component handled the input and no other
   * component should respond to it.
   */
  // eslint-disable-next-line no-unused-vars
  async handle(key: string): Promise<boolean> {
    throw new Error('Method is abstract.  Override in subclass.');
  }
}
