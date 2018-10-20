'use strict';
const mysql = require('mysql');
const Settings = require('./settings');
const csv = require('csvtojson');
const moment = require('moment');
const winston = require('winston');
const escape_quotes = require('escape-quotes');

const dbSettings = Settings[Settings.env].db;
const csvFilePath ='./data/Site_Update_12_14_2016.csv';

// Create log file
winston.add(winston.transports.File, { filename: 'log.txt' });

var connection = mysql.createConnection({
  host     : dbSettings.host,
  user     : dbSettings.username,
  password : dbSettings.password,
  database : dbSettings.database_name
});

// Read the csv file
csv()
.fromFile(csvFilePath)
.on('json',(row, row_index)=>{
    insertUpdate(row);
})
.on('done',(error)=>{
    console.log('Scanning is finished!')
});




connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  console.log('Connected successfully to the database');
});

var insertUpdate = function(row) {
  // 1. Check if the row is already exist in the database, then update it,
  var name = row.SITE_NUMBER;
  var county = row.COUNTY
  var select_query = `SELECT * FROM site WHERE name = ${name} AND county = ${county}`;
  connection.query(select_query, function (error, results, fields) {
    if (error) throw error;

    if (results.length > 0) {
      // We need to update the site here
      updateSite(row, (result) => {
        if (result) {
          winston.info((new Date()) + `Site: ${row.SITE_ID} is already exist in the database. site updated!`);
        }
      });
    } else {
      // We need to insert new site here
      insertSite(row, (result) => {
        if (result) {
          winston.info((new Date()) + `Site: ${row.SITE_ID} has been created`);
        }
      });
    }
  });
  // 2. If it does not exist then just insert the new row into the table
}

var insertSite = function(row, callback) {
  var query = `INSERT INTO site
  (name, SITE_ID, FIPS, county, latitude, longitude, address, number, type, count_cycle, route)
  VALUES
  ('${row.SITE_NUMBER}', ${row.SITE_ID}, '40', '${row.COUNTY}', '${row.LATITUDE}', '${row.LONGITUDE}', '${escape_quotes(row.LOCATION, "'", "\\")}', ${row.SITE_NUMBER}, ${row.SITE_TYPE}, ${row.COUNT_CYCLE}, '${row.ROUTE}')`;

  connection.query(query, function (error, results, fields) {
    if (error) {
      console.log(query);
      throw error;
    }
    callback(true);
  });
}

var updateSite = function(row, callback) {
  var query = `UPDATE site SET
  name = '${row.SITE_NUMBER}',
  SITE_ID = ${row.SITE_ID},
  county = '${row.COUNTY}',
  latitude = '${row.LATITUDE}',
  longitude = '${row.LONGITUDE}',
  address = '${escape_quotes(row.LOCATION, "'", "\\")}',
  number = ${row.SITE_NUMBER},
  type = ${row.SITE_TYPE},
  count_cycle = ${row.COUNT_CYCLE},
  route = '${row.ROUTE}',
  created_date = '${moment().format('YYYY-MM-DD HH:mm:ss')}'
  WHERE
  name = '${row.SITE_NUMBER}' AND
  county = '${row.COUNTY}'
  `;
  // console.log(query);
  connection.query(query, function (error, results, fields) {
    if (error) {
      console.log(query);
      throw error;
    }
    // console.log('Number of affected rows:' + results.affectedRows + ' rows');
    callback(true);
  });
}
