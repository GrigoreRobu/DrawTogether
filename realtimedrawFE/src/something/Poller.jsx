import { useEffect } from 'react';
import { USER_URL } from '../constants.js';
// A little something to not let the server spin down haha
export default function Poller({ intervalMs = 120000 }) {
  useEffect(() => {
    let id;

    async function ping() {
      try {
        await fetch(USER_URL);
      } catch (e) {
        console.error('Poll error', e);
      }
    }

    ping();
    id = setInterval(ping, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs]);

  return null;
}
