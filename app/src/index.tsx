import React from 'react';
import ReactDOM from "react-dom";

import "./index.css";

// Pages
import Prove from "./pages/Prove";
import Verify from "./pages/Verify";

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Prove />}></Route>
        <Route path="/verify/:id" element={<Verify />}></Route>
      </Routes>
    </Router>
  </React.StrictMode>,
  document.getElementById("root")
);

