import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom'; // Import withRouter from React Router
import Form from 'react-jsonschema-form';
import API from '@aws-amplify/api';

import Spacer from './components/spacer/spacer.component';

import logo from './assets/logo.svg';

const schema = {
  type: 'object',
  required: [],
  properties: {
    mealList: { type: 'string', title: 'Used Meals' },
  },
};

const uiSchema = {
  mealList: {
    'ui:placeholder': 'Use meal',
  },
};

const log = (type) => console.log.bind(console, type);

const MealForm = ({ location }) => {
  const [formSchema, setFormSchema] = useState(schema);
  const [dataFetched, setDataFetched] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [error, setError] = useState(undefined);
  const [username, setUsername] = useState('702f951f-8719-445d-b277-eaa4ea49dd41');

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const username = queryParams.get('username');
    setUsername(username);
    fetchUserData(username);
  }, []);

  const getUsername = () => {
    return '702f951f-8719-445d-b277-eaa4ea49dd41';
  };

  const fetchUserData = async (username) => {
    try {
      const user_info = await API.get('treehacks', `/users/${username}/forms/used_meals`, {});
      const status = user_info.response?.status ? user_info.response.status : 200;
      if (status !== 200) {
        setError("You don't have access");
        setDataFetched(true);
        return;
      }
      console.log(user_info);
      const meal_info = { mealList: user_info };
      console.log(meal_info);
      if (meal_info) {
        setDataFetched(true);
      }
    } catch (error) {
      // Handle error
      setDataFetched(true);
      setError(error);
    }
  };

  const submitForm = async (e) => {
    console.log(e.formData);
    const payload = {
      body: { ...e.formData },
    };
    console.log('payload', payload);
    try {
      const resp = await API.put('treehacks', `/users/${username}/forms/used_meals`, payload);
      console.log(resp);
    } catch (error) {
      // Handle error
      console.log(error);
    }
  };

  if (!dataFetched) {
    return <div>Loading...</div>;
  } else {
    return (
      <>
        {!error ? (
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              margin: '0 auto',
              padding: '20px',
              border: '1px solid green',
              width: 'fit-content',
              marginTop: '20px',
            }}>
            Error: {error}
          </div>
        ) : (
          <div className={[''].join(' ')}>
            <nav
              className={[
                'w-full shadow-md px-8 py-3 justify-center items-center flex',
              ].join(' ')}>
              <div className={['max-w-6xl w-full flex'].join(' ')}>
                <img
                  src={logo}
                  alt='logo'
                  className='h-12'
                />
                <p className={[''].join(' ')}>
                  treehacks
                </p>
                <Spacer />
                <p>
                  log out
                </p>
              </div>
            </nav>

            <div id='form'>
              <h1
                style={{ marginTop: '0px', marginBottom: '10px' }}
                id='formHeader'>
                Use meals!
              </h1>
              <Form
                schema={formSchema}
                uiSchema={uiSchema}
                onChange={log('changed')}
                onSubmit={(e) => submitForm(e)}
                onError={log('errors')}
              />
            </div>
          </div>
        )}
      </>
    );
  }
};

export default withRouter(MealForm);
