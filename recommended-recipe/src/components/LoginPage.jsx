import { useState } from 'react';
import { publicFetch, saveTokens } from '../lib/api';

function LoginPage({ onLoginSuccess, onGoSignup }) {
  const [formData, setFormData] = useState({
    id: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await publicFetch('/auth/login', {
        method: 'POST',
        body: {
          id: formData.id,
          password: formData.password
        }
      });

      // Save the token
      saveTokens(response);
      
      console.log('Login successful:', response);
      alert('로그인 성공!');
      
      // Navigate to main page
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="header">
        <h1>원룸 레시피</h1>
      </div>

      <div className="login-container">
        <h2>로그인</h2>
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="id">아이디</label>
            <input
              type="text"
              id="id"
              name="id"
              value={formData.id}
              onChange={handleChange}
              required
              placeholder="아이디를 입력하세요"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <div className="auth-footer">
            <span>계정이 없나요?</span>
            <button type="button" className="link-btn" onClick={onGoSignup}>
              회원가입
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;