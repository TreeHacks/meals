import React, { useCallback, useEffect, useState } from 'react';
import API from '@aws-amplify/api';
import queryString from 'query-string';

import Spacer from '../../components/spacer/spacer.component';

import logo from './../../assets/logo.svg';
import styles from './home.module.scss';

const extraneousKeys = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab']; // Keys to ignore when scanning

const Meals = ({ logout }) => {
  const [logs, setLogs] = useState([]); // Stores timestamps of scanned codes - if a code is scanned within 1 minute of the previous code, it is approved
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState([]);
  const [isFocused, setIsFocused] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('scan'); // mode is "scan" if using a scanner, otherwise "manual" if using a phone

  /**
   * Returns the current meal based on the time of day. Returns null if no meal is available
   */
  const getMeal = useCallback(() => {
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

  /**
   * Returns the current meal code based on the time of day. Returns null if no meal is available
   *
   * Format: <3 letter day>-<meal>
   * Example: fri-lunch
   *
   */
  const getMealCode = useCallback(() => {
    // 3 Letter week day
    const day = new Date()
      .toLocaleString('en-us', { weekday: 'short' })
      .toLowerCase();
    const meal = getMeal()?.toLowerCase();

    if (meal === null || meal === undefined) {
      return null;
    }

    return `${day}-${meal}`;
  }, [getMeal]);

  /**
   * Fetches user data from the API. Saves error to state if there was an error
   * @param {string} user_id - The user's id
   * @returns {object} - The user's data, or null if there was an error
   */
  const fetchUserData = useCallback(async (user_id) => {
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
  }, []);

  /**
   * Handles scanning a user's code. Updates the user's meal list if the user is approved.
   * Saves the user's id, status, and timestamp to logs. To handle accidental double scans,
   * if a user is scanned within 1 minute of the previous scan, the user's status is set to the previous status.
   *
   * @param {string} user_id - The user's id
   */
  const handleScan = useCallback(
    async (user_id) => {
      setError(null); // Reset error

      const mealCode = getMealCode();

      if (mealCode === null) {
        setError('No meal available at this time');
        return;
      }

      user_id = '702f951f-8719-445d-b277-eaa4ea49dd41';

      const user_info = await fetchUserData(user_id);

      console.log('after', error, user_info);

      if (error === null && user_info !== null) {
        const mealList = user_info.mealList;

        setUser({
          user_id: user_id,
          mealList: mealList,
        });

        const meals = mealList.split(' ');
        var status = !meals.includes(mealCode) ? 'approved' : 'denied';

        /* Check if user_id was already scanned within the last minute
         * If so, set status to the previous status
         */
        for (let i = logs.length - 1; i >= 0; i--) {
          const log = logs[i];

          if (log.code === user_id) {
            const logTime = new Date(log.time);
            const currentTime = new Date();

            const timeDiff = currentTime.getTime() - logTime.getTime();
            const minutes = Math.floor(timeDiff / 1000 / 60);

            if (minutes < 1) {
              status = log.status;
            }
          }
        }

        setLogs((prevLogs) => [
          ...prevLogs,
          {
            code: user_id,
            status: status,
            time: new Date().toLocaleString(),
          },
        ]);

        console.log('logs', logs);
        console.log('status', status, meals);

        if (status === 'approved') {
          // Append meal code to user's meal list
          const updated_meal_info = mealList + ' ' + mealCode;
          await updateUserMeals(user_id, updated_meal_info);
        }
      }
    },
    [error, fetchUserData, getMealCode, logs, setUser]
  );

  /**
   * Updates the border color of the scanning box based on the last scanned user's status
   * @returns {string} - The border color
   */
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

  /**
   * Handles when the window is focused
   */
  const onFocus = useCallback(() => {
    console.log('Tab is in focus');
    setIsFocused(true);
  }, []);

  /**
   * Handles when the window is blurred
   */
  const onBlur = useCallback(() => {
    console.log('Tab is blurred');
    setIsFocused(false);
    setScannedCode([]);
  }, []);

  /**
   * Handles when the scan button is clicked. Toggles scanning and resets scannedCode
   */
  const handleScanButton = useCallback(() => {
    setScanning(!scanning);
    setScannedCode([]);
  }, [scanning]);

  /**
   * Updates the user's meal list, given the user's id and updated meal list
   * @param {string} user_id - The user's id
   * @param {string} meal_info - The user's updated meal list
   */
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

  /**
   * Detects if the user is scanning a code manually - like with their phone. If so, parse the code and treat it as a scan
   */
  useEffect(() => {
    const queryParams = queryString.parse(window.location.search);

    if ('id' in queryParams && queryParams.id !== '') {
      setMode('manual');
      console.log('manual', queryParams['id']);

      handleScan(queryParams['id']);
    }
  }, []);

  /**
   * Detects a key press. If the key is enter, parse all the keys pressed and filter out extraneous keys.
   * Then, join the array into a string and call the handleScan function with the string as the user id.
   */
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Enter') {
        const code = scannedCode
          .filter((x) => !extraneousKeys.includes(x)) // Remove extraneous keys
          .join(''); // Join the array into a string

        console.log(code);

        const queryParams = queryString.parse(code); // Parse url to get user id

        if ('id' in queryParams && queryParams.id !== '') {
          handleScan(queryParams['id']);
        }

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

  /**
   * Detects if the window is focused or blurred. If the window is blurred, pause scanning.
   */
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

  return (
    <div className={['h-screen bg-[#fefafc]'].join(' ')}>
      {/* Navbar */}
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

      {/* Body */}
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

        {/* Check if there are meals */}
        {getMeal() !== null ? (
          <>
            {/* Display meal */}
            <p className={['text-center text-xl mt-4 mb-4'].join(' ')}>
              {/* Show day of the week */}
              {new Date().toLocaleString('en-us', { weekday: 'long' })}{' '}
              {getMeal()}
            </p>

            {/* If mode is scan, then show button */}
            {mode === 'scan' && (
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
            )}

            {/* If currently scanning, or mode is manual, show the scan status */}
            {(scanning || mode === 'manual') && (
              <div
                className={[
                  'mt-8 mx-auto transition-all flex justify-center items-center w-1/2 max-w-2xl min-h-96',
                  'border-2 rounded-xl flex flex-col text-center',
                  getBorderColor(),
                ].join(' ')}>
                {/* Check if window is focused */}
                {isFocused ? (
                  <>
                    {/* Check if there are any scanned users */}
                    {logs.length > 0 ? (
                      <>
                        <p className={['text-xl'].join(' ')}>User ID:</p>
                        <p
                          className={[
                            'text-xl',
                            logs[logs.length - 1].status === 'approved'
                              ? 'text-tree-green'
                              : 'text-red-500',
                          ].join(' ')}>
                          {user?.user_id}
                        </p>
                        <p
                          className={[
                            'text-xl mt-4',
                            logs[logs.length - 1].status === 'approved'
                              ? 'text-tree-green'
                              : 'text-red-500',
                          ].join(' ')}>
                          {logs[logs.length - 1].status === 'approved'
                            ? 'Approved'
                            : 'Denied (already scanned)'}
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
          </>
        ) : (
          <p className={['text-center text-xl mt-6'].join(' ')}>
            No meals available at this time
          </p>
        )}
      </div>
    </div>
  );
};

export default Meals;
