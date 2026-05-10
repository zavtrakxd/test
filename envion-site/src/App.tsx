import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import LiveStats from "./components/LiveStats";
import Features from "./components/Features";
import HowToJoin from "./components/HowToJoin";
import Donate from "./components/Donate";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <main className="relative">
        <Hero />
        <LiveStats />
        <Features />
        <HowToJoin />
        <Donate />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
