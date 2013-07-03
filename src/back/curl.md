# curl commands

## Signin

	curl -X POST -d'{"login":"kikoo", "password":"kiki"}' -H"Content-type: application/json" 'http://127.0.0.1:3000/users/signin' -D-

## Signup

	curl -X POST -d'{"login":"kikoo", "password":"kiki"}' -H"Content-type: application/json" 'http://127.0.0.1:3000/users/signup' -D-

## Get user

	curl -X GET -b'token=token' 'http://127.0.0.1:3000/user' -D-

## Get user's subscriptions

	curl -X GET -b'token=token' 'http://127.0.0.1:3000/user/feeds' -D-

## Add a subscription

	curl -X PUT -b'token=token' 'http://127.0.0.1:3000/user/feeds/http%3A%2F%2Flinuxfr.org%2Fjournaux.atom' -D-

## Cancel a subscription

	 curl -X DELETE -b'token=token' 'http://127.0.0.1:3000/user/feeds/http%3A%2F%2Flinuxfr.org%2Fjournaux.atom' -D-

## Get subscription stories

	curl -X GET -b'token=token' 'http://127.0.0.1:3000/user/feeds/http%3A%2F%2Flinuxfr.org%2Fjournaux.atom' -D-

	curl -X GET -b'token=token' 'http://127.0.0.1:3000/user/feeds/http%3A%2F%2Flinuxfr.org%2Fjournaux.atom?filter=unread' -D-

## Mark a story as read/unread

	curl -X POST -b'token=token' 'http://127.0.0.1:3000/user/feeds/http%3A%2F%2Flinuxfr.org%2Fjournaux.atom/tag%3Alinuxfr.org%2C2005%3ADiary%2F34055/read' -D-

	curl -X POST -b'token=token' 'http://127.0.0.1:3000/user/feeds/http%3A%2F%2Flinuxfr.org%2Fjournaux.atom/tag%3Alinuxfr.org%2C2005%3ADiary%2F34055/unread' -D-

## Update feeds

	 curl -X POST -b'token=token' 'http://127.0.0.1:3000/feeds/update' -D-
