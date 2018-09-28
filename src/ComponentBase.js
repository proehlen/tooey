// @flow
export default class ComponentBase {
  _title: string

  // eslint-disable-next-line no-unused-vars
  render(inactive: boolean) {
    throw new Error('Method is abstract.  Override in subclass.');
  }

  // eslint-disable-next-line no-unused-vars
  async handle(key: string): Promise<void> {
    throw new Error('Method is abstract.  Override in subclass.');
  }
}
