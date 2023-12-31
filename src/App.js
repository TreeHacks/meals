import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Meals from './page/meals/meals';
import * as serviceWorker from './utils/serviceWorker';
import API from '@aws-amplify/api';
import queryString from 'query-string';

import './App.css';

const LOGIN_URL = process.env.REACT_APP_LOGIN_URL;
const ENDPOINT_URL = process.env.REACT_APP_ENDPOINT_URL;

export const custom_header = async () => {
  return { Authorization: await localStorage.getItem('jwt') };
};
API.configure({
  endpoints: [
    {
      name: 'treehacks',
      endpoint: ENDPOINT_URL,
      custom_header: custom_header,
    },
  ],
});

export function parseJwt(token) {
  var base64UrlSplit = token.split('.');
  if (!base64UrlSplit) return null;
  const base64Url = base64UrlSplit[1];
  if (!base64Url) return null;
  const base64 = base64Url.replace('-', '+').replace('_', '/');
  return JSON.parse(window.atob(base64));
}

function getCurrentUser() {
  const jwt = getJwt();
  if (jwt) {
    // Verify JWT here.
    const parsed = parseJwt(jwt);
    if (!parsed) {
      console.log('JWT invalid');
    } else if (new Date().getTime() / 1000 >= parseInt(parsed.exp)) {
      console.log('JWT expired');
      // TODO: add refresh token logic if we want here.
    } else {
      let attributes = {
        name: parsed['name'],
        email: parsed['email'],
        email_verified: parsed['email_verified'],
        'cognito:groups': parsed['cognito:groups'],
      };
      console.log('attributes', attributes);
      if (attributes['cognito:groups'].includes('organizers_current')) {
        return {
          username: parsed['sub'],
          attributes,
        };
      } else {
        console.log("Isn't an organizer");
      }
    }
  }
  // If JWT from SAML has expired, or if there is no JWT in the first place, run this code.
  throw 'No current user';
}

function getJwt() {
  return localStorage.getItem('jwt');
}

function logout() {
  localStorage.removeItem('jwt');
  window.location.href = `${LOGIN_URL}/logout?redirect=${window.location.href}`;
}

function login() {
  window.location.href = `${LOGIN_URL}?redirect=${window.location.href}`;
}

const hash = queryString.parse(window.location.hash);
if (hash && hash.jwt) {
  localStorage.setItem('jwt', hash.jwt);
  window.location.hash = '';
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('tkn');

    // if an admin isn't registering an account
    if (!token)
      try {
        setUser(getCurrentUser());
      } catch (e) {
        // login();
      }
  }, []);
  let user_url = user && user.username ? '/users/' + user.username : '/';

  return (
    <BrowserRouter>
        <Meals user={user} />
    </BrowserRouter>
  );
}

export default App;
