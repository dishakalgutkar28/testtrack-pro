import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link> |
      <Link to="/testcase">Testcase</Link> |
      <Link to="/bug">Bug</Link> |
      <Link to="/execute">Execute</Link>
    </nav>
  );
}

export default Navbar;
