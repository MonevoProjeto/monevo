import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../contexts/AppContext";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useApp();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);
      // Aqui você pode buscar os dados do usuário:
      fetch("http://localhost:8000/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((user) => {
          setCurrentUser(user);
          navigate("/index", { replace: true });
        })
        .catch(() => navigate("/auth", { replace: true }));
    } else {
      navigate("/auth");
    }
  }, [navigate, setCurrentUser]);

  return <p>Autenticando com o Google...</p>;
};

export default AuthCallback;
