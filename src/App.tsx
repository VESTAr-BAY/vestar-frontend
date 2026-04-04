import { useState } from "react";
import { RouterProvider } from "react-router";
import { SplashScreen } from "./components/shared/SplashScreen";
import { router } from "./routes";

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <RouterProvider router={router} />
    </>
  );
}

export default App;
