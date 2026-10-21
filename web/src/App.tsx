import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import Estimate from "./pages/Estimate";
import About from "./pages/About";
import CodeGuide from "./pages/CodeGuide";
import HowItWorks from "./pages/HowItWorks";
import { NotFound } from "./pages/Placeholders";
import { ErrorBoundary } from "./components/ErrorBoundary";
export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Estimate />} />
          <Route path="how-it-works" element={<HowItWorks />} />
          <Route path="code-guide" element={<CodeGuide />} />
          <Route path="about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}