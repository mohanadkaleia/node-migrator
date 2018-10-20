require('dotenv').config({silent: true});

module.exports = {
  port: process.env.PORT || 3000,
  env: process.env.ENV || 'development',

  // Environment-dependent settings
  development: {
    db: {
      host: 'localhost',
      username: 'root',
      password: '123456',
      database_name: 'tcms'
    }
  },
  production: {
    db: {
      host: 'localhost',
      username: 'root',
      password: '',
      database_name: 'tcms'
    }
  }
};
