import React from "react";

function Login() {
  return (
    <div style={{textAlign:"center",marginTop:"100px"}}>
      <h2>TestTrack Login</h2>

      <input placeholder="Email" /><br/><br/>
      <input placeholder="Password" type="password"/><br/><br/>

      <button>Login</button>
    </div>
  );
}

export default Login;
