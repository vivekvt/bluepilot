import axios from 'axios';

const token = process.env.VERCEL_TOKEN;

if (!token) {
  throw new Error('Vercel token not configured');
}

export const vercelApiClient = axios.create({
  baseURL: 'https://api.vercel.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
});
