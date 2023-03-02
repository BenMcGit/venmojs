# venmo4js

A NodeJS wrapper for the Venmo API

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

#### `Venmo.loginUsernamePassword(username, password, device_id, client_id)`

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

Allows us to send an SMS text message to retrieve a one time token. To call this function we need to get the `venmo_otp_secret` from `Venmo.loginUsernamePassword` and pass it into `Venmo.loginOneTimePassword` along with the token in the text message (otp).

#### `Venmo.loginOneTimePassword(device_id, otp, otp_secret, client_id)`

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

#### `Venmo.logout(access_token)`

Revokes the access token from the user so it can no longer be used for authenticated API calls.

### User Information

#### `Venmo.fetchFriends(user_id, access_token)`

Retrieves the list of friends for a given user

### Transactions

#### `Venmo.fetchTransaction(transactionID, access_token)`

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

### Payments

#### `Venmo.requestPayment(amount, target_user_name, note, access_token, is_private)`

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
const { Venmo } = require("venmo4js");

function fetchOneTimePasswordTokenSMS() {
  let query = "Please enter your Venmo authentication token (SMS):";
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

let venmo = Venmo.getInstance();

const loginExample = async () => {
  let client_id = "1";
  let device_id = "99999999999999999999999";
  let user_name = "<ENTER_USER_NAME>";
  let password = "<ENTER_PASSWORD>";

  let res = await venmo.loginUsernamePassword(
    user_name,
    password,
    device_id,
    client_id
  );

  // if two factor authentication is enabled for user
  if (res.data.error && res.headers.venmo_otp_secret) {
    const text = await venmo.sendTextForOneTimePassword(
      device_id,
      res.headers.venmo_otp_secret
    );
    console.log(text);
    let user_otp = await fetchOneTimePasswordTokenSMS();
    res = await venmo.loginOneTimePassword(
      res.headers.venmo_otp_secret,
      user_otp,
      device_id,
      client_id
    );
  }
  console.log(res);
};
loginExample();
```

#### Request Payment Example:

```javascript
const { Venmo } = require("venmo4js");

let venmo = Venmo.getInstance();

const requestPaymentExample = async () => {
  const friend_user_name = "<ENTER_USER_NAME>";
  const access_token = "<ENTER_ACCESS_TOKEN>";
  const note = "This is a tiny description";

  // Determines who can view that this payment request has occurred
  const is_private = true;

  // IMPORTANT: Curretly there are safe gaurds to only allow requesting a payment between 0 and 100 dollars
  // Requesting payments requires a negative number to be entered
  // Sending payments requires a positive number.. this implementation does not support sending payments but its
  // simple to modify
  const amount = -1;

  const user_details = await venmo.fetchUserDetails(user_name, access_token);
  console.log(user_details);

  const requestPayment = await venmo.requestPayment(
    amount,
    friend_user_name,
    note,
    access_token,
    is_private
  );
  console.log(requestPayment);
};
requestPaymentExample();
```

#### Fetch Friends Example:

```javascript
const { Venmo } = require("venmo4js");

const fetchFriendsExample = async () => {
  const user_id = "<ENTER_USER_ID>";
  const access_token = "<ENTER_ACCESS_TOKEN>";

  const friends = await venmo.fetchFriends(user_id, access_token);
  console.log(friends);
};
fetchFriendsExample();
```

#### Fetch User Details Example:

```javascript
const { Venmo } = require("venmo4js");

const fetchUserDetailsExample = async () => {
  const user_name = "<ENTER_USER_NAME>";
  const access_token = "<ENTER_ACCESS_TOKEN>";

  const user_details = await venmo.fetchUserDetails(user_name, access_token);
  console.log(user_details);
};
fetchUserDetailsExample();
```
