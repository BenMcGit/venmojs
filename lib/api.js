const fetch = require("node-fetch");

const BASE_URL = "https://api.venmo.com/v1";
const URL = {
  AUTHENTICATE: BASE_URL + "/oauth/access_token",
  SEND_SMS: BASE_URL + "/account/two-factor/token",
  GET_TRANSACTION: BASE_URL + "/stories",
  GET_USER: BASE_URL + "/users",
  PAYMENT: BASE_URL + "/payments"
};
const HTTP = {
  POST: "POST",
  GET: "GET",
  DELETE: "DELETE"
};
const HEADERS = {
  CONTENT_TYPE: "application/json",
};

const getAuthHeader = (access_token) => {
  return ["Bearer", access_token].join(" ")
}

const fetchData = async (response) => {
  if (response.status === 429) {
    return {
      error: "Rate limit has been hit",
      status: response.status,
      message: response.statusText
    }
  }
  const headers = {};
  response.headers.forEach((value, key) => {
    headers[key.replaceAll('-', '_')] = value;
  });
  try {
    const data = await response.json();
    return {
      data: data,
      headers: headers,
    };
  } catch (err) {
    return {
      error: err,
      headers: headers,
      message: "Error occurred when fetching data",
    };
  }
};

const authenticate = async (username, password, device_id, client_id) => {
  const response = await fetch(URL.AUTHENTICATE, {
    method: HTTP.POST,
    headers: {
      "device-id": device_id,
      "Content-Type": HEADERS.CONTENT_TYPE,
      Host: "api.venmo.com",
    },
    body: JSON.stringify({
      phone_email_or_username: username,
      password: password,
      client_id: client_id,
    }),
  });
  const data = fetchData(response);
  return data;
};

const authenticateTwoFactor = async (
  otp_secret,
  otp,
  device_id,
  client_id
) => {
  const response = await fetch(URL.AUTHENTICATE, {
    method: HTTP.POST,
    headers: {
      "device-id": device_id,
      "Content-Type": HEADERS.CONTENT_TYPE,
      "venmo-otp": otp,
      "venmo-otp-secret": otp_secret,
    },
    body: JSON.stringify({ client_id: client_id }),
  });
  const data = fetchData(response);
  return data;
};

const sendSms = async (device_id, otp_secret) => {
  const response = await fetch(URL.SEND_SMS, {
    method: HTTP.POST,
    headers: {
      "device-id": device_id,
      "Content-Type": HEADERS.CONTENT_TYPE,
      "venmo-otp-secret": otp_secret,
    },
    body: JSON.stringify({ via: "sms" }),
  });
  const data = fetchData(response);
  return data;
};

const logout = async (access_token) => {
  const response = await fetch(URL.AUTHENTICATE, {
    method: HTTP.DELETE,
    headers: { Authorization: getAuthHeader(access_token) },
  });
  // TODO: Check the response code and return success or error
  return response;
}

const fetchTransaction = async (transaction_id, access_token) => {
  const url = [URL.GET_TRANSACTION, transaction_id].join("/")
  const response = await fetch(url, {
    method: HTTP.GET,
    headers: { Authorization: getAuthHeader(access_token) },
  });
  const data = fetchData(response);
  return data;
}

const fetchFriends = async (user_id, access_token) => {
  const url = [URL.GET_USER, user_id, "friends"].join("/");
  console.log(url)
  const response = await fetch(url, {
    method: HTTP.GET,
    headers: { Authorization: getAuthHeader(access_token) },
    params: { limit: 1000, offset: 1000 },
  });
  const data = fetchData(response);
  return data;
}

const fetchUserDetails = async (user_name, access_token) => {
  const url = [URL.GET_USER, user_name].join("/");
  const response = await fetch(url, {
    method: HTTP.GET,
    headers: { Authorization: getAuthHeader(access_token) },
  });
  const data = fetchData(response);
  return data;
}

const requestPayment = async (amount, target_user_name, note, audience, access_token) => {
  const response = await fetch(URL.PAYMENT, {
    method: HTTP.POST,
    headers: { 
      "Content-Type": HEADERS.CONTENT_TYPE,
      Authorization: getAuthHeader(access_token) 
    },
    body: JSON.stringify({
      amount: amount,
      audience: audience,
      note: note,
      username: target_user_name,
    }),
  });
  const data = fetchData(response);
  return data;
}

module.exports = {
  authenticate,
  authenticateTwoFactor,
  sendSms,
  logout,
  fetchTransaction,
  fetchFriends,
  fetchUserDetails,
  requestPayment
};
