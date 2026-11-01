import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { errMsg } from "../api";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(form.name, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <form className="card auth-box" onSubmit={submit}>
      <h2>Create account</h2>
      <label>Name<input value={form.name} onChange={set("name")} required /></label>
      <label>Email<input type="email" value={form.email} onChange={set("email")} required /></label>
      <label>Password<input type="password" minLength={6} value={form.password} onChange={set("password")} required /></label>
      {error && <p className="error">{error}</p>}
      <button className="btn">Sign up</button>
      <p className="muted">Already registered? <Link to="/login">Login</Link></p>
    </form>
  );
}
