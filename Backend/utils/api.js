import axios from 'axios';
import { API_BASE_URL } from '../config'; // Assuming you have a config file

export const checkServerConnection = async () => {
  try {
    await axios.get(`${API_BASE_URL}/healthcheck`, { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
};