/* eslint-disable no-unused-vars */
// @flow

/**
 * The base class for all renderable and interactive components.
 *
 * There are two methods that must be present in all components:
 * `render` and `handle`.  These methods and the expecteded interface
 * are provided by this base but they must be overriden in child
 * classes.
 */
export default class ComponentBase {
  /**
   * Synchronous function to render the component.
   * @abstract
   *
   * The inactive parameter is to be used where a component is to
   * be rendered but is not accepting input and while inactive
   * has a different visual appearance.  For example, a menu
   * that is inactive while a user's input is being directed to
   * an input field may not have bolded short cut keys.
   */
  render(inactive: boolean) {
    throw new Error('Method is abstract.  Override in subclass.');
  }


  /**
   * Asynchronous function to handle user input
   * @abstract
   *
   * Returns promise that resolves to boolean where true
   * means this component handled the input and no other
   * component should respond to it.
   */
  async handle(key: string): Promise<boolean> {
    throw new Error('Method is abstract.  Override in subclass.');
  }
}
