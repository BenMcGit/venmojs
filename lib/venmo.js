"use strict";

const venmoapi = require("./api");

const REQUEST_PAYMENT_LIMIT = -100;
const DEFAULT_CLIENT_ID = "1";
const PRIVACY_SETTINGS = {
  PRIVATE: "private",
  PUBLIC: "public",
  FRIENDS: "friends",
};

class Venmo {

  /**
   * Logins given a username and password. Currently does not support
   * 2FA (coming soon). This function will automatically set the access token
   * for the user.
   * @param {string} username The username for the Venmo account.
   * @param {string} password The password for the Venmo account.
   * @param {string} device_id A unique device id that you are currently using.
   * @param {string} client_id The ID of your client.
   * @returns JSON that includes an access token associated with the user and device id.
   * @example
   *   await Venmo.loginUsernamePassword("myusername", "mypassword", "myuniquedeviceid")
   **/
  async loginUsernamePassword(username, password, device_id, client_id) {
    if (!client_id) {
      client_id = DEFAULT_CLIENT_ID;
    }
    if (
      username === undefined ||
      password === undefined ||
      device_id === undefined
    ) {
      return {
        error: "username, password, and device_id are required",
      };
    }
    try {
      const response = await venmoapi.authenticate(
        username,
        password,
        device_id,
        client_id
      );
      return response;
    } catch (err) {
      return {
        error: err,
        message: "Error occurred when authenticating to venmo",
      };
    }
  }

  /**
   * Logins given a deviceID, one-time password, and a secret token.
   * This function will automatically set the access token
   * for the user.
   * @param {string} device_id The id of the device we are authenticating with.
   * @param {string} otp The token that was sent via sms.
   * @param {string} otp_secret The secret that is found in the response header of original login.
   * @param {string} client_id The ID of your client.
   * @returns JSON that includes an access token associated with the user and device id.
   * @example
   *   await Venmo.loginOneTimePassword(res.device_id, otp_secret, res.venmo_otp_secret);
   **/
  async loginOneTimePassword(otp_secret, otp, device_id, client_id) {
    if (!client_id) {
      client_id = DEFAULT_CLIENT_ID;
    }
    if (
      otp === undefined ||
      otp_secret === undefined ||
      device_id === undefined
    ) {
      return {
        error: "otp_secret, otp, and device_id are required",
      };
    }
    try {
      const response = await venmoapi.authenticateTwoFactor(
        otp_secret,
        otp,
        device_id,
        client_id
      );
      return response;
    } catch (err) {
      return {
        error: err,
        message:
          "Error occurred when authenticating using two factor auth to venmo",
      };
    }
  }

  /**
   * Sends a text message to a users mobile device with a one-time
   * password. This can be used for the one time password login.
   * @param {string} device_id The device ID used for authentication.
   * @param {string} otp_secret The secret that is found in the response header of original login.
   * @returns JSON indicating the SMS was successfully sent
   **/
  async sendTextForOneTimePassword(device_id, otp_secret) {
    if (otp_secret === undefined || device_id === undefined) {
      return {
        error: "otp_secret and device_id are required",
      };
    }
    try {
      const response = await venmoapi.sendSms(device_id, otp_secret);
      return response;
    } catch (err) {
      return {
        error: err,
        message: "Error occurred when sending out two factor sms",
      };
    }
  }

  /**
   * Revoke an access token and log out the current session.
   * @param {string} access_token The access token that should be logged out of (defaults to the current access token).
   */
  async logout(access_token) {
    if (access_token === undefined) {
      return {
        error: "access_token is required",
      };
    }
    try {
      const response = await venmoapi.logout(access_token);
      return response;
    } catch (err) {
      return {
        error: err,
        message: "Error occurred when logging out user",
      };
    }
  }

  /**
   * Given a Venmo username, will return the unique Venmo userID for that username. This API call does
   * not require authentication (no access key required).
   * @param {string} user_name The Venmo user name of the user to get friends list for.
   * @param {string} access_token The authenticated access token.
   * @returns
   */
  async fetchUserDetails(user_name, access_token) {
    if (user_name === undefined || access_token === undefined) {
      return {
        error: "user_name and access_token is required",
      };
    }
    try {
      const response = await venmoapi.fetchUserDetails(user_name, access_token);
      return response;
    } catch (err) {
      return {
        error: err,
        message: "Error occurred when fetching user id for user " + user_name,
      };
    }
  }

  /**
   * Will retrieve transaction data directly from the Venmo API. This API call does
   * require authentication (access key required).
   * @param {string} transaction_id The Venmo transactionID of the transaction.
   * @param {string} access_token The authenticated access token.
   * @returns Information about a single transaction
   */
  async fetchTransaction(transaction_id, access_token) {
    if (transaction_id === undefined || access_token === undefined) {
      return {
        error: "transaction_id and access_token are required",
      };
    }
    try {
      const response = await venmoapi.fetchTransaction(
        transaction_id,
        access_token
      );
      return response;
    } catch (err) {
      return {
        error: err,
        message:
          "Error occurred when fetching the transaction " + transaction_id,
      };
    }
  }

  /**
   * Will retrieve a list of friends from the Venmo API. This API call does
   * require authentication (access key required).
   * @param {string} user_id The Venmo userID of the user to get friends list for.
   * @param {string} access_token The authenticated access token.
   * @returns A list of all friends for user.
   */
  async fetchFriends(user_id, access_token) {
    if (user_id === undefined || access_token === undefined) {
      return {
        error: "user_id and access_token are required",
      };
    }
    try {
      const response = await venmoapi.fetchFriends(user_id, access_token);
      return response;
    } catch (err) {
      return {
        error: err,
        message: "Error occurred when fetching the friends for user " + user_id,
      };
    }
  }

  isRequestPaymentAmountValid(amount) {
    // assure the amount is negative.. 
    // this is the difference between a payment and request
    if (amount >= 0) {
      return {
        is_valid: false,
        error: {
          code: 506,
          message: "The request payment must be less than 0",
        },
      };
    }
    if (amount <= REQUEST_PAYMENT_LIMIT) {
      return {
        is_valid: false,
        error: {
          code: 507,
          message:
            "The request payment must be greater than " + REQUEST_PAYMENT_LIMIT,
        },
      };
    }
    return {
      is_valid: true,
    };
  }

  /**
   * Sends money to a specific account using the Venmo API. This API call does
   * require authentication (access key required).
   * @param {string} target_user The Venmo userID of the user to send money to.
   * @param {string} amount The amount of money to request from the user.
   * @param {string} note A note that describes the transaction.
   * @returns JSON indicating that the payment went through successfully
   */
  async requestPayment(amount, target_user_name, note, access_token, is_private = true) {
    if (amount === undefined || target_user_name === undefined || note === undefined, access_token === undefined) {
      return {
        error: "amount, target_user_name, note, and access_token are required",
      };
    }
    
    const audience = is_private
      ? PRIVACY_SETTINGS.PRIVATE
      : PRIVACY_SETTINGS.PUBLIC;

    const result = this.isRequestPaymentAmountValid(amount);
    if (!result.is_valid) {
      return result;
    }

    try {
      const response = await venmoapi.requestPayment(amount, target_user_name, note, audience, access_token);
      return response;
    } catch (err) {
      return {
        error: err,
        message: "Error occurred when requesting the payment of " + amount + " from user " + target_user_name,
      };
    }
  }
}

function getInstance() {
  return new Venmo();
}

module.exports = {
  getInstance,
};
