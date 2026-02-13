import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Test from "../components/test";
import SignupPage from "../SignupPage.jsx";
import LoginPage from "../components/LoginPage.jsx"; // You'll need to create this

const App = () => {
  const [currentView, setCurrentView] = useState("signup"); // signup | login | main

  if (currentView === "signup") {
    return (
      <SignupPage 
        onSignupSuccess={() => setCurrentView("login")}
        onGoLogin={() => setCurrentView("login")}
      />
    );
  }

  if (currentView === "login") {
    return (
      <LoginPage 
        onLoginSuccess={() => setCurrentView("main")}
        onGoSignup={() => setCurrentView("signup")}
      />
    );
  }

  if (currentView === "main") {
    return <Test />; // Your main application component
  }

  return <SignupPage onSignupSuccess={() => setCurrentView("login")} />;
};

export default App;
