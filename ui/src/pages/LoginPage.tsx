import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clients, setStoredToken } from "../api/client";

export function LoginPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const result = await clients("").auth.checkToken(token);
    if (!result.valid) {
      setError("Token was rejected.");
      return;
    }
    setStoredToken(token);
    navigate("/");
  }

  return (
    <main className="login">
      <form className="panel narrow" onSubmit={submit}>
        <h1>7router</h1>
        <label>
          Access token
          <input value={token} onChange={(event) => setToken(event.target.value)} type="password" autoFocus />
        </label>
        {error && <p className="error">{error}</p>}
        <button>Continue</button>
      </form>
    </main>
  );
}

