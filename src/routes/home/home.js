import React, { useCallback, useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom'; // Import withRouter from React Router
import API from '@aws-amplify/api';

import Spacer from '../../components/spacer/spacer.component';

import logo from './../../assets/logo.svg';
import styles from './home.module.scss';

// const schema = {
//   type: 'object',
//   required: [],
//   properties: {
//     mealList: { type: 'string', title: 'Used Meals' },
//   },
// };

// const uiSchema = {
//   mealList: {
//     'ui:placeholder': 'Use meal',
//   },
// };

const Meals = ({ logout }) => {
  const [logs, setLogs] = useState([]); // Stores timestamps of scanned codes - if a code is scanned within 1 minute of the previous code, it is approved
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState([]);
  const [isFocused, setIsFocused] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const extraneousKeys = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'];

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Enter') {
        const code = scannedCode
          .filter((x) => !extraneousKeys.includes(x)) // Remove extraneous keys
          .join(''); // Join the array into a string
        console.log(code);

        handleScan(code);

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

  const handleScan = async (user_id) => {
    setError(null); // Reset error

    const mealCode = getMealCode();

    user_id = '702f951f-8719-445d-b277-eaa4ea49dd41'

    const user_info = await fetchUserData(user_id);

    console.log('after', error, user_info);

    if (error === null && user_info !== null) {
      const mealList = user_info.mealList;

      setUser({
        user_id: user_id,
        mealList: mealList,
      });

      const meals = mealList.split(' ');
      const status = !meals.includes(mealCode) ? 'approved' : 'denied';

      logs.push({
        code: user_id,
        status: status,
        time: new Date().toLocaleString(),
      });

      console.log('logs', logs);
      console.log('status', status, meals);

      if (status === 'approved') {
        // Append meal code to user's meal list
        const updated_meal_info = mealList + ' ' + mealCode;
        await updateUserMeals(user_id, updated_meal_info);
      }
    }
  };

  const getMeal = useCallback(() => {
    const hour = new Date().getHours();

    if (hour > 6 && hour < 11) {
      return 'Breakfast';
    } else if (hour > 11 && hour < 14) {
      return 'Lunch';
    } else if (hour > 17 && hour < 24) {
      return 'Dinner';
    } else {
      return null;
    }
  }, []);

  const getMealCode = useCallback(() => {
    // 3 Letter week day
    const day = new Date().toLocaleString('en-us', { weekday: 'short' });
    const meal = getMeal()[0].toLowerCase();

    if (meal === null) {
      return null;
    }

    return `${day}-${meal}`;
  }, [getMeal]);

  const getBorderColor = useCallback(() => {
    if (!isFocused) {
      return 'shadow-md';
    } else if (logs.length > 0) {
      if (logs[logs.length - 1].status === 'approved') {
        return 'shadow-lg shadow-tree-green border-tree-green';
      } else {
        // Already scanned
        return 'shadow-lg shadow-red-500 border-red-500';
      }
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
    setScannedCode([]);
  }, []);

  const handleScanButton = useCallback(() => {
    setScanning(!scanning);
    setScannedCode([]);
  }, [scanning]);

  const fetchUserData = async (user_id) => {
    try {
      const user_info = await API.get(
        'treehacks',
        `/users/${user_id}/forms/used_meals`,
        {}
      );
      const status = user_info.response?.status
        ? user_info.response.status
        : 200;

      if (status !== 200) {
        console.log("Error: You don't have access");
        setError("Error: You don't have access");
        return null;
      }

      console.log('user_info', user_info);

      return user_info;
    } catch (error) {
      // Handle error
      console.log('error', error);
      setError(error.message);
      return null;
    }
  };

  const updateUserMeals = async (user_id, meal_info) => {
    const payload = {
      body: {
        mealList: meal_info,
      },
    };

    try {
      const response = await API.put(
        'treehacks',
        `/users/${user_id}/forms/used_meals`,
        payload
      );

      console.log(response);
    } catch (error) {
      // Handle error
      console.log(error);
    }
  };

  return (
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
            onClick={logout}
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
        {getMeal() !== null ? (
          <>
            <p className={['text-center text-xl mt-4 mb-4'].join(' ')}>
              {/* Show day of the week */}
              {new Date().toLocaleString('en-us', { weekday: 'long' })}{' '}
              {getMeal()}
            </p>
            {/* Can't be a button because it will react to enter key */}
            <p
              onClick={handleScanButton}
              className={[
                'transition-all cursor-pointer border-2 border-transparent w-fit mx-auto mt-4 mb-2 px-6 py-2 rounded-lg text-lg',
                // 'text-white bg-tree-green-light hover:bg-white hover:border-tree-green'
                scanning
                  ? 'text-white bg-red-500 hover:bg-red-600'
                  : 'text-white bg-tree-green-light hover:bg-tree-green',
              ].join(' ')}>
              {scanning ? 'Stop Scanning' : 'Start Scanning'}
            </p>
          </>
        ) : (
          <p className={['text-center text-xl mt-6'].join(' ')}>
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
                    <p className={['text-xl'].join(' ')}>User ID:</p>
                    <p className={['text-xl text-tree-green'].join(' ')}>
                      {user?.user_id}
                    </p>
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
  );
};

export default Meals;
