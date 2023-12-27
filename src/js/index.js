import React from "react";
import Form from "react-jsonschema-form";
import API from "@aws-amplify/api";
import Loading from "./loading";
import { Redirect } from "react-router";

const schema = {
  type: "object",
  required: [],
  properties: {
    usedMeals: { type: "string", title: "Pending Teammates" },
  },
};

const uiSchema = {
  usedMeals: {
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
    };
  }

  async componentDidMount() {
    var user_info = await API.get(
      "treehacks",
      `/users/${this.props.user.username}/usedMeals`,
      {}
    )
      .then((response) => {
        return response;
      })
      .catch((error) => {
        // console.(error);
        // console.log(error.response.status);
        // console.log(error.response.data);
        return error;
      });

    const status = user_info.response?.status ? user_info.response.status : 200;
    this.setState({ loading: false });
    if (status !== 200) {
      this.setState({ error: "You have don't have access" });
      this.setState({
        dataFetched: true,
      });
      return;
    }

    console.log(meal_info);

    meal_info = {usedMeals: user_info.mealList};

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
      body: { ...e.formData},
    };

    console.log("pload", payload);
    const resp = await API.put(
        "treehacks",
        `/users/${this.props.user.username}/usedMeals`,
        payload
    );
    console.log(resp);
  }

  render() {
    //if (false) {
    if (!this.state.dataFetched) {
      return <Loading />;
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

export default MealForm;
