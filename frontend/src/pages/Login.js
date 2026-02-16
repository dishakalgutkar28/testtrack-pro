import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/dashboard");
  };

  return (
    <div style={{textAlign:"center",marginTop:"100px"}}>
      <h2>Login Page</h2>

      <input placeholder="Email" /><br/><br/>
      <input type="password" placeholder="Password"/><br/><br/>

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
export default Login;