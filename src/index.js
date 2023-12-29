import React from "react";
import Form from "react-jsonschema-form";
import API from "@aws-amplify/api";
import { Redirect } from "react-router";
import ReactDOM from "react-dom";
import * as serviceWorker from "./js/serviceWorker";
import queryString from "query-string";
import { useState, useEffect } from "react";

const LOGIN_URL = process.env.REACT_APP_LOGIN_URL;
const ENDPOINT_URL = process.env.REACT_APP_ENDPOINT_URL;

export const custom_header = async () => {
  return { Authorization: await localStorage.getItem("jwt") };
};

API.configure({
  endpoints: [
    {
      name: "treehacks",
      endpoint: ENDPOINT_URL,
      custom_header: custom_header,
    },
  ],
});

export function parseJwt(token) {
  var base64UrlSplit = token.split(".");
  if (!base64UrlSplit) return null;
  const base64Url = base64UrlSplit[1];
  if (!base64Url) return null;
  const base64 = base64Url.replace("-", "+").replace("_", "/");
  return JSON.parse(window.atob(base64));
}

function getCurrentUser() {
  const jwt = getJwt();
  if (jwt) {
    // Verify JWT here.
    const parsed = parseJwt(jwt);
    if (!parsed) {
      console.log("JWT invalid");
    } else if (new Date().getTime() / 1000 >= parseInt(parsed.exp)) {
      console.log("JWT expired");
      // TODO: add refresh token logic if we want here.
    } else {
      let attributes = {
        name: parsed["name"],
        email: parsed["email"],
        email_verified: parsed["email_verified"],
        "cognito:groups": parsed["cognito:groups"],
      };
      return {
        username: parsed["sub"],
        attributes,
      };
    }
  }
  // If JWT from SAML has expired, or if there is no JWT in the first place, run this code.
  throw "No current user";
}

function getJwt() {
  return localStorage.getItem("jwt");
}

function logout() {
  localStorage.removeItem("jwt");
  window.location.href = `${LOGIN_URL}/logout?redirect=${window.location.href}`;
}

function login() {
  window.location.href = `${LOGIN_URL}?redirect=${window.location.href}`;
}

const hash = queryString.parse(window.location.hash);
if (hash && hash.jwt) {
  localStorage.setItem("jwt", hash.jwt);
  window.location.hash = "";
}



const schema = {
  type: "object",
  required: [],
  properties: {
    mealList: { type: "string", title: "Used Meals" },
  },
};

const uiSchema = {
  mealList: {
    "ui:placeholder": "Use meal",
  },
};

const log = (type) => console.log.bind(console, type);

class MealForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formSchema: schema,
      dataFetched: false,
      redirect: false,
      error: undefined,
      username: "702f951f-8719-445d-b277-eaa4ea49dd41", // Example username state
    };
  }

  async componentDidMount() {
    // Login logic
    //const [user, setUser] = useState(null);
    const token = new URLSearchParams(window.location.search).get("tkn");
    if (!token) {
      try {
        localStorage.setItem("jwt", getCurrentUser());
        //setUser(getCurrentUser());
      } catch (e) {
        login();
      }
    };

    const new_header = async () => {
      return { Authorization: await localStorage.getItem("jwt") };
    };

    API.configure({
      endpoints: [
        {
          name: "treehacks",
          endpoint: ENDPOINT_URL,
          custom_header: new_header,
        },
      ],
    });

    // Rest of the logic
    const username = this.getUsername();
    this.setState({ username }, () => {
      this.fetchUserData(this.state.username);
    });
  }

  getUsername() {
    return "702f951f-8719-445d-b277-eaa4ea49dd41";
  }

  async fetchUserData(username) {
    var user_info = await API.get(
      "treehacks",
      `/users/${username}/forms/used_meals`,
      {}
    )
    .then((response) => {
      return response;
    })
    .catch((error) => {
      // Handle error
      return error;
    });

    const status = user_info.response?.status ? user_info.response.status : 200;
    this.setState({ loading: false });
    if (status !== 200) {
      this.setState({ error: "You don't have access", dataFetched: true });
      return;
    }

    console.log(user_info);

    var meal_info = {mealList: user_info};

    console.log(meal_info);

    if (meal_info) {
      this.setState({
        formSchema: this.state.formSchema,
        dataFetched: true,
      });
    }
  }

  async submitForm(e) {
    console.log(e.formData);
    const payload = {
      body: { ...e.formData },
    };

    console.log("payload", payload);
    const resp = await API.put(
        "treehacks",
        `/users/${this.state.username}/forms/used_meals`,
        payload
    );
    console.log(resp);
  }

  render() {
    if (!this.state.dataFetched) {
      return <div>Loading...</div>; 
    } else {
      return (
        <>
          {this.state.error ? (
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "20px",
                margin: "0 auto",
                padding: "20px",
                border: "1px solid green",
                width: "fit-content",
                marginTop: "20px",
              }}
            >
              Error: {this.state.error}
            </div>
          ) : (
            <div id="form">
              <h1
                style={{ marginTop: "0px", marginBottom: "10px" }}
                id="formHeader"
              >
                Use meals!
              </h1>
              <Form
                schema={this.state.formSchema}
                uiSchema={uiSchema}
                onChange={log("changed")}
                onSubmit={(e) => this.submitForm(e)}
                onError={log("errors")}
              />
            </div>
          )}
        </>
      );
    }
  }
}


//export default MealForm;

ReactDOM.render(
  <React.StrictMode>
    <MealForm />
  </React.StrictMode>,
  document.getElementById('root')
);

serviceWorker.unregister();
