export class AuthService {
  // ✅ WORKING DEMO TOKEN (replace with your real token)
  private static DEMO_TOKEN = "demo_token_12345";

  static getToken(): string {
    return this.DEMO_TOKEN; // For now, always return demo token
  }

  static getAuthHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`,
    };
  }

  static getDemoUser() {
    return {
      id: '9a105e6f-ca83-4e09-ab83-46dfdfef112e',
      email: 'test@example.com'
    };
  }
}
