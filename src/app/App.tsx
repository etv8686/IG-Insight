import ComparePage from "../features/compare/ComparePage";
import { SpeedInsights } from '@vercel/speed-insights/react';

export default function App() {
  return (
    <>
      <ComparePage />
      <SpeedInsights />
    </>
  );
}