import React from 'react';
import ReactDOM from "react-dom";

import "./index.css";

//Layout
import Layout from './components/Layout';

// Pages
import Home from "./pages/Home";
import Prove from "./pages/Prove";
import Verify from "./pages/Verify";

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />}></Route>
          <Route path="/prove" element={<Prove />}></Route>
          <Route path="/verify/:id" element={<Verify />}></Route>
        </Routes>
      </Layout>
    </Router>
  </React.StrictMode>,
  document.getElementById("root")
);

