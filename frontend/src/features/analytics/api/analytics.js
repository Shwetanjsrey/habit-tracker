import { request } from '../../../lib/api';

export const fetchAnalytics = () => request('/analytics');
