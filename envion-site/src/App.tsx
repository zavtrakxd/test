import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import LiveStats from "./components/LiveStats";
import Features from "./components/Features";
import Gamemodes from "./components/Gamemodes";
import HowToJoin from "./components/HowToJoin";
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
        <Gamemodes />
        <HowToJoin />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
