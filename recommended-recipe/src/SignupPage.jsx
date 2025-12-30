import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './signup.css';
import { publicFetch } from './lib/api';

function SignupPage({ onSignupSuccess, onGoLogin }) {
  const [formData, setFormData] = useState({
    "id": '',
    "password": '',
    "name": '',
    "nickname": '',
    "email": '',
    "birth": '',
    "gender": 'M' // Default to 'M' to match backend enum
  });

  // 유효성 검사 및 에러 메시지 상태
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordMsgClass, setPasswordMsgClass] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  // 비밀번호와 비밀번호 확인 필드가 변경될 때마다 일치 여부 검사
  useEffect(() => {
    if (!formData.passwordConfirm) {
      setPasswordMsg('');
      setPasswordMsgClass('');
      return;
    }

    if (formData.password && formData.password === formData.passwordConfirm) {
      setPasswordMsg('비밀번호가 일치합니다.');
      setPasswordMsgClass('success');
    } else {
      setPasswordMsg('비밀번호가 일치하지 않습니다.');
      setPasswordMsgClass('error');
    }
  }, [formData.password, formData.passwordConfirm]);


  const handleCheckUserid = () => {
    if (!formData.id) {
      alert("아이디를 입력해주세요.");
      return;
    }

    if (formData.id === "admin" || formData.id === "test") {
      alert("이미 사용 중인 아이디입니다.");
    } else {
      alert("사용 가능한 아이디입니다.");
    }
  };
  
  const handleCheckNickname = () => {
    if (!formData.nickname) {
      alert("닉네임을 입력해주세요.");
      return;
    }

    if (formData.nickname === "admin" || formData.nickname === "test") {
      alert("이미 사용 중인 닉네임입니다.");
    } else {
      alert("사용 가능한 닉네임입니다.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    for (const key in formData) {
      if (!formData[key]) {
        setError('모든 필드를 입력해주세요.');
        return;
      }
    }
    
    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
        
    console.log('Form Data Submitted:', formData);
    alert('회원가입 완료!');
    navigate('/');
  };

  const submitTest = async () => {
    console.log('submitTest 실행');
    
    // Validate required fields
    const requiredFields = ['id', 'password', 'name', 'nickname', 'email', 'birth', 'gender'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        setError(`${field} 필드를 입력해주세요.`);
        return;
      }
    }

    // Check password confirmation
    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      // Prepare data for backend (exclude passwordConfirm)
      const { passwordConfirm, ...submitData } = formData;
      
      const response = await publicFetch('/auth/register', {
        method: 'POST',
        body: submitData
      });

      console.log('Registration successful:', response);
      alert('회원가입 완료!');
      // ✅ Call the callback to navigate to login page
      if (onSignupSuccess) {
        onSignupSuccess();
      }
    } catch (error) {
      console.error('Registration failed:', error);
      setError(error.message || '회원가입에 실패했습니다.');
    }
  }


  return (
    <>
    <div>
      <div className="header">
        <Link to="/">원룸 레시피</Link>
      </div>

      <div className="signup-container">
        <h2>회원가입</h2>
        {error && <div className="error-msg">{error}</div>}
        {/* <form onSubmit={handleSubmit}> */}
          {                                                     }
          <div className="input-group">
            <label htmlFor="name">이름</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label htmlFor="gender">성별</label>
            <select id="gender" name="gender" value={formData.gender} onChange={handleChange} required>
              <option value="M">남성</option>
              <option value="F">여성</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="birth">생년월일</label>
            <input type="date" id="birth" name="birth" value={formData.birth} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label htmlFor="email">이메일</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label htmlFor="id">아이디</label>
            <div className="nickname-group">
              <input type="text" id="id" name="id" value={formData.id} onChange={handleChange} required />
              <button type="button" onClick={handleCheckUserid}>중복확인</button>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">비밀번호</label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label htmlFor="passwordConfirm">비밀번호 확인</label>
            <input type="password" id="passwordConfirm" name="passwordConfirm" value={formData.passwordConfirm} onChange={handleChange} required />
            {passwordMsg && <div className={passwordMsgClass}>{passwordMsg}</div>}
          </div>

          <div className="input-group">
            <label htmlFor="nickname">닉네임</label>
            <div className="nickname-group">
              <input type="text" id="nickname" name="nickname" value={formData.nickname} onChange={handleChange} required />
              <button type="button" onClick={handleCheckNickname}>중복확인</button>
            </div>
          </div>

          <button type="button" className="submit-btn" onClick={submitTest}>회원가입</button>
          
          <div className="auth-footer">
            <span>이미 계정이 있나요?</span>
            <button type="button" className="link-btn" onClick={onGoLogin}>
              로그인
            </button>
          </div>
        {/* </form> */}
      </div>
      </div>
    </>
  );
}

export default SignupPage;