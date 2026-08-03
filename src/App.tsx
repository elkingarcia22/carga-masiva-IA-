import { TooltipProvider } from "@/components/ui/tooltip";
import { UbitsToaster } from "@/components/feedback";
import { EncuestasDashboard } from "@/screens/EncuestasDashboard";
import { PlaygroundShellDemo } from "@/screens/PlaygroundShellDemo";

function App() {
  return (
    <TooltipProvider>
      <UbitsToaster />
      <PlaygroundShellDemo>
        <EncuestasDashboard />
      </PlaygroundShellDemo>
    </TooltipProvider>
  );
}

export default App;
