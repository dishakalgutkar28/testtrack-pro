import React from "react";

function Register() {
  return (
    <div style={{textAlign:"center",marginTop:"100px"}}>
      <h2>TestTrack Register</h2>

      <input placeholder="Name" /><br/><br/>
      <input placeholder="Email" /><br/><br/>
      <input type="password" placeholder="Password"/><br/><br/>

      <button>Register</button>
    </div>
  );
}

export default Register;
