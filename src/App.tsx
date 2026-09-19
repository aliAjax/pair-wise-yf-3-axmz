import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import ReviewStation from "@/pages/ReviewStation";
import SiteNav from "@/components/SiteNav";
import { useMemoryStore } from "@/store/memoryStore";
import { getReviewStatus } from "@/utils/constants";

export default function App() {
  const memories = useMemoryStore((s) => s.memories);
  const pendingCount = memories.filter((m) => getReviewStatus(m) === 'pending').length;

  return (
    <Router>
      <SiteNav pendingCount={pendingCount} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/review" element={<ReviewStation />} />
      </Routes>
    </Router>
  );
}
