/**
 * Copies the README and a 'clean' version of the package.json file from the project root
 * folder to the lib folder (from where our package is published).
 *
 * It removes any build steps etc since our lib folder is already the built product.
 */

const fs = require('fs');
const path = require('path');

// Copy cleaned package json
let srcFile = path.join(__dirname, '../', 'package.json');
let targetFile = path.join(__dirname, '../', 'lib', 'package.json');
console.log('Copying package file cleaned for distribution from', srcFile, 'to', targetFile);
const rawPackageFile = fs.readFileSync(srcFile, { encoding: 'utf8' });
const packageJson = JSON.parse(rawPackageFile);
delete packageJson.scripts;
delete packageJson.devDependencies;
fs.writeFileSync(targetFile, JSON.stringify(packageJson), { encoding: 'utf8' });

// Copy README
srcFile = path.join(__dirname, '../', 'README.md');
targetFile = path.join(__dirname, '../', 'lib', 'README.md');
console.log('Copying README from', srcFile, 'to', targetFile);
fs.copyFileSync(srcFile, targetFile);
