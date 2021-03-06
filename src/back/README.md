# Back-end

This is the backend server of Monsignor.

## CouchDB wrapper

`couch-wrapper.js`, provides a database abstraction layer.

All function calls return promises. If an error is thrown by CouchDB: the promise is rejected and the message is stored in the `error.message` property. Sample code :
```javascript
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
```json
{
    "login": "foo",
    "password": "bar",
    "subscriptions": []
}
```

Readstate format:
```json
{
    "login": "foo", // user login
    "feed": "bar", // feed xmlUrl
    "article": { "guid", "pubdate", "title" },
    "read": true // has the user read this article or not?
}
```

Available functions:
- `signup({login, password})`, where the password is plaintext (will be hashed by the function). Resolves to a user object.
- `signin({login, password})`, where the password is plaintext (will be hashed by the function). Resolves to a user object.
- `getUser({login})`. Resolves to a user object.
- `getUserWithFeedSummary({login})`. Resolves to a user object, augmented with the unread article count for each feed.
- `getAllUsers({login})`. Resolves to a list of user objects.
- `subscribe({login}, {title, xmlUrl})` will add a subscription for a user
- `unsubscribe({login}, {xmlUrl})` will remove a subscription for a user
- `updateUser({…})` will update the user in the database and resolve to the updated user
- `addReadstate({login}, {xmlUrl}, {guid, pubdate, title}, true/false)`, will add a readstate document that stores the state of an article (read/unread) for one user. For map/reduce convenience we also need to store the feed url, the article publication date and title.
- `updateReadstate({login}, {guid}, true/false)`, will update the readstate document (only the read property will be updated)

### Feed management

Feed format:
```json
{
    "title",
    "description",
    "link", // Link to website
    "xmlUrl", // RSS URL
}
```

Available functions:
- `addFeed({title, description, link, xmlUrl})`
- `getFeed({xmlUrl})`, will resolve to the corresponding feed
- `getAllFeeds()`, will resolve to a list of feeds
- `getSubscribersForFeed({xmlUrl})`, will resolve to a list of users that subscribe to a particular feed

### Article management

Article format:
```json
{
    "title",
    "description",
    "link",
    "pubdate",
    "guid", // This is used as the unique article ID,
    "feed" // xmlUrl of the article's feed 
}
```

Available functions:
- `addArticle({title, description, link, pubdate, guid})`
- `getArticle({guid})`, will resolve to the corresponding article
- `getAllArticlesForFeed({login}, {xmlUrl})`, resolves to all the articles of a feed, including readstates related to the user.

## REST API

`server.js` provides the REST API, exposed by the back-end.
This API is JSON-friendly : this means that all request bodies should be encoded as json and `Content-Type` header set to `application/json`.

### Authentication

#### Access token

The authentification is handled by a token given in the `Set-Cookie` header. You must give this token back in the `Cookie`header to get access to a resource.
Note: this token is valid for one day.

#### HTTP Basic Auth

HTTP Basic Auth mechanism is also supported for each request that needs authentication.

### CORS

It supports cross origin resource sharing as documented [here](http://www.w3.org/TR/cors/).

### User management

#### Sign-up

    POST /users/signup

##### Input

* login
_Required_ **string**
* password
_Required_ **string**

##### Response

  Created

Status: 201 Created

#### Sign-in

    POST /users/signin

##### Input

 * login
  _Required_ **string**
 * password
  _Required_ **string**

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
  ],
  "token": "some_token"
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

#### Subscribe to a feed

    PUT /user/feeds/:feed_url

##### Response

The updated user.

```json
{
  "login": "kikoo",
  "subscriptions": [
    {
      "title": "LinuxFr.org : les journaux",
      "xmlUrl": "http://linuxfr.org/journaux.atom",
      "unread": [
      ]
    },
    {
      "title": "LinuxFr.org : les journaux",
      "xmlUrl": "http://linuxfr.org/journaux.atom",
      "unread": [
      ]
    }
  ]
}
```

Status: 20O OK

#### Cancel a subscription

    DELETE /user/feeds/:feed_url

##### Response

The updated user.

```json
{
  "login": "kikoo",
  "subscriptions": [
    {
      "title": "LinuxFr.org : les journaux",
      "xmlUrl": "http://linuxfr.org/journaux.atom",
      "unread": [
      ]
    }
  ]
}
```

Status: 20O OK

#### Get authenticated user's subscriptions

    GET /user/feeds

##### Response

```json
[
  {
    "title": "LinuxFr.org : les journaux",
    "xmlUrl": "http://linuxfr.org/journaux.atom",
    "unreadCount": 20
  }
]
```

Status: 200 OK

#### Get subscription stories

    GET /user/feeds/:feed_url

##### Parameters

* filter
`all`, `unread`. Default: `all`.

##### Response

Warning: this query returns a list of simplified article objects (without their content)

```json
[
        {
        "title": "Test de la Manjaro Linux",
        "read": true,
        "pubdate": "2013-06-26T13:48:58.000Z",
        "guid": "tag:linuxfr.org,2005:Diary/34047"
    }
]
```

Status: 200 OK

#### Get a particular article

    GET /user/articles/:guid

##### Response

```json
[
        {
        "title": "Test de la Manjaro Linux",
        "pubdate": "2013-06-26T13:48:58.000Z",
        "guid": "tag:linuxfr.org,2005:Diary/34047",
        "description": "some html",
        "link": "http://linuxfr.org/users/eqfm/journaux/test-de-la-manjaro-linux"
    }
]
```

Status: 200 OK

#### Mark a story as read/unread

  POST /user/feeds/:feed_url/:story_guid/[un]read

##### Response

The updated user.

```json
{
  "login": "kikoo",
  "subscriptions": [
    {
      "title": "LinuxFr.org : les journaux",
      "description": null,
      "link": "http://linuxfr.org/journaux",
      "xmlUrl": "http://linuxfr.org/journaux.atom",
      "unread": [
        "tag:linuxfr.org,2005:Diary/34063",
        "tag:linuxfr.org,2005:Diary/34062",
        "tag:linuxfr.org,2005:Diary/34061",
        "tag:linuxfr.org,2005:Diary/34060",
        "tag:linuxfr.org,2005:Diary/34059",
        "tag:linuxfr.org,2005:Diary/34058",
        "tag:linuxfr.org,2005:Diary/34057",
        "tag:linuxfr.org,2005:Diary/34056",
        "tag:linuxfr.org,2005:Diary/34054",
        "tag:linuxfr.org,2005:Diary/34053",
        "tag:linuxfr.org,2005:Diary/34052",
        "tag:linuxfr.org,2005:Diary/34051",
        "tag:linuxfr.org,2005:Diary/34050"
      ]
    }
  ],
  "_rev": "31-05191487fc809eb187ce0be7dbb148e4",
  "type": "user",
  "password": "6a1a46ca023d02adff34ff157cab7e18322534d256f57fa0ba2a4b047aff696e0889d93cbdec89c3e0b62143abe33c1f54295e30619a208431fea55d7abf9749"
}
```

Status: 200 OK

#### Update feeds

Fetch new articles for each feed. Development Only.

  POST /feeds/update

##### Response

204 No Content
