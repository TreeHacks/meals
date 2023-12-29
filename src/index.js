import React from "react";
import Form from "react-jsonschema-form";
import API from "@aws-amplify/api";
import { Redirect } from "react-router";
import ReactDOM from "react-dom";
import * as serviceWorker from "./js/serviceWorker";

const ENDPOINT_URL = process.env.REACT_APP_ENDPOINT_URL;

export const custom_header = () => {
  return { Authorization: process.env.REACT_APP_JWT_TOKEN };
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
  constructor() {
    super();
    this.state = {
      formSchema: schema,
      dataFetched: false,
      redirect: false,
      error: undefined,
      username: "702f951f-8719-445d-b277-eaa4ea49dd41", // Example username state
    };
  }

  async componentDidMount() {
    // You need to replace this with your logic to get the username
    const username = this.getUsername();
    this.setState({ username }, () => {
      this.fetchUserData(this.state.username);
    });
  }

  // Replace this with your logic to get the username
  getUsername() {
    return "702f951f-8719-445d-b277-eaa4ea49dd41";
  }

  async fetchUserData(username) {
    var user_info = await API.get(
      "treehacks",
      `/users/${username}/forms/meet_info`,
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
        `/users/${this.state.username}/used_meals`,
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
                Make your team!
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
