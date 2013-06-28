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
    password: 'bar'
}
```

Available functions:
- `signup({login:'foo', password:'bar'})`, where the password is plaintext (will be hashed by the function)
- `signin({login:'foo', password:'bar'})`, where the password is plaintext (will be hashed by the function). If the signin is successful, returns a user object (without the password field).

### Subscriptions management

Subscription format:
```
{
    _id,
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

### Input

 * login
  * *Required* **string**
 * password
  * *Required* **string**

### Response

Status: 201 Created

#### Sign-in

    POST /users/signin

### Input

 * login
  * *Required* **string**
 * password
  * *Required* **string**

### Response

Status: 200 OK
