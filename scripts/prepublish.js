/**
 * The purpose of this script is to prevent publishing to npm directly
 * via `npm publish`.  We want our custom publish script to be used
 * instead.
 *
 * To make this script activate, it needs to be included as the
 * `prepublishOnly` script in the package.json file
 */
const RELEASE_MODE = !!(process.env.RELEASE_MODE);

if (!RELEASE_MODE) {
  console.log('Run `npm run release` to publish the package');
  process.exit(1); // Terminates the publish process
}
