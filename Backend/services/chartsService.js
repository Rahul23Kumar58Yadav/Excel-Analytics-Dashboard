import axios from 'axios';
import API_BASE_URL from '../../excel_Analytics/src/config';

// src/services/chartService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1';

export const fetchAllCharts = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/charts`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data?.charts || [];
  } catch (error) {
    console.error('Error fetching charts:', error);
    throw error;
  }
};

export const saveChart = async (chartData, token) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/charts`, chartData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error saving chart:', error);
    throw error;
  }
};