const axios = require('axios');

const DIGILOCKER_CONFIG = {
  clientId: process.env.DIGILOCKER_CLIENT_ID,
  clientSecret: process.env.DIGILOCKER_CLIENT_SECRET,
  redirectUri: process.env.DIGILOCKER_REDIRECT_URI,
  authEndpoint: 'https://api.digitallocker.gov.in/public/oauth2/1/authorize',
  tokenEndpoint: 'https://api.digitallocker.gov.in/public/oauth2/2/token',
  documentsEndpoint: 'https://api.digitallocker.gov.in/public/oauth2/1/files'
};

class DigilockerService {
  static getAuthUrl() {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: DIGILOCKER_CONFIG.clientId,
      redirect_uri: DIGILOCKER_CONFIG.redirectUri,
      state: Math.random().toString(36).substring(7)
    });

    return `${DIGILOCKER_CONFIG.authEndpoint}?${params.toString()}`;
  }

  static async getAccessToken(code) {
    try {
      const response = await axios.post(DIGILOCKER_CONFIG.tokenEndpoint, {
        code,
        grant_type: 'authorization_code',
        client_id: DIGILOCKER_CONFIG.clientId,
        client_secret: DIGILOCKER_CONFIG.clientSecret,
        redirect_uri: DIGILOCKER_CONFIG.redirectUri
      });

      return response.data.access_token;
    } catch (error) {
      console.error('Digilocker token error:', error);
      throw error;
    }
  }

  static async getPassportDocument(accessToken) {
    try {
      const response = await axios.get(DIGILOCKER_CONFIG.documentsEndpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { type: 'passport' }
      });

      return response.data;
    } catch (error) {
      console.error('Digilocker document error:', error);
      throw error;
    }
  }
}

module.exports = DigilockerService; 