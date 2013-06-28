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

	curl -X PUT -b'token=token' 'http://127.0.0.1:3000/user/feeds/http://linuxfr.org/journaux.atom' -D-

## Get subscription stories

	curl -X GET -b'token=token' 'http://127.0.0.1:3000/feeds/http://linuxfr.org/journaux.atom' -D-
