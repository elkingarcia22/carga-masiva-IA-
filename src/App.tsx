import { TooltipProvider } from "@/components/ui/tooltip";
import { UbitsToaster } from "@/components/feedback";
import { CiclosObjetivosDashboard } from "@/screens/CiclosObjetivosDashboard";
import { PlaygroundShellDemo } from "@/screens/PlaygroundShellDemo";

function App() {
  return (
    <TooltipProvider>
      <UbitsToaster />
      <PlaygroundShellDemo>
        <CiclosObjetivosDashboard />
      </PlaygroundShellDemo>
    </TooltipProvider>
  );
}

export default App;
