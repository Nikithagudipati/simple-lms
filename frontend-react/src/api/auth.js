import axios from "./axios";

export const login = async (email, password) => {
  const res = await axios.post("/auth/login", { email, password });

  localStorage.setItem("token", res.data.token);
  localStorage.setItem("role", res.data.role);
  localStorage.setItem("name", res.data.name);

  return res.data.role;
};

export const logout = () => {
  localStorage.clear();
  window.location.href = "/";
};
