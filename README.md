# venmo4js

A NodeJS wrapper for the Venmo API (Forked from https://github.com/pineapplelol/venmojs)

## Installation

```
npm i venmo4js
```

## Usage

### Setup

Retrieve an instance of the Venmo class

```javascript
const { Venmo } = require('venmo4js');

let venmo = Venmo.getInstance();

...
```

### Authentication

#### `Venmo.loginUsernamePassword(username, password)`

This method allows us to retrive an access token that can be used throughout the authenticated api calls. Generally this will require two factor authentication. If this is the case, expect an error like this:

```javascript
{
  error: {
    message: "Additional authentication is required",
    title: "Error'",
    code: 81109,
    url: "https://venmo.com/two-factor",
    links: null
  },
  venmo_otp: "required; two_factor",
  venmo_otp_secret: "<ONE-TIME-SECRET>",
  device_id: "<DEVICE_ID>"
}
```
#### `Venmo.sendTextForOneTimePassword(device_id, otp_secret)`

Allows us to send an SMS text message to retrieve a one time token. To call this function we need to get the `venmo_otp_secret` from `Venmo.loginUsernamePassword` and pass it into `Venmo.loginOneTimePassword` along with the token in the text message (user_otp).

#### `Venmo.loginOneTimePassword(device_id, user_otp, otp_secret)`

Most venmo accounts require two factor authentication. This method allows us to use a token gotten from SMS to login and get an access token.

```javascript
{
  expires_in: 0,
  balance: 0,
  user: {
    is_group: false,
    identity: null,
    is_venmo_team: false,
    friends_count: 1,
    profile_picture_url: '',
    email: '',
    last_name: '',
    first_name: '',
    id: '',
    is_payable: true,
    friend_status: null,
    display_name: '',
    is_active: true,
    about: ' ',
    trust_request: null,
    identity_type: 'personal',
    date_joined: '2016-09-30T23:54:35',
    audience: 'public',
    username: '',
    phone: '',
    is_blocked: false
  },
  token_type: 'bearer',
  access_token: '',
  refresh_token: ''
}
```

#### `Venmo.logout(accessToken)`

Revokes the access token from the user so it can no longer be used for authenticated API calls.

### User Information

#### `Venmo.getUserIDfromUsername(username)`

Returns the user id (like this: 2051112592998400240)

#### `Venmo.getUserInformation(username)`

Retrieves basic user information for a specified user. On success the data returned looks like this:

```javascript
{
  id: '',
  username: '',
  name: '',
  dateJoined: '',
  profilePictureURL: ''
}
```

#### `Venmo.getFriendsList(userID)`

Retrieves the list of friends for a given user

### Transactions

#### `Venmo.fetchTransaction(transactionID)`

```javascript
{
  data: {
    comments: { data: [], count: 0 },
    type: 'payment',
    transaction_external_id: '',
    authorization: null,
    id: '',
    payment: {
      external_wallet_payment_info: null,
      action: '',
      audience: 'public',
      target: [Object],
      status: 'settled',
      amount: 100,
      date_authorized: null,
      id: '',
      date_created: '',
      note: 'Pasta',
      date_completed: '',
      date_reminded: null,
      merchant_split_purchase: null,
      actor: [Object]
    },
    date_created: '',
    note: 'Pasta',
    likes: { data: [], count: 0 },
    mentions: { data: [], count: 0 },
    allow_user_add_comment: true,
    date_updated: '',
    transfer: null,
    app: {
      description: 'Venmo for iPhone',
      image_url: '',
      id: 1,
      name: 'Venmo for iPhone',
      site_url: null
    },
    audience: 'public'
  }
}
```

#### `Venmo.fetchTransactions(transactionID)`

Returns 10 different transactions

### Payments

#### `Venmo.requestMoney(target_user, amount, note, isPrivate)`

Requests money from a targeted user.

```javascript
{
  data: {
    payment_token: null,
    payment: {
      amount: 0.01,
      target: [Object],
      date_reminded: null,
      refund: null,
      external_wallet_payment_info: null,
      date_created: '',
      medium: 'Venmo for iPhone',
      date_completed: null,
      id: '',
      action: 'charge',
      status: 'pending',
      fee: null,
      date_authorized: null,
      audience: 'private',
      note: 'This is a test',
      actor: [Object]
    },
    balance: '0.00'
  }
}
```
### Errors

Errors will be thrown if there are invalid credentials (or not passed), or if you hit Venmo's rate limit.

### Example

#### Authentication Example: 

```javascript
const {Venmo, utils} = require('venmo4js');

let username = "<ENTER_USERNAME>"
let password = "<ENTER_PASSWORD>"
let venmo = Venmo.getInstance();

(async () => {
    let res = await venmo.loginUsernamePassword(username, password);
    if (res.error && res.venmo_otp_secret) {
        await venmo.sendTextForOneTimePassword(res.device_id, res.venmo_otp_secret);
        let otp_secret = await utils.fetchOneTimePasswordTokenSMS();
        res = await venmo.loginOneTimePassword(res.device_id, otp_secret, res.venmo_otp_secret);
        console.log(venmo.getAccessToken());
    } else if (res.error) {
        console.log(res.error)
    }
    console.log(res);
})();
```

#### Request Payment Example:

```javascript
const { Venmo } = require('venmo4js');

let target_user = "<ENTER_USER_NAME>"
let access_token = "<ENTER_ACCESS_TOKEN>"
let venmo = Venmo.getInstance();

(async () => {
    // Assume you already have an access token generated
    venmo.setAccessToken(access_token);

    // Request a penny from a friend
    let res = await venmo.requestMoney(target_user, 0.01, "This is a test <3");
    console.log(res);
})();
```

#### Get User and Transaction Data Example:

```javascript
const { Venmo } = require('venmo4js');

let target_user = "<ENTER_USER_NAME>"
let access_token = "<ENTER_ACCESS_TOKEN>"
let venmo = Venmo.getInstance();

(async () => {
    // Assume you already have an access token generated
    venmo.setAccessToken(access_token);

    // Fetch a user ID from a freinds username
    let res = await venmo.getUserIDfromUsername(target_user);
    console.log(res);

    // Fetch details about a friend
    res = await venmo.getUserInformation(target_user);
    console.log(res);

    // Fetch a friends transactions
    res = await venmo.fetchTransactions(res.id)
    console.log(res);

    // Fetch a single transaction
    let transactionID = res.data[0].id
    res = await venmo.fetchTransaction(transactionID);
    console.log(res);
})();
```
