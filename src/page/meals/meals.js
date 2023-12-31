import React, { useCallback, useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom'; // Import withRouter from React Router
import API from '@aws-amplify/api';

import Spacer from '../../components/spacer/spacer.component';

import logo from './../../assets/logo.svg';
import styles from './meals.module.scss';

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
  const [username, setUsername] = useState(
    '702f951f-8719-445d-b277-eaa4ea49dd41'
  );
  const [logs, setLogs] = useState([]); // Stores timestamps of scanned codes - if a code is scanned within 1 minute of the previous code, it is approved
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState([]);
  const [isFocused, setIsFocused] = useState(true);

  const extraneousKeys = ['Shift', 'Control', 'Alt', 'Meta'];

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Enter') {
        const code = scannedCode
          .filter((x) => !extraneousKeys.includes(x)) // Remove extraneous keys
          .join(''); // Join the array into a string
        console.log(code);

        logs.push({
          code: code,
          time: new Date().toLocaleString(),
        });

        console.log(logs);

        setScannedCode([]);
      } else {
        console.log(e.key);
        setScannedCode((prevScannedCode) => [...prevScannedCode, e.key]);
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    // Clean up the event listener
    return function cleanup() {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [scannedCode]); // Add scannedCode as a dependency

  useEffect(() => {
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    // Calls onFocus when the window first loads
    onFocus();
    // Specify how to clean up after this effect:
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const username = queryParams.get('username');
    setUsername(username);
    fetchUserData(username);
  }, []);

  const getMeal = useCallback( () => {
    const hour = new Date().getHours();

    if (hour > 6 && hour < 11) {
      return 'Breakfast';
    } else if (hour > 11 && hour < 14) {
      return 'Lunch';
    } else if (hour > 17 && hour < 21) {
      return 'Dinner';
    } else {
      return null;
    }
  }, []);

  const getBorderColor = useCallback(() => {
    if (!isFocused) {
      return 'shadow-md';
    } else if (logs.length > 0) {
      return 'shadow-lg shadow-tree-green border-tree-green';
    } else {
      // Scanning but no logs
      return 'border-slate-500';
    }
  }, [isFocused, logs]);

  const onFocus = useCallback(() => {
    console.log('Tab is in focus');
    setIsFocused(true);
  }, []);

  const onBlur = useCallback(() => {
    console.log('Tab is blurred');
    setIsFocused(false);
  }, []);

  const handleScanButton = useCallback(() => {
    setScanning(!scanning);
    setScannedCode([]);
  }, [scanning]);

  const getUsername = () => {
    return '702f951f-8719-445d-b277-eaa4ea49dd41';
  };

  const fetchUserData = async (username) => {
    try {
      const user_info = await API.get(
        'treehacks',
        `/users/${username}/forms/used_meals`,
        {}
      );
      const status = user_info.response?.status
        ? user_info.response.status
        : 200;
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
      setError('Cannot fetch data');
    }
  };

  const submitForm = async (e) => {
    console.log(e.formData);
    const payload = {
      body: { ...e.formData },
    };
    console.log('payload', payload);
    try {
      const resp = await API.put(
        'treehacks',
        `/users/${username}/forms/used_meals`,
        payload
      );
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
          <div className={['h-screen bg-[#fefafc]'].join(' ')}>
            <nav
              className={[
                'sticky z-10 bg-white w-full shadow-md px-8 py-4 justify-center items-center flex font-roboto',
              ].join(' ')}>
              <div className={['max-w-6xl w-full flex'].join(' ')}>
                <img
                  src={logo}
                  alt='logo'
                  className='h-12'
                />
                <p
                  className={[
                    'text-3xl ml-4 h-12 leading-[3rem] text-tree-green-light',
                  ].join(' ')}>
                  tree
                  <span className={['font-bold'].join(' ')}>hacks</span> meals
                </p>
                <Spacer />
                <p
                  className={[
                    'text-lg ml-4 h-12 leading-[3rem] hover:text-tree-green hover:cursor-pointer text-slate-500',
                  ].join(' ')}>
                  log out
                </p>
              </div>
            </nav>

            <div
              className={[
                styles.body,
                'font-roboto z-0 flex justify-center flex-col',
              ].join(' ')}>
              <p
                className={[
                  styles.title,
                  'text-4xl mt-12 text-center text-tree-green-light font-bold',
                ].join(' ')}>
                Scan Meals
              </p>
              {!getMeal() !== null ? (
                <>
                  <p className={['text-center text-xl mb-4'].join(' ')}>
                    {/* Show day of the week */}
                    {getMeal()}
                  </p>
                  {/* Can't be a button because it will react to enter key */}
                  <p
                    onClick={handleScanButton}
                    className={[
                      'transition-all cursor-pointer border-2 border-transparent w-fit mx-auto mt-4 mb-2 px-6 py-2 rounded-xl text-lg',
                      // 'text-white bg-tree-green-light hover:bg-white hover:border-tree-green'
                      scanning
                        ? 'text-white bg-red-500 hover:bg-red-600'
                        : 'text-white bg-tree-green-light hover:bg-tree-green',
                    ].join(' ')}>
                    {scanning ? 'Stop Scanning' : 'Start Scanning'}
                  </p>
                </>
              ) : (
                <p className={['text-center text-xl'].join(' ')}>
                  No meals available at this time
                </p>
              )}

              {scanning && (
                <div
                  className={[
                    'mt-8 mx-auto transition-all flex justify-center items-center w-1/2 max-w-2xl min-h-96',
                    'border-2 rounded-xl flex flex-col text-center',
                    getBorderColor(),
                  ].join(' ')}>
                  {isFocused ? (
                    <>
                      {logs.length > 0 ? (
                        <>
                          <p className={[''].join(' ')}>User ID:</p>
                          <p className={[''].join(' ')}>{}</p>
                        </>
                      ) : (
                        <p className={['text-2xl text-slate-500'].join(' ')}>
                          Scan away!
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className={['text-2xl'].join(' ')}>Scanning Paused</p>
                      <p className={['text-md mt-2 text-slate-500'].join(' ')}>
                        Click anywhere to resume
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* <div id='form'>
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
            </div> */}
          </div>
        )}
      </>
    );
  }
};

export default withRouter(MealForm);
