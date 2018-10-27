module.exports = {
  parser: 'babel-eslint',
  extends: [
    'airbnb-base',
    'plugin:flowtype/recommended',
  ],
  plugins: [
    'import',
    'flowtype',
  ],
  env: {
    node: true,
  },
  rules: {
    // Lines between class members doesn't work well with flow declarations
    'lines-between-class-members': 'off',
    
    'no-underscore-dangle': 'off', // We use "private" class members
    'no-plusplus': 'off', // Life is too short; learn the problem this rule is designed to circumvent
    'class-methods-use-this': 'off', // Allow "abstract" methods
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'no-console': 'off', // whole purpose of lib is writing to console
    'prefer-destructuring': 'off', // I prefer it too but airbnb is broken and often gives other errors when its used ("unsupported destructuring pattern")
  }
};