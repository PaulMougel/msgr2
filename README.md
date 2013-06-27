# msgr2

Monsignor, reborn.

## Requirements

- CouchDB >1.3
- NodeJS & npm

## Installation

### Web-app

- Install dependencies: `$ cd src/front && npm install && bower install`
- Launch the application: `$ grunt server`
- Launch tests: `$ grunt test`
- Build the application: `$ grunt build `. The resulting application will be stored in `dist/` and is ready to be deployed.

### Back-end

- Install dependecies: `$ cd src/back && npm install`
- Launch the back-end: `$ node server.js`

## Configuration

- CouchDB needs to be configured to allow CORS. The minimal setup requires this to be added the end of your `local.ini` file (blank lines matter!)
  ```
  
  [httpd]
  enable_cors = true

  [cors]
  origins = *
  credentials = true

  ```

  On Mac, the `local.ini` file is located at `~/Library/Application Support/CouchDB/etc/couchdb/local.ini`, on Linux systems at `/usr/local/etc/couchdb/local.ini`.

  For further documentation on CouchDB CORS configuration, see [here](http://docs.couchdb.org/en/latest/cors.html
).