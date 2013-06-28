# Back-end

This is the backend server of Monsignor.

## CouchDB wrapper

`couch-wrapper.js`, provides a database abstraction layer.

All function calls return promises. If an error is thrown by CouchDB: the promise is rejected and the message is stored in the `error.message` property. Sample code :
```
signup({
    login: 'foo',
    password: 'bar'
}).then(
    function(data) { // Success
        console.log(data)
    },
    function(err) { // Error
        console.log(err);
        console.log(err.message); // JSON message thrown by CouchDB
    }
)
```

### User management

User format:
```
{
    login: 'foo',
    password: 'bar',
    subscriptions: [list of subscriptions]
}
```

Available functions:
- `signup({login:'foo', password:'bar'})`, where the password is plaintext (will be hashed by the function)
- `signin({login:'foo', password:'bar'})`, where the password is plaintext (will be hashed by the function)
- `getUser({login: 'foo'}) will return a user's informations (minus the password field)

### Subscriptions management

Subscription format:
```
{
    title,
    description,
    link, // Link to website
    xmlUrl // RSS URL
}
```

Available functions:
- `addSubscription({login}, {title, description, link, xmlUrl})`

## REST API

`server.js` provides the REST API, exposed by the back-end.
This API is JSON-friendly : this means that all request bodies should be encoded as json and `Content-Type` header set to `application/json`.

### CORS

It supports cross origin resource sharing as documented [here](http://www.w3.org/TR/cors/).

### User management

#### Sign-up

    POST /users/signup

##### Input

 * login
  * *Required* **string**
 * password
  * *Required* **string**

##### Response

Status: 201 Created

#### Sign-in

    POST /users/signin

##### Input

 * login
  * *Required* **string**
 * password
  * *Required* **string**

##### Response

```json
{
  "login": "kikoo",
  "subscriptions": [
    {
      "title": "LinuxFr.org : les journaux",
      "description": null,
      "link": "http://linuxfr.org/journaux",
      "xmlUrl": "http://linuxfr.org/journaux.atom"
    }
  ]
}
```

Status: 200 OK
Set-Cookie: token=*your_secret_token*

#### Get authenticated user

    GET /user

##### Response

```json
{
  "login": "kikoo",
  "subscriptions": [
    {
      "title": "LinuxFr.org : les journaux",
      "description": null,
      "link": "http://linuxfr.org/journaux",
      "xmlUrl": "http://linuxfr.org/journaux.atom"
    }
  ]
}
```

Status: 200 OK

#### Get authenticated user's subscriptions

    GET /user/feeds

##### Response

```json
[
  {
    "title": "LinuxFr.org : les journaux",
    "description": null,
    "link": "http://linuxfr.org/journaux",
    "xmlUrl": "http://linuxfr.org/journaux.atom"
  }
]
```

Status: 200 OK

#### Get subscription stories

    POST /feeds/:feed_url

##### Parameter

 * feed_url
  * *Required* **string**

##### Response

```json
[
        {
        "title": "Test de la Manjaro Linux",
        "description": "*some html document*",
        "link": "http://linuxfr.org/users/eqfm/journaux/test-de-la-manjaro-linux",
        "pubdate": "2013-06-26T13:48:58.000Z",
        "guid": "tag:linuxfr.org,2005:Diary/34047"
    }
]
```

Status: 200 OK

#### Subscribe to a feed

    PUT /user/feeds/:feed_url

##### Parameter

 * feed_url
  * *Required* **string**

##### Response

Status: 204 No Content
