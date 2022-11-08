# venmo4js

A NodeJS wrapper for the Venmo API (Forked from https://github.com/pineapplelol/venmojs)

## Usage

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
  device_id: "14397886-12X4-8D46-37U4-2AY08Z572467"
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
    friends_count: 75,
    profile_picture_url: 'https://pics.venmo.com/87ab0ded-cda0-44eb-a19c-91152c0cef04?width=460&height=460&photoVersion=2',
    email: 'mcadams.benj@gmail.com',
    last_name: 'McAdams',
    first_name: 'Ben',
    id: '2051112592998400240',
    is_payable: true,
    friend_status: null,
    display_name: 'Ben McAdams',
    is_active: true,
    about: ' ',
    trust_request: null,
    identity_type: 'personal',
    date_joined: '2016-09-30T23:54:35',
    audience: 'public',
    username: 'Ben-McAdams-1',
    phone: '12623095945',
    is_blocked: false
  },
  token_type: 'bearer',
  access_token: <ACCESS_TOKEN>,
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
  id: '2051112592998400240',
  username: 'Ben-McAdams-1',
  name: 'Ben McAdams',
  dateJoined: '2016',
  profilePictureURL: 'https://pics.venmo.com/87ab0ded-cda0-44eb-a19c-91152c0cef04?width=460&height=460&photoVersion=2'
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
    transaction_external_id: '3666080492879365155',
    authorization: null,
    id: '3666080493659928540',
    payment: {
      external_wallet_payment_info: null,
      action: 'charge',
      audience: 'public',
      target: [Object],
      status: 'settled',
      amount: 100,
      date_authorized: null,
      id: '3666080492879365155',
      date_created: '2022-11-07T05:27:31',
      note: 'Pasta',
      date_completed: '2022-11-07T05:27:31',
      date_reminded: null,
      merchant_split_purchase: null,
      actor: [Object]
    },
    date_created: '2022-11-07T05:27:31',
    note: 'Pasta',
    likes: { data: [], count: 0 },
    mentions: { data: [], count: 0 },
    allow_user_add_comment: true,
    date_updated: '2022-11-07T05:27:31',
    transfer: null,
    app: {
      description: 'Venmo for iPhone',
      image_url: 'https://venmo.s3.amazonaws.com/oauth/no-image-100x100.png',
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
      date_created: '2022-11-08T01:45:40',
      medium: 'Venmo for iPhone',
      date_completed: null,
      id: '3666693611347845640',
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
import Venmo from "venmo4js";
import readline from "readline";

let username = "<ENTER_USER_NAME>"
let password = "<ENTER_PASSWORD>"

function fetchOneTimePasswordTokenSMS() {
    let query = "Please enter your Venmo authentication token (SMS):"
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans.trim());
    }))
}

let res = await Venmo.loginUsernamePassword(username, password);

if (res.error && res.venmo_otp_secret) {
    await Venmo.sendTextForOneTimePassword(res.device_id, res.venmo_otp_secret);
    let otp_secret = await fetchOneTimePasswordTokenSMS();
    res = await Venmo.loginOneTimePassword(res.device_id, otp_secret, res.venmo_otp_secret);
}

console.log(res);
```

#### Request Payment Example:

```javascript
import Venmo from "venmo4js";
let access_token = "<ENTER_ACCESS_TOKEN>"
let target_user = "<ENTER_USER_ID>"

Venmo.setAccessToken(access_token);
let result = await Venmo.requestMoney(target_user, -0.01, "This is a test")
console.log(result);
```

#### Get User and Transaction Data Example:

```javascript
import Venmo from "venmo4js";

let access_token = "<ENTER_ACCESS_TOKEN>"
let target_user = "<ENTER_USER_ID>"

Venmo.setAccessToken(access_token);
let res = await Venmo.getUserIDfromUsername(target_user)
console.log(res)

res = await Venmo.getUserInformation(target_user)
console.log(res)

res = await Venmo.fetchTransactions(res.id)
console.log(res);
let transactionID = res.data[0].id

res = await Venmo.fetchTransaction(transactionID);
console.log(res);
```